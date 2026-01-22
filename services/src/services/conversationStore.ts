// Conversation Store Service
// Stores and retrieves conversation history for learning

import supabase from './db';
import { withFailsafe } from '../utils/failsafe';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolUsed?: string;
  confidence?: number;
}

export interface Conversation {
  id?: string;
  sessionId: string;
  brandId: string;
  userId?: string;
  messages: Message[];
  context: {
    currentTool?: string;
    currentCampaign?: string;
    recentTopics?: string[];
    userPreferences?: Record<string, any>;
  };
  toolsUsed: string[];
  outcome?: 'success' | 'failure' | 'abandoned' | 'escalated' | 'unknown';
  feedbackScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

// In-memory store for active conversations
const activeConversations: Map<string, Conversation> = new Map();

// Generate session ID
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Start a new conversation
export async function startConversation(
  brandId: string,
  userId?: string
): Promise<Conversation> {
  const sessionId = generateSessionId();

  const conversation: Conversation = {
    sessionId,
    brandId,
    userId,
    messages: [],
    context: {},
    toolsUsed: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  activeConversations.set(sessionId, conversation);

  // Persist to Supabase
  await withFailsafe(
    `conv_create_${sessionId}`,
    async () => {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          session_id: sessionId,
          brand_id: brandId,
          user_id: userId,
          messages: [],
          context: {},
          tools_used: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    null
  );

  return conversation;
}

// Get conversation by session ID
export async function getConversation(sessionId: string): Promise<Conversation | null> {
  // Check in-memory first
  const cached = activeConversations.get(sessionId);
  if (cached) return cached;

  // Fetch from Supabase
  const result = await withFailsafe(
    `conv_get_${sessionId}`,
    async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    null
  );

  if (!result.data) return null;

  const conversation: Conversation = {
    id: result.data.id,
    sessionId: result.data.session_id,
    brandId: result.data.brand_id,
    userId: result.data.user_id,
    messages: result.data.messages || [],
    context: result.data.context || {},
    toolsUsed: result.data.tools_used || [],
    outcome: result.data.outcome,
    feedbackScore: result.data.feedback_score,
    createdAt: result.data.created_at,
    updatedAt: result.data.updated_at
  };

  // Cache it
  activeConversations.set(sessionId, conversation);

  return conversation;
}

// Add message to conversation
export async function addMessage(
  sessionId: string,
  message: Omit<Message, 'timestamp'>
): Promise<Conversation | null> {
  let conversation = await getConversation(sessionId);

  if (!conversation) {
    // Start new conversation if doesn't exist
    conversation = await startConversation('premier-nissan');
    conversation.sessionId = sessionId;
  }

  const fullMessage: Message = {
    ...message,
    timestamp: new Date().toISOString()
  };

  conversation.messages.push(fullMessage);
  conversation.updatedAt = new Date().toISOString();

  // Track tool usage
  if (message.toolUsed && !conversation.toolsUsed.includes(message.toolUsed)) {
    conversation.toolsUsed.push(message.toolUsed);
  }

  // Update in-memory
  activeConversations.set(sessionId, conversation);

  // Persist to Supabase
  await withFailsafe(
    `conv_update_${sessionId}`,
    async () => {
      const { error } = await supabase
        .from('conversations')
        .update({
          messages: conversation!.messages,
          tools_used: conversation!.toolsUsed,
          context: conversation!.context
        })
        .eq('session_id', sessionId);

      if (error) throw error;
    },
    null
  );

  return conversation;
}

// Update conversation context
export async function updateContext(
  sessionId: string,
  contextUpdate: Partial<Conversation['context']>
): Promise<Conversation | null> {
  const conversation = await getConversation(sessionId);
  if (!conversation) return null;

  conversation.context = {
    ...conversation.context,
    ...contextUpdate
  };
  conversation.updatedAt = new Date().toISOString();

  activeConversations.set(sessionId, conversation);

  await withFailsafe(
    `conv_context_${sessionId}`,
    async () => {
      const { error } = await supabase
        .from('conversations')
        .update({ context: conversation.context })
        .eq('session_id', sessionId);

      if (error) throw error;
    },
    null
  );

  return conversation;
}

// End conversation with outcome
export async function endConversation(
  sessionId: string,
  outcome: Conversation['outcome'],
  feedbackScore?: number
): Promise<Conversation | null> {
  const conversation = await getConversation(sessionId);
  if (!conversation) return null;

  conversation.outcome = outcome;
  conversation.feedbackScore = feedbackScore;
  conversation.updatedAt = new Date().toISOString();

  // Remove from active conversations
  activeConversations.delete(sessionId);

  // Persist final state
  await withFailsafe(
    `conv_end_${sessionId}`,
    async () => {
      const { error } = await supabase
        .from('conversations')
        .update({
          outcome,
          feedback_score: feedbackScore
        })
        .eq('session_id', sessionId);

      if (error) throw error;
    },
    null
  );

  return conversation;
}

// Get recent conversations for a brand
export async function getRecentConversations(
  brandId: string,
  limit: number = 20
): Promise<Conversation[]> {
  const result = await withFailsafe(
    `conv_recent_${brandId}`,
    async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    []
  );

  return result.data.map((row: any) => ({
    id: row.id,
    sessionId: row.session_id,
    brandId: row.brand_id,
    userId: row.user_id,
    messages: row.messages || [],
    context: row.context || {},
    toolsUsed: row.tools_used || [],
    outcome: row.outcome,
    feedbackScore: row.feedback_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

// Get successful conversations (for learning)
export async function getSuccessfulConversations(
  brandId: string,
  toolId?: string,
  limit: number = 50
): Promise<Conversation[]> {
  const result = await withFailsafe(
    `conv_success_${brandId}`,
    async () => {
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('brand_id', brandId)
        .eq('outcome', 'success')
        .order('feedback_score', { ascending: false })
        .limit(limit);

      if (toolId) {
        query = query.contains('tools_used', [toolId]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    []
  );

  return result.data.map((row: any) => ({
    id: row.id,
    sessionId: row.session_id,
    brandId: row.brand_id,
    userId: row.user_id,
    messages: row.messages || [],
    context: row.context || {},
    toolsUsed: row.tools_used || [],
    outcome: row.outcome,
    feedbackScore: row.feedback_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

// Get conversation messages formatted for AI context
export function formatMessagesForContext(
  conversation: Conversation,
  maxMessages: number = 10
): string {
  const recentMessages = conversation.messages.slice(-maxMessages);

  return recentMessages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');
}

// Extract key intents from conversation
export function extractIntents(conversation: Conversation): string[] {
  const intents: Set<string> = new Set();

  for (const message of conversation.messages) {
    if (message.role === 'user') {
      const content = message.content.toLowerCase();

      // Detect intent patterns
      if (content.includes('send') || content.includes('email') || content.includes('campaign')) {
        intents.add('send_communication');
      }
      if (content.includes('review') || content.includes('feedback')) {
        intents.add('analyze_reviews');
      }
      if (content.includes('create') || content.includes('generate') || content.includes('write')) {
        intents.add('generate_content');
      }
      if (content.includes('show') || content.includes('get') || content.includes('list')) {
        intents.add('retrieve_data');
      }
      if (content.includes('help') || content.includes('how')) {
        intents.add('get_help');
      }
    }
  }

  return Array.from(intents);
}

export default {
  generateSessionId,
  startConversation,
  getConversation,
  addMessage,
  updateContext,
  endConversation,
  getRecentConversations,
  getSuccessfulConversations,
  formatMessagesForContext,
  extractIntents
};
