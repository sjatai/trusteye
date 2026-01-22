// Claude API Service
// For AI chat with brand context injection

import Anthropic from '@anthropic-ai/sdk';
import knowledgeBase from './pinecone';
import { withFailsafe } from '../utils/failsafe';
import cache from './cache';

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

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are TrustEye AI, the intelligent marketing assistant. You help create and manage marketing campaigns with full compliance tracking.

## What You Can Do

You can create THREE types of campaigns from real Birdeye data:
1. **Referral campaigns** from 5-star reviews - thank happy customers and ask for referrals
2. **Conquest campaigns** from competitor weaknesses - target customers unhappy with Valley Honda
3. **Recovery campaigns** from negative reviews - win back unhappy customers

All campaigns go through 3-gate approval (Rules, AI, Human) before sending.

## Your Key Differentiator

"Jasper says 'trust us.' TrustEye says 'here's the proof.'"

Every campaign generates a compliance receipt with audit trail. Gate 3 requires human approval - AI cannot approve itself.

## The Feedback Loop

You learn from past performance. When creating campaigns, you show "what changed since last time":
- Excluded customers with unresolved negative reviews (73% lower conversion)
- Increased wait time from 2 to 5 days (45% better open rates)
- Prioritized referral over discount for VIP (2.3x better response)

## Available Tools

You have 15+ tools: email campaigns, Slack notifications, SMS via Birdeye, social media via Late.dev, demo site banners, audience creation, review analysis, and more.

## Brand Voice (Premier Nissan)

When creating content:
- Professional yet friendly tone
- Trustworthy and transparent
- Community-focused
- Keep emails under 150 words
- Use personalization

## How to Respond

1. When asked "What can TrustEye do?" - list the 3 campaign types with specific details
2. When asked about competitors - explain the Trust Layer differentiator
3. When creating campaigns - mention the 3-gate approval and what changed since last time
4. Be specific with numbers and features, not generic marketing speak

Always answer with SPECIFIC capabilities, REAL workflows, and ACTUAL features.
`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  sources: string[];
  intent?: {
    type: string;
    confidence: number;
    entities: Record<string, any>;
  };
}

// Get relevant context from knowledge base (both brand AND TrustEye knowledge)
async function getRelevantContext(query: string, maxChunks: number = 8): Promise<string> {
  // Query TrustEye system knowledge first (capabilities, tools, workflows)
  const trusteyeResults = await knowledgeBase.queryContext(query, 4, { brandId: 'trusteye-system' });

  // Then query brand-specific knowledge
  const brandResults = await knowledgeBase.queryContext(query, 4, { brandId: BRAND_ID });

  // Combine results, prioritizing TrustEye knowledge for capability questions
  const allResults = [...trusteyeResults, ...brandResults];

  if (allResults.length === 0) {
    return '';
  }

  // Deduplicate and limit
  const seen = new Set<string>();
  const uniqueResults = allResults.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).slice(0, maxChunks);

  const contextParts = uniqueResults.map((r, i) => {
    const source = r.metadata.brandId === 'trusteye-system' ? 'TrustEye' : 'Brand';
    return `[${source}: ${r.metadata.section || r.metadata.filename}]\n${r.content}`;
  });

  return `\n\n---\nRELEVANT KNOWLEDGE:\n${contextParts.join('\n\n')}`;
}

// Chat with context injection
export async function chat(
  message: string,
  history: ChatMessage[] = [],
  brandId: string = BRAND_ID
): Promise<ChatResponse> {
  // Check cache first (only for messages without conversation history for better relevance)
  if (history.length === 0) {
    const cached = cache.ai.get(message);
    if (cached) {
      console.log(`[Claude] Cache HIT - saved ~500 tokens`);
      cache.ai.set(message, cached, 500); // Record token savings
      return { response: cached.response, sources: cached.sources || [] };
    }
  }

  const startTime = Date.now();

  const result = await withFailsafe(
    `claude_chat_${message.substring(0, 30)}`,
    async () => {
      const anthropic = getClient();

      // Get relevant context from knowledge base (with caching)
      const context = await getRelevantContext(message, 5);

      // Build messages array
      const messages: Anthropic.MessageParam[] = [
        ...history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        {
          role: 'user' as const,
          content: context ? `${message}\n${context}` : message
        }
      ];

      // Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages
      });

      // Extract text response
      const textContent = response.content.find(c => c.type === 'text');
      const responseText = textContent ? textContent.text : '';

      // Extract sources from context
      const sources = context
        ? context.match(/\[Source \d+: ([^\]]+)\]/g)?.map(s => s.replace(/\[Source \d+: ([^\]]+)\]/, '$1')) || []
        : [];

      return {
        response: responseText,
        sources
      };
    },
    {
      response: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
      sources: []
    }
  );

  // Cache successful responses (only for standalone messages)
  if (result.data.response && history.length === 0) {
    const responseTime = Date.now() - startTime;
    cache.ai.set(message, result.data, 500); // Estimate ~500 tokens
    console.log(`[Claude] Response cached (${responseTime}ms)`);
  }

  return result.data;
}

// Analyze user intent
export async function analyzeIntent(message: string): Promise<{
  type: string;
  confidence: number;
  entities: Record<string, any>;
}> {
  // Check intent cache first (high hit rate expected)
  const cachedIntent = cache.intent.get(message);
  if (cachedIntent) {
    console.log(`[Claude] Intent cache HIT`);
    return cachedIntent;
  }

  const result = await withFailsafe(
    `claude_intent_${message.substring(0, 30)}`,
    async () => {
      const anthropic = getClient();

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `You are an intent classification system. Analyze the user message and return a JSON object with:
- type: one of ["create_campaign", "generate_content", "analyze_data", "get_suggestions", "ask_question", "review_content", "other"]
- confidence: 0.0 to 1.0
- entities: extracted entities like campaign_type, audience, channels, etc.

