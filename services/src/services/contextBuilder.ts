// Context Builder Service
// Builds comprehensive context for AI interactions

import knowledgeBase from './pinecone';
import conversationStore, { Conversation, formatMessagesForContext, extractIntents } from './conversationStore';
import { TOOLS_REGISTRY, Tool } from '../config/tools-registry';

export interface AIContext {
  // Conversation context
  conversationHistory: string;
  currentIntent: string[];
  recentTopics: string[];

  // Brand context
  brandId: string;
  brandGuidelines: string;
  brandVoice: string;

  // Tool context
  availableTools: string;
  recentToolsUsed: string[];
  suggestedTool?: string;

  // User context
  userId?: string;
  userPreferences?: Record<string, any>;

  // System context
  systemInstructions: string;
  constraints: string[];
}

// Build system instructions based on brand
function buildSystemInstructions(brandId: string): string {
  return `You are TrustEye AI, a marketing assistant for ${brandId}.

Your role is to help create, manage, and execute marketing campaigns that align with the brand's voice and guidelines.

CAPABILITIES:
- Generate marketing content (email, SMS, social media)
- Analyze customer reviews and sentiment
- Create and manage audience segments
- Suggest campaign improvements
- Execute approved marketing actions

RULES:
1. Always follow brand guidelines
2. Never make unverifiable claims
3. Avoid pressure tactics or fear-based messaging
4. Maintain professional yet friendly tone
5. Focus on value, not just discounts
6. Include clear calls to action
7. Personalize when possible

When asked to take actions, identify the appropriate tool and confirm before executing.`;
}

// Build available tools description
function buildToolsDescription(category?: Tool['category']): string {
  const tools = category
    ? TOOLS_REGISTRY.filter(t => t.category === category)
    : TOOLS_REGISTRY;

  return tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
}

// Get brand context from knowledge base
async function getBrandContext(brandId: string, query: string): Promise<{
  guidelines: string;
  voice: string;
}> {
  // Get guidelines
  const guidelinesChunks = await knowledgeBase.queryContext(
    `${query} brand guidelines messaging do dont`,
    3,
    { brandId }
  );

  // Get voice description
  const voiceChunks = await knowledgeBase.queryContext(
    `brand voice tone personality style`,
    2,
    { brandId }
  );

  return {
    guidelines: guidelinesChunks.map(c => c.content).join('\n\n').substring(0, 2000),
    voice: voiceChunks.map(c => c.content).join('\n\n').substring(0, 1000)
  };
}

// Suggest a tool based on intent
function suggestTool(intents: string[], message: string): Tool | null {
  const messageLower = message.toLowerCase();

  // Check example phrases
  for (const tool of TOOLS_REGISTRY) {
    for (const phrase of tool.example_phrases) {
      if (messageLower.includes(phrase.toLowerCase())) {
        return tool;
      }
    }
  }

  // Match by intent
  if (intents.includes('send_communication')) {
    if (messageLower.includes('email')) return TOOLS_REGISTRY.find(t => t.id === 'send_email_campaign') || null;
    if (messageLower.includes('sms') || messageLower.includes('text')) return TOOLS_REGISTRY.find(t => t.id === 'send_sms_campaign') || null;
    if (messageLower.includes('slack')) return TOOLS_REGISTRY.find(t => t.id === 'send_slack_notification') || null;
  }

  if (intents.includes('generate_content')) {
    return TOOLS_REGISTRY.find(t => t.id === 'generate_content') || null;
  }

  if (intents.includes('analyze_reviews')) {
    return TOOLS_REGISTRY.find(t => t.id === 'analyze_reviews') || null;
  }

  return null;
}

// Build full context for AI
export async function buildContext(
  sessionId: string,
  currentMessage: string,
  brandId: string = 'premier-nissan'
): Promise<AIContext> {
  // Get conversation
  let conversation = await conversationStore.getConversation(sessionId);

  if (!conversation) {
    conversation = await conversationStore.startConversation(brandId);
    conversation.sessionId = sessionId;
  }

  // Extract intents
  const intents = extractIntents(conversation);

  // Get brand context
  const brandContext = await getBrandContext(brandId, currentMessage);

  // Suggest tool
  const suggestedTool = suggestTool(intents, currentMessage);

  // Build context
  const context: AIContext = {
    // Conversation
    conversationHistory: formatMessagesForContext(conversation, 6),
    currentIntent: intents,
    recentTopics: conversation.context.recentTopics || [],

    // Brand
    brandId,
    brandGuidelines: brandContext.guidelines,
    brandVoice: brandContext.voice,

    // Tools
    availableTools: buildToolsDescription(),
    recentToolsUsed: conversation.toolsUsed.slice(-5),
    suggestedTool: suggestedTool?.id,

    // User
    userId: conversation.userId,
    userPreferences: conversation.context.userPreferences,

    // System
    systemInstructions: buildSystemInstructions(brandId),
    constraints: [
      'Follow brand guidelines at all times',
      'Require approval for high-impact actions',
      'Never share sensitive customer data',
      'Maintain professional communication standards'
    ]
  };

  return context;
}

