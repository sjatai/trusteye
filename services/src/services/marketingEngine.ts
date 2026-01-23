// Marketing Intelligence Engine
// One router, four modes: RAG | Patch | Match | Create

import Anthropic from '@anthropic-ai/sdk';
import knowledgeBase, { indexDocuments, queryContext, BrandDocument } from './pinecone';

// ============================================
// TYPES
// ============================================

export interface EngineContext {
  activeDraft?: {
    type: 'campaign' | 'audience' | 'content';
    fields: Record<string, any>;
  };
  brandId?: string;
  userId?: string;
}

export interface Patch {
  field: string;
  action: 'set' | 'add' | 'remove';
  value: any;
  confidence: number;
}

export interface EngineResponse {
  mode: 'rag' | 'patch' | 'match' | 'create' | 'clarify';
  data: any;
  message: string;
  confidence?: number;
}

export interface MarketingAsset {
  type: 'audience' | 'content' | 'campaign';
  id: string;
  name: string;
  description?: string;
  criteria?: Record<string, any>;
  template?: string;
  workflow?: string[];
  tags?: string[];
  createdAt: string;
  source: 'auto-created' | 'seeded' | 'user-created';
}

// ============================================
// CLAUDE CLIENT
// ============================================

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

// ============================================
// MAIN ROUTER
// ============================================

export async function handleMarketingIntent(
  query: string,
  context: EngineContext
): Promise<EngineResponse> {
  console.log(`[MarketingEngine] Processing: "${query.substring(0, 50)}..."`);
  console.log(`[MarketingEngine] Context:`, {
    hasActiveDraft: !!context.activeDraft,
    draftType: context.activeDraft?.type,
    brandId: context.brandId
  });

  // MODE 1: Is it a question?
  if (isQuestion(query)) {
    console.log(`[MarketingEngine] → RAG mode (question detected)`);
    const answer = await answerWithRAG(query, context.brandId);
    return {
      mode: 'rag',
      data: answer,
      message: answer.response
    };
  }

  // MODE 2: Is there an active draft to modify?
  if (context.activeDraft) {
    console.log(`[MarketingEngine] → PATCH mode (active draft: ${context.activeDraft.type})`);
    const patch = await generatePatch(query, context.activeDraft);

    if (patch.confidence >= 0.7) {
      return {
        mode: 'patch',
        data: patch,
        message: formatPatchMessage(patch),
        confidence: patch.confidence
      };
    }
    // Low confidence patch - fall through to other modes
    console.log(`[MarketingEngine] Low confidence patch (${patch.confidence}), checking other modes`);
  }

  // Classify intent for match/create
  const intentType = await classifyIntent(query);
  console.log(`[MarketingEngine] Intent type: ${intentType}`);

  // MODE 3: Does a pattern match exist?
  const match = await searchForMatch(query, intentType);

  if (match && match.score > 0.85) {
    console.log(`[MarketingEngine] → MATCH mode (score: ${match.score.toFixed(2)})`);
    return {
      mode: 'match',
      data: match.asset,
      message: `Found existing ${intentType}: "${match.asset.name}". Use it?`,
      confidence: match.score
    };
  }

  // MODE 4: Explicit create request?
  if (isExplicitCreate(query)) {
    console.log(`[MarketingEngine] → CREATE mode`);
    const asset = await createAsset(query, intentType, context);
    await saveToLearning(asset, query);
    return {
      mode: 'create',
      data: asset,
      message: `Created new ${intentType}: "${asset.name}". Saved for future use.`
    };
  }

  // FALLBACK: Clarify
  console.log(`[MarketingEngine] → CLARIFY mode`);
  return {
    mode: 'clarify',
    data: { intentType },
    message: `I'm not sure what you'd like. Do you want to:\n- Create a new ${intentType}?\n- Search for an existing one?\n- Modify your current ${context.activeDraft?.type || 'campaign'}?`
  };
}

// ============================================
// MODE 1: RAG (Questions)
// ============================================

