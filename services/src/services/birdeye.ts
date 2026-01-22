// Birdeye Integration Service
// Fetches reviews and generates AI recommendations

import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { withFailsafe } from '../utils/failsafe';

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return anthropicClient;
}

const BIRDEYE_API_BASE = 'https://api.birdeye.com/resources/v1';

export interface BirdeyeReview {
  id: string;
  rating: number;
  reviewDate: string;
  reviewer: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  comments: string;
  source: string;
  status: 'published' | 'pending' | 'archived';
  response?: string;
  responseDate?: string;
}

export interface ReviewAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  themes: string[];
  actionable: boolean;
  suggestedAction?: {
    type: 'referral' | 'recovery' | 'follow-up' | 'none';
    description: string;
    urgency: 'high' | 'medium' | 'low';
  };
  suggestedResponse?: string;
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  commonThemes: { theme: string; count: number }[];
  recentTrend: 'improving' | 'stable' | 'declining';
}

// Get reviews from Birdeye API
export async function getReviews(
  businessId: string,
  options: {
    count?: number;
    startDate?: string;
    endDate?: string;
    minRating?: number;
    maxRating?: number;
  } = {}
): Promise<BirdeyeReview[]> {
  const result = await withFailsafe(
    `birdeye_reviews_${businessId}`,
    async () => {
      if (!process.env.BIRDEYE_API_KEY) {
        console.warn('BIRDEYE_API_KEY not configured, using mock data');
        return getMockReviews();
      }

      const params = new URLSearchParams({
        sindex: '0',
        count: String(options.count || 20)
      });

      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const response = await axios.get(
        `${BIRDEYE_API_BASE}/business/${businessId}/review?${params}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.BIRDEYE_API_KEY}`
          }
        }
      );

      return response.data.reviews || [];
    },
    getMockReviews()
  );

  // Apply filters if using mock data
  let reviews = result.data;
  if (options.minRating) {
    reviews = reviews.filter((r: BirdeyeReview) => r.rating >= options.minRating!);
  }
  if (options.maxRating) {
    reviews = reviews.filter((r: BirdeyeReview) => r.rating <= options.maxRating!);
  }

  return reviews.slice(0, options.count || 20);
}

// Analyze a single review with AI
export async function analyzeReview(review: BirdeyeReview): Promise<ReviewAnalysis> {
  const result = await withFailsafe(
    `birdeye_analyze_${review.id}`,
    async () => {
      const anthropic = getAnthropicClient();

      const prompt = `Analyze this customer review for Premier Nissan and provide actionable insights.

REVIEW:
Rating: ${review.rating}/5 stars
Date: ${review.reviewDate}
Comment: "${review.comments}"

Analyze and respond with JSON:
{
  "sentiment": "positive" | "neutral" | "negative",
  "themes": ["array of 2-4 themes mentioned"],
  "actionable": true/false,
  "suggestedAction": {
    "type": "referral" | "recovery" | "follow-up" | "none",
    "description": "what action to take",
    "urgency": "high" | "medium" | "low"
  },
  "suggestedResponse": "a brief, professional response if appropriate"
}

For suggestedAction:
- "referral": 5-star review, happy customer could be a referral source
- "recovery": 1-2 star review, needs immediate attention
- "follow-up": 3-4 star review, opportunity to improve
- "none": no action needed`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '{}';

      return JSON.parse(text);
    },
    // Fallback analysis based on rating
    {
      sentiment: review.rating >= 4 ? 'positive' : review.rating === 3 ? 'neutral' : 'negative',
      themes: ['service quality', 'customer experience'],
      actionable: review.rating <= 2 || review.rating === 5,
      suggestedAction: review.rating === 5
        ? { type: 'referral' as const, description: 'Happy customer - send referral request', urgency: 'medium' as const }
        : review.rating <= 2
        ? { type: 'recovery' as const, description: 'Dissatisfied customer - needs follow-up', urgency: 'high' as const }
        : { type: 'none' as const, description: 'Standard follow-up', urgency: 'low' as const },
      suggestedResponse: review.rating >= 4
        ? 'Thank you for your wonderful feedback! We appreciate your trust in Premier Nissan.'
        : 'We appreciate your feedback and apologize for any inconvenience. Please contact us so we can make this right.'
    }
  );

  return result.data;
}

