// Content Generation Service
// Generates marketing content with brand voice grounding

import Anthropic from '@anthropic-ai/sdk';
import { withFailsafe } from '../utils/failsafe';
import knowledgeBase from './pinecone';

const BRAND_ID = 'premier-nissan';

// Initialize Anthropic client
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return client;
}

export interface GenerateContentRequest {
  campaignType: 'win-back' | 'promotional' | 'product-launch' | 'nurture' | 'loyalty' | 'event' | 'feedback' | 'announcement' | 'referral' | 'review' | 'conquest' | 'recovery';
  audience: {
    name: string;
    count?: number;
    description?: string;
  } | string;
  channels: ('email' | 'sms' | 'social' | 'in-app')[];
  goal: string;
  brandId?: string;
  customInstructions?: string;
}

export interface EmailContent {
  subject: string;
  previewText: string;
  body: string;
  cta: string;
  ctaUrl?: string;
}

export interface SmsContent {
  message: string;
}

export interface SocialContent {
  post: string;
  hashtags: string[];
}

export interface GeneratedContent {
  email?: EmailContent;
  sms?: SmsContent;
  social?: SocialContent;
  brandScore: number;
  brandScoreDetails: {
    toneAlignment: number;
    voiceConsistency: number;
    messageClarity: number;
    audienceRelevance: number;
  };
  suggestions: string[];
}

// Get brand context for content generation
async function getBrandContext(brandId: string, campaignType: string): Promise<string> {
  const results = await knowledgeBase.queryContext(
    `${campaignType} campaign brand voice tone messaging`,
    8,
    { brandId }
  );

  if (results.length === 0) {
    return '';
  }

  const contextParts = results.map((r, i) => {
    return `[${r.metadata.section || r.metadata.filename}]\n${r.content.substring(0, 800)}`;
  });

  return `BRAND GUIDELINES:\n${contextParts.join('\n\n')}`;
}

// Generate content with brand grounding
export async function generateContent(request: GenerateContentRequest): Promise<GeneratedContent> {
  const brandId = request.brandId || BRAND_ID;

  const result = await withFailsafe(
    `content_gen_${request.campaignType}_${request.channels.join('_')}`,
    async () => {
      const anthropic = getClient();

      // Get brand context
      const brandContext = await getBrandContext(brandId, request.campaignType);

      // Build the prompt
      const channelInstructions = request.channels.map(ch => {
        switch (ch) {
          case 'email':
            return 'EMAIL: Generate subject line (compelling, under 50 chars), preview text (under 100 chars), body (under 150 words, professional yet friendly), and CTA button text.';
          case 'sms':
            return 'SMS: Generate a message under 160 characters that is brief, friendly, and includes a clear call to action.';
          case 'social':
            return 'SOCIAL: Generate a social media post under 280 characters with 2-3 relevant hashtags.';
          default:
            return '';
        }
      }).filter(Boolean).join('\n');

      const prompt = `You are creating marketing content for Premier Nissan.

CAMPAIGN DETAILS:
- Type: ${request.campaignType}
- Audience: ${typeof request.audience === 'string' ? request.audience : request.audience.name}${typeof request.audience === 'object' && request.audience.count ? ` (${request.audience.count.toLocaleString()} customers)` : ''}
${typeof request.audience === 'object' && request.audience.description ? `- Audience Description: ${request.audience.description}` : ''}
- Goal: ${request.goal}
${request.customInstructions ? `- Additional Instructions: ${request.customInstructions}` : ''}

${brandContext}

CONTENT REQUIREMENTS:
${channelInstructions}

IMPORTANT BRAND RULES:
- Use professional yet friendly tone
- No pressure tactics or fear-based messaging
- No ALL CAPS or excessive exclamation marks
- Use personalization placeholders like [First Name] and [Vehicle]
- Focus on value and relationships, not just discounts
- Keep emails under 150 words

Respond in JSON format:
{
  ${request.channels.includes('email') ? '"email": { "subject": "...", "previewText": "...", "body": "...", "cta": "..." },' : ''}
  ${request.channels.includes('sms') ? '"sms": { "message": "..." },' : ''}
  ${request.channels.includes('social') ? '"social": { "post": "...", "hashtags": ["...", "..."] },' : ''}
  "suggestions": ["2-3 suggestions for improving or variations"]
}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '{}';

      let contentData;
      try {
        contentData = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        contentData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      }

      // Calculate brand score
      const brandScore = await calculateBrandScore(contentData, brandId);

      return {
        ...contentData,
        brandScore: brandScore.overall,
        brandScoreDetails: brandScore.details,
        suggestions: contentData.suggestions || []
      };
    },
    // Fallback content
    {
      email: request.channels.includes('email') ? {
        subject: `[First Name], we'd love to see you again`,
        previewText: 'Your Premier Nissan family misses you',
        body: `Hi [First Name],\n\nWe noticed it's been a while since your last visit to Premier Nissan. We hope everything is going well with your [Vehicle]!\n\nAs a valued member of our family, we wanted to reach out and let you know we're here whenever you need us. Whether it's routine maintenance or just a quick check-up, our team is ready to help.\n\nThis month, we're offering a special welcome-back package just for customers like you.\n\nWe'd love to see you soon!\n\nWarm regards,\nThe Premier Nissan Team`,
        cta: 'Schedule Your Visit'
      } : undefined,
      sms: request.channels.includes('sms') ? {
        message: `Hi [First Name]! We miss you at Premier Nissan. Book your service this week and enjoy 15% off. Reply YES to schedule.`
      } : undefined,
      social: request.channels.includes('social') ? {
        post: `Our community means everything to us. Thank you for trusting Premier Nissan with your automotive needs for over 25 years! 🚗`,
        hashtags: ['PremierNissan', 'CommunityFirst', 'TrustedService']
      } : undefined,
      brandScore: 85,
      brandScoreDetails: {
        toneAlignment: 88,
        voiceConsistency: 85,
        messageClarity: 84,
        audienceRelevance: 83
      },
      suggestions: [
        'Consider adding a specific offer or discount to increase urgency',
        'Include customer testimonial for social proof',
        'Test subject lines with and without emoji'
      ]
    }
  );

  return result.data;
}