function isQuestion(query: string): boolean {
  const questionPatterns = [
    /^what (is|are|can|does)/i,
    /^how (do|does|is|can|to)/i,
    /^why (is|do|does|are)/i,
    /^when (is|do|does|should)/i,
    /^where (is|do|does|can)/i,
    /^which (is|are|one)/i,
    /^tell me about/i,
    /^explain/i,
    /^describe/i,
    /\?$/
  ];
  return questionPatterns.some(p => p.test(query.trim()));
}

async function answerWithRAG(
  query: string,
  brandId?: string
): Promise<{ response: string; sources: string[] }> {
  // Get context from knowledge base
  const results = await queryContext(query, 5, { brandId: brandId || 'trusteye-system' });

  if (results.length === 0) {
    return {
      response: "I don't have specific information about that in my knowledge base. Could you rephrase or ask about TrustEye capabilities, campaigns, or Premier Nissan?",
      sources: []
    };
  }

  const contextText = results
    .map((r, i) => `[${i + 1}] ${r.content}`)
    .join('\n\n');

  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You are TrustEye AI, answering questions based on the provided knowledge base context. Be specific and accurate. If the context doesn't contain enough information, say so.`,
    messages: [{
      role: 'user',
      content: `Question: ${query}\n\nContext:\n${contextText}`
    }]
  });

  const textContent = response.content.find(c => c.type === 'text');
  return {
    response: textContent?.text || 'Unable to generate response.',
    sources: results.map(r => r.metadata.filename || r.id)
  };
}

// ============================================
// MODE 2: PATCH (Modify Active Draft)
// ============================================

async function generatePatch(
  query: string,
  draft: EngineContext['activeDraft']
): Promise<Patch> {
  const anthropic = getClient();

  const prompt = `The user is editing a ${draft!.type} with these current values:
${JSON.stringify(draft!.fields, null, 2)}

The user said: "${query}"

What field do they want to change? Return ONLY valid JSON:
{
  "field": "the field name (e.g., channels, audience, schedule, type, name, content)",
  "action": "set" | "add" | "remove",
  "value": the new value (string, array element, or object),
  "confidence": 0.0 to 1.0
}

Common fields:
- channels: array of ["email", "sms", "slack", "website"]
- audience: string description or object with criteria
- schedule: object with timing info
- type: campaign type string
- name: campaign name string

Examples:
- "add SMS" → {"field": "channels", "action": "add", "value": "sms", "confidence": 0.95}
- "change to email only" → {"field": "channels", "action": "set", "value": ["email"], "confidence": 0.9}
- "target 5-star reviewers" → {"field": "audience", "action": "set", "value": "5-star reviewers", "confidence": 0.9}
- "send tomorrow" → {"field": "schedule", "action": "set", "value": {"sendTime": "tomorrow"}, "confidence": 0.85}

Only return JSON, nothing else.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    const text = textContent?.text || '{}';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[MarketingEngine] Generated patch:`, parsed);
      return parsed;
    }
  } catch (error) {
    console.error('[MarketingEngine] Patch generation error:', error);
  }

  return {
    field: 'unknown',
    action: 'set',
    value: null,
    confidence: 0
  };
}

function formatPatchMessage(patch: Patch): string {
  const actionVerb = {
    set: 'Set',
    add: 'Add',
    remove: 'Remove'
  }[patch.action];

  const valueStr = typeof patch.value === 'object'
    ? JSON.stringify(patch.value)
    : String(patch.value);

  return `${actionVerb} "${valueStr}" ${patch.action === 'set' ? 'as' : patch.action === 'add' ? 'to' : 'from'} ${patch.field}?`;
}

// ============================================
// MODE 3: MATCH (Use Existing Pattern)
// ============================================

