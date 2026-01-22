// Proactive Suggestions Engine
// Generates AI-powered campaign suggestions based on data signals

import birdeye, { BirdeyeReview } from './birdeye';
import knowledgeBase from './pinecone';
import { withFailsafe } from '../utils/failsafe';

export interface Suggestion {
  id: string;
  type: 'referral' | 'recovery' | 'competitive' | 'seasonal' | 'win-back' | 'loyalty';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  suggestedAudience?: {
    name: string;
    count?: number;
    criteria?: string;
  };
  suggestedChannels?: string[];
  potentialImpact?: {
    metric: string;
    estimate: string;
  };
  dataSource: string;
  createdAt: string;
  expiresAt?: string;
}

// Generate suggestions based on various data signals
export async function generateSuggestions(businessId?: string): Promise<Suggestion[]> {
  const result = await withFailsafe(
    `suggestions_${businessId || 'default'}`,
    async () => {
      const suggestions: Suggestion[] = [];

      // 1. Analyze recent reviews for opportunities
      const reviews = await birdeye.getReviews(businessId || 'default', { count: 20 });
      const reviewSuggestions = await analyzeReviewsForSuggestions(reviews);
      suggestions.push(...reviewSuggestions);

      // 2. Check for win-back opportunities (mock data for demo)
      const winBackSuggestion = await generateWinBackSuggestion();
      if (winBackSuggestion) suggestions.push(winBackSuggestion);

      // 3. Check for seasonal opportunities
      const seasonalSuggestion = await generateSeasonalSuggestion();
      if (seasonalSuggestion) suggestions.push(seasonalSuggestion);

      // 4. Check competitor activity
      const competitiveSuggestion = await generateCompetitiveSuggestion(businessId);
      if (competitiveSuggestion) suggestions.push(competitiveSuggestion);

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return suggestions;
    },
    []
  );

  return result.data;
}