Only respond with valid JSON, no other text.`,
        messages: [{ role: 'user', content: message }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '{}';

      try {
        return JSON.parse(text);
      } catch {
        return {
          type: 'other',
          confidence: 0.5,
          entities: {}
        };
      }
    },
    {
      type: 'other',
      confidence: 0.5,
      entities: {}
    }
  );

  // Cache the intent result
  if (result.data.type !== 'other') {
    cache.intent.set(message, result.data);
    console.log(`[Claude] Intent cached: ${result.data.type}`);
  }

  return result.data;
}

// Generate campaign suggestions based on context
export async function generateCampaignSuggestions(context: {
  recentReviews?: any[];
  inactiveCustomers?: number;
  competitorActivity?: string;
}): Promise<string[]> {
  const result = await withFailsafe(
    'claude_suggestions',
    async () => {
      const anthropic = getClient();

      const contextText = JSON.stringify(context, null, 2);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `You are a marketing strategist for Premier Nissan. Based on the context provided, suggest 2-3 specific marketing campaign ideas. Each suggestion should be actionable and specific to Premier Nissan's brand.

Return a JSON array of suggestion strings.`,
        messages: [{ role: 'user', content: `Current context:\n${contextText}` }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '[]';

      try {
        return JSON.parse(text);
      } catch {
        return [];
      }
    },
    []
  );

  return result.data;
}

// Summarize brand documents for quick reference
export async function summarizeBrandKnowledge(topic: string): Promise<string> {
  const result = await withFailsafe(
    `claude_summarize_${topic}`,
    async () => {
      const anthropic = getClient();

      // Get relevant context
      const context = await getRelevantContext(topic, 8);

      if (!context) {
        return 'No relevant brand knowledge found for this topic.';
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: 'Summarize the following brand knowledge in a clear, actionable way for a marketing team member.',
        messages: [{ role: 'user', content: `Topic: ${topic}\n${context}` }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      return textContent ? textContent.text : '';
    },
    'Unable to summarize brand knowledge at this time.'
  );

  return result.data;
}

export default {
  chat,
  analyzeIntent,
  generateCampaignSuggestions,
  summarizeBrandKnowledge
};