async function searchForMatch(
  query: string,
  intentType: string
): Promise<{ score: number; asset: MarketingAsset } | null> {
  // Search knowledge base for patterns
  const results = await queryContext(query, 3, {
    brandId: 'marketing-patterns'
  });

  // Filter results by intent type if possible
  const typeFilteredResults = results.filter(r =>
    r.metadata.section === intentType ||
    r.metadata.assetType === intentType
  );

  // Use type-filtered results if available, otherwise use all
  const relevantResults = typeFilteredResults.length > 0 ? typeFilteredResults : results;

  // TF-IDF scores aren't normalized to 0-1, they can be higher
  // Use threshold of 4.0 for strong matches (based on observed score ranges)
  const MATCH_THRESHOLD = 4.0;

  if (relevantResults.length === 0 || relevantResults[0].score < MATCH_THRESHOLD) {
    return null;
  }

  const topResult = relevantResults[0];

  // Convert to marketing asset
  const asset: MarketingAsset = {
    type: (topResult.metadata.type as 'audience' | 'content' | 'campaign') || intentType as any,
    id: topResult.id,
    name: topResult.metadata.name || topResult.metadata.section || 'Matched Pattern',
    description: topResult.content.substring(0, 200),
    criteria: topResult.metadata.criteria,
    template: topResult.metadata.template,
    tags: topResult.metadata.tags || [],
    createdAt: topResult.metadata.createdAt || new Date().toISOString(),
    source: topResult.metadata.source || 'seeded'
  };

  return {
    score: topResult.score,
    asset
  };
}

// ============================================
// MODE 4: CREATE (New Asset)
// ============================================

function isExplicitCreate(query: string): boolean {
  const createKeywords = [
    'create', 'make', 'build', 'generate', 'new',
    'set up', 'design', 'draft', 'write', 'compose'
  ];
  const lowerQuery = query.toLowerCase();
  return createKeywords.some(kw => lowerQuery.includes(kw));
}

async function classifyIntent(query: string): Promise<string> {
  const queryLower = query.toLowerCase();

  // Fast keyword check first
  if (queryLower.includes('audience') || queryLower.includes('customers who') ||
      queryLower.includes('segment') || queryLower.includes('people who') ||
      queryLower.includes('reviewers') || queryLower.includes('find customers')) {
    return 'audience';
  }
  if (queryLower.includes('email') || queryLower.includes('content') ||
      queryLower.includes('write') || queryLower.includes('message') ||
      queryLower.includes('post') || queryLower.includes('sms')) {
    return 'content';
  }
  if (queryLower.includes('campaign') || queryLower.includes('send to') ||
      queryLower.includes('launch') || queryLower.includes('promote')) {
    return 'campaign';
  }

  // Fall back to Claude for ambiguous cases
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `Classify this marketing request into ONE category: audience, content, or campaign.

Request: "${query}"

Reply with just the category word.`
      }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    const result = textContent?.text.trim().toLowerCase() || 'campaign';

    if (['audience', 'content', 'campaign'].includes(result)) {
      return result;
    }
  } catch (error) {
    console.error('[MarketingEngine] Classification error:', error);
  }

  return 'campaign'; // Default
}

async function createAsset(
  query: string,
  intentType: string,
  context: EngineContext
): Promise<MarketingAsset> {
  switch (intentType) {
    case 'audience':
      return await createAudience(query, context);
    case 'content':
      return await createContent(query, context);
    case 'campaign':
    default:
      return await createCampaign(query, context);
  }
}

async function createAudience(query: string, context: EngineContext): Promise<MarketingAsset> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Create an audience segment from this request: "${query}"

Return ONLY valid JSON:
{
  "name": "short descriptive name",
  "description": "what this audience represents",
  "criteria": {
    "filters": [{"field": "string", "operator": "equals|contains|greaterThan|lessThan", "value": "any"}]
  },
  "estimatedCount": number,
  "tags": ["tag1", "tag2"]
}`
    }]
  });

  const textContent = response.content.find(c => c.type === 'text');
  const text = textContent?.text || '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: 'audience',
        id: `audience-${Date.now()}`,
        name: parsed.name || 'New Audience',
        description: parsed.description,
        criteria: parsed.criteria,
        tags: parsed.tags || [],
        createdAt: new Date().toISOString(),
        source: 'auto-created'
      };
    }
  } catch (e) {
    console.error('[MarketingEngine] Audience creation parse error:', e);
  }

  // Fallback
  return {
    type: 'audience',
    id: `audience-${Date.now()}`,
    name: extractNameFromQuery(query, 'audience'),
    description: query,
    criteria: {},
    tags: [],
    createdAt: new Date().toISOString(),
    source: 'auto-created'
  };
}

async function createContent(query: string, context: EngineContext): Promise<MarketingAsset> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Create a content template from this request: "${query}"

Return ONLY valid JSON:
{
  "name": "short descriptive name",
  "description": "what this content is for",
  "template": "the actual content template text with {{variables}}",
  "channel": "email|sms|social|website",
  "tags": ["tag1", "tag2"]
}`
    }]
  });

  const textContent = response.content.find(c => c.type === 'text');
  const text = textContent?.text || '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: 'content',
        id: `content-${Date.now()}`,
        name: parsed.name || 'New Content',
        description: parsed.description,
        template: parsed.template,
        tags: parsed.tags || [],
        createdAt: new Date().toISOString(),
        source: 'auto-created'
      };
    }
  } catch (e) {
    console.error('[MarketingEngine] Content creation parse error:', e);
  }

  return {
    type: 'content',
    id: `content-${Date.now()}`,
    name: extractNameFromQuery(query, 'content'),
    description: query,
    template: '',
    tags: [],
    createdAt: new Date().toISOString(),
    source: 'auto-created'
  };
}