// Analyze reviews to find referral and recovery opportunities
async function analyzeReviewsForSuggestions(reviews: BirdeyeReview[]): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Count 5-star reviews in last week
  const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent5StarReviews = reviews.filter(r => {
    const reviewDate = new Date(r.reviewDate);
    return r.rating === 5 && reviewDate >= recentDate;
  });

  // Referral opportunity
  if (recent5StarReviews.length >= 3) {
    suggestions.push({
      id: `suggestion-referral-${Date.now()}`,
      type: 'referral',
      priority: 'high',
      title: `${recent5StarReviews.length} Happy Customers Ready for Referral`,
      description: `${recent5StarReviews.length} customers left 5-star reviews this week. This is a perfect opportunity to launch a referral campaign.`,
      reason: 'Research shows that customers who leave 5-star reviews are 3x more likely to refer friends when asked.',
      suggestedAudience: {
        name: 'Recent 5-Star Reviewers',
        count: recent5StarReviews.length,
        criteria: '5-star review in last 7 days'
      },
      suggestedChannels: ['email', 'sms'],
      potentialImpact: {
        metric: 'New referrals',
        estimate: `${Math.round(recent5StarReviews.length * 0.4)} expected referrals`
      },
      dataSource: 'Birdeye Reviews',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  // Recovery opportunity
  const negativeReviews = reviews.filter(r => r.rating <= 2);
  if (negativeReviews.length > 0) {
    suggestions.push({
      id: `suggestion-recovery-${Date.now()}`,
      type: 'recovery',
      priority: 'high',
      title: `${negativeReviews.length} Customers Need Recovery Outreach`,
      description: `${negativeReviews.length} customers left negative reviews. Proactive recovery can turn detractors into promoters.`,
      reason: '70% of complaining customers will do business with you again if you resolve the complaint.',
      suggestedAudience: {
        name: 'Negative Review Customers',
        count: negativeReviews.length,
        criteria: '1-2 star review'
      },
      suggestedChannels: ['email'],
      potentialImpact: {
        metric: 'Customer retention',
        estimate: `Potentially save ${negativeReviews.length} customers`
      },
      dataSource: 'Birdeye Reviews',
      createdAt: new Date().toISOString()
    });
  }

  return suggestions;
}

// Generate win-back suggestion for inactive customers
async function generateWinBackSuggestion(): Promise<Suggestion | null> {
  // Mock data - in production this would come from CRM/database
  const inactiveCount = 847; // Customers inactive for 90+ days

  if (inactiveCount > 100) {
    return {
      id: `suggestion-winback-${Date.now()}`,
      type: 'win-back',
      priority: 'medium',
      title: `${inactiveCount} Inactive Customers - Win-Back Opportunity`,
      description: `${inactiveCount} customers haven't visited in 90+ days. A targeted win-back campaign can re-engage 15-20% of them.`,
      reason: 'Based on Q3 data, win-back campaigns have 28.5% open rates and 6.1% conversion at 15% discount.',
      suggestedAudience: {
        name: 'Inactive 90+ Days',
        count: inactiveCount,
        criteria: 'No service visit in 90 days, has valid contact info'
      },
      suggestedChannels: ['email', 'sms'],
      potentialImpact: {
        metric: 'Recovered customers',
        estimate: `${Math.round(inactiveCount * 0.061)} expected returns ($${Math.round(inactiveCount * 0.061 * 450).toLocaleString()} potential revenue)`
      },
      dataSource: 'CRM Data',
      createdAt: new Date().toISOString()
    };
  }

  return null;
}

// Generate seasonal suggestion based on current date
async function generateSeasonalSuggestion(): Promise<Suggestion | null> {
  const month = new Date().getMonth();
  const suggestions: Record<number, Suggestion> = {
    0: { // January
      id: `suggestion-seasonal-${Date.now()}`,
      type: 'seasonal',
      priority: 'medium',
      title: 'New Year Service Special Campaign',
      description: 'January is a great time for "New Year, New Car Care" messaging. Customers are receptive to fresh starts.',
      reason: 'Per Marketing Strategy 2025, January service specials historically perform 22% above average.',
      suggestedChannels: ['email', 'social'],
      potentialImpact: {
        metric: 'Service appointments',
        estimate: '+22% above baseline'
      },
      dataSource: 'Marketing Calendar',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(2026, 1, 1).toISOString()
    },
    7: { // August
      id: `suggestion-seasonal-${Date.now()}`,
      type: 'seasonal',
      priority: 'high',
      title: 'Back to School Safety Campaign',
      description: 'August is prime time for back-to-school safety checks. Target families with school-age children.',
      reason: 'Q3 report showed Back to School campaign had 31.4% open rate (exceeded 28% target by 12%).',
      suggestedAudience: {
        name: 'Parents with School-Age Children',
        criteria: 'SUV/minivan owners with family tag'
      },
      suggestedChannels: ['email', 'sms', 'social'],
      potentialImpact: {
        metric: 'Service appointments',
        estimate: '+18% above baseline'
      },
      dataSource: 'Marketing Calendar + Q3 Performance',
      createdAt: new Date().toISOString()
    },
    11: { // December
      id: `suggestion-seasonal-${Date.now()}`,
      type: 'seasonal',
      priority: 'medium',
      title: 'Year-End Loyalty & Gift Card Campaign',
      description: 'December is ideal for loyalty rewards and gift card promotions.',
      reason: 'Marketing Strategy 2025 includes December gift card campaign.',
      suggestedChannels: ['email', 'social'],
      potentialImpact: {
        metric: 'Gift card sales',
        estimate: 'Target: $50,000 in gift card sales'
      },
      dataSource: 'Marketing Calendar',
      createdAt: new Date().toISOString()
    }
  };

  return suggestions[month] || null;
}

// Generate competitive response suggestion
async function generateCompetitiveSuggestion(businessId?: string): Promise<Suggestion | null> {
  const competitors = await birdeye.getCompetitorSummary(businessId || 'default');

  // Check for specific competitive threats
  const valleyHonda = competitors.competitors.find(c => c.name === 'Valley Honda');

  if (valleyHonda && valleyHonda.rating >= 4.3) {
    return {
      id: `suggestion-competitive-${Date.now()}`,
      type: 'competitive',
      priority: 'medium',
      title: 'Valley Honda Counter-Marketing Opportunity',
      description: `Valley Honda has ${valleyHonda.reviewCount} reviews. Consider a campaign highlighting Premier Nissan's faster service times (1.8 hrs vs their 2.5 hrs).`,
      reason: 'Per Competitor Analysis, Valley Honda is our primary threat. Our differentiator is faster, more personal service.',
      suggestedChannels: ['email', 'social'],
      potentialImpact: {
        metric: 'Market share',
        estimate: 'Defend against competitor conquest'
      },
      dataSource: 'Competitor Analysis',
      createdAt: new Date().toISOString()
    };
  }

  return null;
}

// Get suggestion by ID
export async function getSuggestionById(id: string): Promise<Suggestion | null> {
  const suggestions = await generateSuggestions();
  return suggestions.find(s => s.id === id) || null;
}

// Act on a suggestion (create campaign from it)
export function suggestionToCampaignParams(suggestion: Suggestion): {
  type: string;
  name: string;
  audience: { name: string; count?: number };
  channels: string[];
  goal: string;
} {
  return {
    type: suggestion.type === 'referral' ? 'referral'
      : suggestion.type === 'recovery' ? 'win-back'
      : suggestion.type === 'win-back' ? 'win-back'
      : 'promotional',
    name: suggestion.title,
    audience: suggestion.suggestedAudience || { name: 'All Customers' },
    channels: suggestion.suggestedChannels || ['email'],
    goal: suggestion.description
  };
}

export default {
  generateSuggestions,
  getSuggestionById,
  suggestionToCampaignParams
};