// Build a compact context string for the AI prompt
export function formatContextForPrompt(context: AIContext): string {
  const sections: string[] = [];

  // System instructions
  sections.push(`=== SYSTEM ===\n${context.systemInstructions}`);

  // Brand context
  if (context.brandGuidelines) {
    sections.push(`=== BRAND GUIDELINES ===\n${context.brandGuidelines}`);
  }

  // Conversation history
  if (context.conversationHistory) {
    sections.push(`=== RECENT CONVERSATION ===\n${context.conversationHistory}`);
  }

  // Available tools
  sections.push(`=== AVAILABLE TOOLS ===\n${context.availableTools}`);

  // Suggested tool
  if (context.suggestedTool) {
    sections.push(`=== SUGGESTED TOOL ===\nBased on the request, consider using: ${context.suggestedTool}`);
  }

  // Constraints
  sections.push(`=== CONSTRAINTS ===\n${context.constraints.map(c => `- ${c}`).join('\n')}`);

  return sections.join('\n\n');
}

// Update context with new information from conversation
export async function updateContextFromResponse(
  sessionId: string,
  response: string,
  toolUsed?: string
): Promise<void> {
  // Add assistant message
  await conversationStore.addMessage(sessionId, {
    role: 'assistant',
    content: response,
    toolUsed
  });

  // Extract topics from response
  const topics = extractTopicsFromText(response);

  if (topics.length > 0) {
    const conversation = await conversationStore.getConversation(sessionId);
    if (conversation) {
      const existingTopics = conversation.context.recentTopics || [];
      const allTopics = [...new Set([...topics, ...existingTopics])].slice(0, 10);

      await conversationStore.updateContext(sessionId, {
        recentTopics: allTopics
      });
    }
  }
}

// Extract topics from text
function extractTopicsFromText(text: string): string[] {
  const topics: Set<string> = new Set();
  const textLower = text.toLowerCase();

  // Marketing topics
  const marketingKeywords = [
    'campaign', 'email', 'sms', 'social', 'content', 'audience',
    'promotion', 'loyalty', 'win-back', 'referral', 'review'
  ];

  for (const keyword of marketingKeywords) {
    if (textLower.includes(keyword)) {
      topics.add(keyword);
    }
  }

  return Array.from(topics);
}

// Build context for specific use cases
export async function buildContentGenerationContext(
  brandId: string,
  contentType: 'email' | 'sms' | 'social',
  campaignGoal: string
): Promise<string> {
  // Get relevant brand documents
  const contextChunks = await knowledgeBase.queryContext(
    `${contentType} ${campaignGoal} brand voice messaging`,
    5,
    { brandId }
  );

  const guidelines = contextChunks.map(c => c.content).join('\n\n');

  return `You are generating ${contentType} content for a ${campaignGoal} campaign.

BRAND GUIDELINES:
${guidelines}

CONTENT REQUIREMENTS:
- Channel: ${contentType.toUpperCase()}
${contentType === 'sms' ? '- Maximum 160 characters' : ''}
${contentType === 'email' ? '- Include compelling subject line\n- Keep under 150 words' : ''}
${contentType === 'social' ? '- Keep engaging and shareable\n- Include call to action' : ''}

Generate content that:
1. Matches the brand voice
2. Achieves the campaign goal
3. Follows all guidelines
4. Includes personalization placeholders where appropriate`;
}

// Build context for review analysis
export async function buildReviewAnalysisContext(brandId: string): Promise<string> {
  const contextChunks = await knowledgeBase.queryContext(
    'customer service response guidelines tone',
    3,
    { brandId }
  );

  const guidelines = contextChunks.map(c => c.content).join('\n\n');

  return `You are analyzing customer reviews for ${brandId}.

BRAND CONTEXT:
${guidelines}

ANALYSIS REQUIREMENTS:
1. Identify sentiment (positive, negative, neutral)
2. Extract key themes and topics
3. Identify actionable insights
4. Suggest appropriate responses
5. Flag any urgent issues

Provide structured analysis that helps the marketing team understand customer sentiment and take appropriate action.`;
}

export default {
  buildContext,
  formatContextForPrompt,
  updateContextFromResponse,
  buildContentGenerationContext,
  buildReviewAnalysisContext
};