async function createCampaign(query: string, context: EngineContext): Promise<MarketingAsset> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Create a campaign definition from this request: "${query}"

Return ONLY valid JSON:
{
  "name": "short descriptive name",
  "description": "campaign purpose",
  "workflow": ["step1", "step2", "step3"],
  "audienceType": "who this targets",
  "channels": ["email", "sms"],
  "tags": ["tag1", "tag2"]
}`
    }]
  });

  const textContent = response.content.find(c => c.type === 'text');
  const text = textContent?.text || '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: 'campaign',
        id: `campaign-${Date.now()}`,
        name: parsed.name || 'New Campaign',
        description: parsed.description,
        workflow: parsed.workflow,
        tags: parsed.tags || [],
        createdAt: new Date().toISOString(),
        source: 'auto-created'
      };
    }
  } catch (e) {
    console.error('[MarketingEngine] Campaign creation parse error:', e);
  }

  return {
    type: 'campaign',
    id: `campaign-${Date.now()}`,
    name: extractNameFromQuery(query, 'campaign'),
    description: query,
    workflow: ['create audience', 'generate content', '3-gate approval', 'execute'],
    tags: [],
    createdAt: new Date().toISOString(),
    source: 'auto-created'
  };
}

function extractNameFromQuery(query: string, type: string): string {
  // Remove common prefixes
  let name = query
    .replace(/^(create|make|build|generate|new|set up|design|draft|write)\s+/i, '')
    .replace(/^(an?|the)\s+/i, '')
    .replace(/^(audience|content|campaign)\s+(of|for|about|called|named)?\s*/i, '');

  // Capitalize first letter and truncate
  name = name.charAt(0).toUpperCase() + name.slice(1);
  if (name.length > 50) {
    name = name.substring(0, 47) + '...';
  }

  return name || `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
}

// ============================================
// LEARNING: Save to Knowledge Base
// ============================================

async function saveToLearning(asset: MarketingAsset, originalQuery: string): Promise<void> {
  try {
    const doc: BrandDocument = {
      id: asset.id,
      content: `${asset.name}: ${asset.description || ''}\nOriginal request: ${originalQuery}`,
      metadata: {
        filename: asset.name,
        brandId: 'marketing-patterns',
        type: 'general',
        section: asset.type,
        lastUpdated: asset.createdAt,
        // Store asset data in metadata
        name: asset.name,
        assetType: asset.type,
        criteria: asset.criteria ? JSON.stringify(asset.criteria) : undefined,
        template: asset.template,
        workflow: asset.workflow ? JSON.stringify(asset.workflow) : undefined,
        tags: asset.tags,
        source: asset.source,
        createdAt: asset.createdAt
      }
    };

    await indexDocuments([doc]);
    console.log(`💡 [MarketingEngine] Learned new pattern: "${originalQuery}" → ${asset.type}:${asset.name}`);
  } catch (error) {
    console.error('[MarketingEngine] Failed to save learning:', error);
  }
}

// ============================================
// SEED PATTERNS (run once)
// ============================================