// Calculate brand score for content
export async function calculateBrandScore(
  content: any,
  brandId: string = BRAND_ID
): Promise<{ overall: number; details: { toneAlignment: number; voiceConsistency: number; messageClarity: number; audienceRelevance: number } }> {
  const result = await withFailsafe(
    `brand_score_${brandId}`,
    async () => {
      const anthropic = getClient();

      // Get brand guidelines for comparison
      const guidelines = await knowledgeBase.queryContext('brand voice guidelines tone personality', 5, { brandId });

      const guidelinesText = guidelines.map(g => g.content).join('\n\n');

      const contentText = JSON.stringify(content, null, 2);

      const prompt = `You are a brand consistency evaluator for Premier Nissan.

BRAND GUIDELINES:
${guidelinesText.substring(0, 3000)}

CONTENT TO EVALUATE:
${contentText}

Score the content on a scale of 0-100 for each dimension:
1. toneAlignment: How well does the tone match the brand guidelines?
2. voiceConsistency: Is the voice consistent throughout the content?
3. messageClarity: Is the message clear and easy to understand?
4. audienceRelevance: Is the content relevant to the target audience?

Respond ONLY with JSON:
{
  "toneAlignment": <number>,
  "voiceConsistency": <number>,
  "messageClarity": <number>,
  "audienceRelevance": <number>,
  "overall": <weighted average>
}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '{}';

      const scores = JSON.parse(text);

      return {
        overall: scores.overall || Math.round((scores.toneAlignment + scores.voiceConsistency + scores.messageClarity + scores.audienceRelevance) / 4),
        details: {
          toneAlignment: scores.toneAlignment || 80,
          voiceConsistency: scores.voiceConsistency || 80,
          messageClarity: scores.messageClarity || 80,
          audienceRelevance: scores.audienceRelevance || 80
        }
      };
    },
    // Fallback score
    {
      overall: 85,
      details: {
        toneAlignment: 85,
        voiceConsistency: 85,
        messageClarity: 85,
        audienceRelevance: 85
      }
    }
  );

  return result.data;
}

// Generate variations of content
export async function generateVariations(
  originalContent: EmailContent | SmsContent | SocialContent,
  contentType: 'email' | 'sms' | 'social',
  count: number = 3,
  brandId: string = BRAND_ID
): Promise<any[]> {
  const result = await withFailsafe(
    `content_variations_${contentType}`,
    async () => {
      const anthropic = getClient();

      const brandContext = await getBrandContext(brandId, 'promotional');

      const prompt = `Generate ${count} variations of the following ${contentType} content while maintaining Premier Nissan's brand voice.

ORIGINAL CONTENT:
${JSON.stringify(originalContent, null, 2)}

${brandContext}

Create ${count} distinct variations that:
- Maintain the same core message and goal
- Use different phrasing, angles, or emotional appeals
- Stay true to the brand voice guidelines
- Are suitable for A/B testing

Respond with a JSON array of ${count} variations in the same format as the original.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '[]';

      try {
        return JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
    },
    []
  );

  return result.data;
}

export default {
  generateContent,
  calculateBrandScore,
  generateVariations
};