// Analyze multiple reviews and generate summary
export async function analyzeReviews(reviews: BirdeyeReview[]): Promise<ReviewSummary> {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
      commonThemes: [],
      recentTrend: 'stable'
    };
  }

  const result = await withFailsafe(
    `birdeye_summary_${reviews.length}`,
    async () => {
      const anthropic = getAnthropicClient();

      const reviewsText = reviews.map(r =>
        `Rating: ${r.rating}/5, Date: ${r.reviewDate}\n"${r.comments.substring(0, 200)}"`
      ).join('\n\n');

      const prompt = `Analyze these ${reviews.length} customer reviews for Premier Nissan and identify patterns.

REVIEWS:
${reviewsText}

Respond with JSON:
{
  "commonThemes": [
    { "theme": "theme name", "count": estimated_mentions },
    ...
  ],
  "recentTrend": "improving" | "stable" | "declining",
  "insights": "Brief summary of key findings"
}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '{}';

      return JSON.parse(text);
    },
    { commonThemes: [], recentTrend: 'stable', insights: '' }
  );

  // Calculate basic stats
  const ratings = reviews.map(r => r.rating);
  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  return {
    totalReviews: reviews.length,
    averageRating: Math.round(avgRating * 10) / 10,
    positiveCount: reviews.filter(r => r.rating >= 4).length,
    neutralCount: reviews.filter(r => r.rating === 3).length,
    negativeCount: reviews.filter(r => r.rating <= 2).length,
    commonThemes: result.data.commonThemes || [],
    recentTrend: result.data.recentTrend || 'stable'
  };
}

// Get competitor summary (mock for demo)
export async function getCompetitorSummary(businessId: string): Promise<{
  competitors: { name: string; rating: number; reviewCount: number }[];
  comparison: string;
}> {
  // Mock data for demo
  return {
    competitors: [
      { name: 'Valley Honda', rating: 4.4, reviewCount: 1230 },
      { name: 'Downtown Toyota', rating: 4.7, reviewCount: 956 },
      { name: 'Metro Chevrolet', rating: 4.0, reviewCount: 612 }
    ],
    comparison: 'Premier Nissan has competitive ratings. Valley Honda has more reviews but similar rating. Focus on increasing review volume while maintaining quality.'
  };
}

// Mock reviews for development/demo
function getMockReviews(): BirdeyeReview[] {
  return [
    {
      id: 'mock-1',
      rating: 5,
      reviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Sarah', lastName: 'M.' },
      comments: 'Absolutely wonderful experience! The service team was professional and efficient. My Rogue was ready ahead of schedule. Highly recommend Premier Nissan!',
      source: 'Google',
      status: 'published'
    },
    {
      id: 'mock-2',
      rating: 5,
      reviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Mike', lastName: 'T.' },
      comments: 'Been bringing my Altima here for 5 years. Consistent quality service and fair pricing. The staff remembers my name which I really appreciate.',
      source: 'Google',
      status: 'published'
    },
    {
      id: 'mock-3',
      rating: 2,
      reviewDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Jennifer', lastName: 'K.' },
      comments: 'Wait time was much longer than quoted. Had to wait 3 hours for what was supposed to be a 90 minute service. Staff was apologetic but this was frustrating.',
      source: 'Google',
      status: 'published'
    },
    {
      id: 'mock-4',
      rating: 4,
      reviewDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'David', lastName: 'R.' },
      comments: 'Good service overall. Price was fair and work was done correctly. Only reason for 4 stars is the waiting area could use some updating.',
      source: 'Yelp',
      status: 'published'
    },
    {
      id: 'mock-5',
      rating: 5,
      reviewDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Lisa', lastName: 'W.' },
      comments: 'Just bought my second car from Premier Nissan. The buying experience was smooth and no-pressure. They really live up to their reputation.',
      source: 'Google',
      status: 'published'
    },
    {
      id: 'mock-6',
      rating: 1,
      reviewDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Robert', lastName: 'H.' },
      comments: 'Terrible experience at the Riverside location. Was quoted one price, charged another. Manager was unhelpful. Will not return.',
      source: 'Google',
      status: 'published'
    },
    {
      id: 'mock-7',
      rating: 5,
      reviewDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Amanda', lastName: 'C.' },
      comments: 'The loaner car service is amazing! Made getting my car serviced so convenient. Will definitely be back.',
      source: 'Facebook',
      status: 'published'
    },
    {
      id: 'mock-8',
      rating: 3,
      reviewDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Tom', lastName: 'B.' },
      comments: 'Average experience. Nothing bad but nothing exceptional either. Prices are competitive with other dealers.',
      source: 'Google',
      status: 'published'
    },
    {
      id: 'mock-9',
      rating: 5,
      reviewDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Emily', lastName: 'S.' },
      comments: 'They found an issue during my oil change that could have been expensive if ignored. Honest service - they showed me exactly what was wrong.',
      source: 'Google',
      status: 'published'
    },
    {
      id: 'mock-10',
      rating: 4,
      reviewDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      reviewer: { firstName: 'Chris', lastName: 'L.' },
      comments: 'Reliable service department. Been coming here for years. Would recommend to anyone looking for a trustworthy Nissan dealer.',
      source: 'Yelp',
      status: 'published'
    }
  ];
}

export default {
  getReviews,
  analyzeReview,
  analyzeReviews,
  getCompetitorSummary
};