export async function seedMarketingPatterns(): Promise<void> {
  const patterns: BrandDocument[] = [
    // Audience patterns
    {
      id: 'seed-audience-5-star',
      content: '5-Star Reviewers: Customers who left 5-star reviews. Great for referral campaigns.',
      metadata: {
        filename: '5-Star Reviewers',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'audience',
        name: '5-Star Reviewers',
        assetType: 'audience',
        criteria: JSON.stringify({ rating: 5 }),
        tags: ['reviews', 'loyalty', 'referral']
      }
    },
    {
      id: 'seed-audience-lapsed',
      content: 'Lapsed Customers: Customers who haven\'t visited in 90 days. Target for win-back campaigns.',
      metadata: {
        filename: 'Lapsed Customers',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'audience',
        name: 'Lapsed Customers',
        assetType: 'audience',
        criteria: JSON.stringify({ daysSinceVisit: { $gte: 90 } }),
        tags: ['winback', 'churn', 'inactive']
      }
    },
    {
      id: 'seed-audience-negative',
      content: 'Negative Reviewers: Customers who left 1-2 star reviews. Priority for recovery outreach.',
      metadata: {
        filename: 'Negative Reviewers',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'audience',
        name: 'Negative Reviewers',
        assetType: 'audience',
        criteria: JSON.stringify({ rating: { $lte: 2 } }),
        tags: ['recovery', 'service', 'unhappy']
      }
    },
    // Content patterns
    {
      id: 'seed-content-referral',
      content: 'Referral Email: Thank customers for 5-star reviews and ask them to refer friends.',
      metadata: {
        filename: 'Referral Email Template',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'content',
        name: 'Referral Email',
        assetType: 'content',
        template: 'Thanks for your amazing review! Share your experience with friends and family.',
        tags: ['referral', 'email', 'reviews']
      }
    },
    {
      id: 'seed-content-winback',
      content: 'Win-back Email: Re-engage inactive customers with a special offer.',
      metadata: {
        filename: 'Win-back Email Template',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'content',
        name: 'Win-back Email',
        assetType: 'content',
        template: 'We miss you! It\'s been a while since your last visit. Here\'s a special offer.',
        tags: ['winback', 'email', 'offer']
      }
    },
    {
      id: 'seed-content-recovery',
      content: 'Recovery Email: Apologize to unhappy customers and offer to make things right.',
      metadata: {
        filename: 'Recovery Email Template',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'content',
        name: 'Recovery Email',
        assetType: 'content',
        template: 'We\'re sorry to hear about your experience. Let us make it right.',
        tags: ['recovery', 'email', 'apology']
      }
    },
    // Campaign patterns
    {
      id: 'seed-campaign-referral',
      content: 'Referral Campaign: Target 5-star reviewers with referral requests. Full workflow with 3-gate approval.',
      metadata: {
        filename: 'Referral Campaign',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'campaign',
        name: 'Referral Campaign',
        assetType: 'campaign',
        workflow: JSON.stringify(['find 5-star reviewers', 'generate referral email', '3-gate approval', 'send']),
        tags: ['referral', 'automated', 'reviews']
      }
    },
    {
      id: 'seed-campaign-recovery',
      content: 'Recovery Campaign: Reach out to negative reviewers with apology and offer to make things right.',
      metadata: {
        filename: 'Recovery Campaign',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'campaign',
        name: 'Recovery Campaign',
        assetType: 'campaign',
        workflow: JSON.stringify(['find negative reviews', 'generate apology', '3-gate approval', 'send']),
        tags: ['recovery', 'service']
      }
    },
    {
      id: 'seed-campaign-conquest',
      content: 'Conquest Campaign: Target competitor\'s unhappy customers with our superior service pitch.',
      metadata: {
        filename: 'Conquest Campaign',
        brandId: 'marketing-patterns',
        type: 'general',
        section: 'campaign',
        name: 'Conquest Campaign',
        assetType: 'campaign',
        workflow: JSON.stringify(['analyze competitor reviews', 'identify pain points', 'generate competitive offer', '3-gate approval', 'send']),
        tags: ['conquest', 'competitor', 'acquisition']
      }
    }
  ];

  await indexDocuments(patterns);
  console.log(`✅ [MarketingEngine] Seeded ${patterns.length} marketing patterns`);
}

// ============================================
// EXPORTS
// ============================================

export default {
  handleMarketingIntent,
  seedMarketingPatterns,
  isQuestion,
  isExplicitCreate,
  classifyIntent
};
