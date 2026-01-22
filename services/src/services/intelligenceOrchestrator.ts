// Intelligence Orchestrator
// Integrates intent parsing, confidence scoring, and learning with chat

import { parseIntent, quickParse, getSuggestedClarifications, applyDefaults, ParsedIntent } from './intentParser';
import { calculateConfidence, isViable, formatConfidenceForUser, ConfidenceResult } from './confidenceScorer';
import { logParseAttempt, recordCorrection, getLearningStats } from './learningEngine';
import { resolveToolFromIntent } from './toolResolver';
import { runAllGates } from './approvalGates';
import { buildContext, formatContextForPrompt, updateContextFromResponse } from './contextBuilder';
import { addMessage, getConversation, generateSessionId } from './conversationStore';
import { log as auditLog } from './auditLog';
import claude from './claude';

export interface ProcessedMessage {
  originalInput: string;
  intent: ParsedIntent;
  confidence: ConfidenceResult;
  suggestedTool?: string;
  needsClarification: boolean;
  clarificationQuestions?: string[];
  response?: string;
  action?: {
    type: 'execute' | 'pending_approval' | 'rejected';
    toolId?: string;
    requestId?: string;
    reason?: string;
  };
}

// Process a user message with full intelligence pipeline
export async function processMessage(
  message: string,
  sessionId: string,
  brandId: string = 'premier-nissan',
  userId?: string
): Promise<ProcessedMessage> {
  const startTime = Date.now();

  // 1. Add user message to conversation
  await addMessage(sessionId, {
    role: 'user',
    content: message
  });

  // 2. Parse intent
  const intent = await parseIntent(message);

  // 3. Calculate confidence
  const confidence = calculateConfidence(intent);

  // 4. Apply defaults based on campaign type
  const enrichedIntent = applyDefaults(intent);

  // 5. Log parse attempt
  await logParseAttempt({
    input: message,
    parsedIntent: enrichedIntent,
    confidence,
    wasCorrect: confidence.recommendation === 'proceed',
    brandId,
    userId
  });

  // Build result
  const result: ProcessedMessage = {
    originalInput: message,
    intent: enrichedIntent,
    confidence,
    needsClarification: confidence.recommendation === 'clarify',
    clarificationQuestions: confidence.recommendation === 'clarify' ? confidence.suggestedQuestions : undefined
  };

  // 6. Determine action based on confidence
  if (confidence.recommendation === 'reject') {
    // Too unclear - ask for more info
    result.response = "I'm not quite sure what you're asking. Could you rephrase that or provide more details about what you'd like to do?";
    result.action = {
      type: 'rejected',
      reason: 'Confidence too low'
    };
  } else if (confidence.recommendation === 'clarify') {
    // Need more info
    result.response = formatConfidenceForUser(confidence);
    result.action = {
      type: 'rejected',
      reason: 'Needs clarification'
    };
  } else {
    // Can proceed - try to match to a tool
    const tool = await resolveToolFromIntent(message);

    if (tool) {
      result.suggestedTool = tool.id;

      // Check if tool requires approval
      if (tool.requires_approval) {
        // Start approval flow
        const { request, canExecute } = await runAllGates(
          tool.id,
          {}, // Would extract params from intent
          undefined, // Would extract content
          userId || 'anonymous',
          brandId
        );

        if (canExecute) {
          result.action = {
            type: 'execute',
            toolId: tool.id,
            requestId: request.id
          };
          result.response = `Ready to execute ${tool.name}. Proceeding...`;
        } else {
          result.action = {
            type: 'pending_approval',
            toolId: tool.id,
            requestId: request.id,
            reason: request.status
          };
          result.response = `I'll need approval to ${tool.name.toLowerCase()}. I've sent the request to Slack for review.`;
        }
      } else {
        // No approval needed
        result.action = {
          type: 'execute',
          toolId: tool.id
        };
        result.response = `Got it! I'll ${tool.name.toLowerCase()} for you.`;
      }
    } else {
      // No specific tool - use general chat
      const context = await buildContext(sessionId, message, brandId);
      const chatResponse = await claude.chat(message, [], brandId);
      result.response = chatResponse.response;
    }
  }

  // 7. Add assistant response to conversation
  if (result.response) {
    await addMessage(sessionId, {
      role: 'assistant',
      content: result.response,
      toolUsed: result.suggestedTool
    });
  }

  // 8. Log to audit
  await auditLog({
    event_type: 'chat_message',
    severity: confidence.recommendation === 'reject' ? 'warning' : 'info',
    brand_id: brandId,
    user_id: userId,
    session_id: sessionId,
    message: `Processed: "${message.substring(0, 50)}..."`,
    details: {
      confidence: confidence.score,
      intent: enrichedIntent.actionCategory,
      tool: result.suggestedTool,
      action: result.action?.type
    },
    duration_ms: Date.now() - startTime
  });

  return result;
}

// Quick process without AI (for real-time validation)
export function quickProcess(message: string): {
  intent: Partial<ParsedIntent>;
  confidence: ConfidenceResult;
  viable: boolean;
} {
  const parsed = quickParse(message);

  const fullParsed: ParsedIntent = {
    action: (parsed as any).action || 'unknown',
    actionCategory: parsed.actionCategory || 'unknown',
    channel: parsed.channel,
    campaignType: parsed.campaignType,
    audience: parsed.audience,
    schedule: { type: 'immediate' },
    rawInput: message,
    extractedEntities: [],
    parseMethod: (parsed as any).parseMethod || 'pattern'
  };

  const confidence = calculateConfidence(fullParsed);

  return {
    intent: parsed,
    confidence,
    viable: isViable(fullParsed)
  };
}

// Handle user correction of a parse
export async function handleCorrection(
  sessionId: string,
  originalInput: string,
  correction: {
    action?: string;
    actionCategory?: string;
    channel?: string;
    campaignType?: string;
    audience?: string;
  },
  brandId: string = 'premier-nissan',
  userId?: string
): Promise<void> {
  const originalParse = await parseIntent(originalInput);

  await recordCorrection(
    originalInput,
    originalParse,
    correction,
    brandId,
    userId
  );

  // Add correction to conversation context
  await addMessage(sessionId, {
    role: 'user',
    content: `[Correction] I meant: ${JSON.stringify(correction)}`
  });
}

// Get conversation intelligence summary
export async function getConversationSummary(sessionId: string): Promise<{
  messageCount: number;
  toolsUsed: string[];
  intentsDetected: string[];
  avgConfidence: number;
}> {
  const conversation = await getConversation(sessionId);

  if (!conversation) {
    return {
      messageCount: 0,
      toolsUsed: [],
      intentsDetected: [],
      avgConfidence: 0
    };
  }

  // Extract intents from user messages
  const intentsDetected: string[] = [];
  let totalConfidence = 0;
  let messageCount = 0;

  for (const msg of conversation.messages) {
    if (msg.role === 'user') {
      const parsed = quickParse(msg.content);
      if (parsed.actionCategory && parsed.actionCategory !== 'unknown') {
        intentsDetected.push(parsed.actionCategory);
      }
      const fullParsed: ParsedIntent = {
        action: (parsed as any).action || 'unknown',
        actionCategory: parsed.actionCategory || 'unknown',
        channel: parsed.channel,
        campaignType: parsed.campaignType,
        audience: parsed.audience,
        schedule: { type: 'immediate' },
        rawInput: msg.content,
        extractedEntities: [],
        parseMethod: 'pattern'
      };
      const confidence = calculateConfidence(fullParsed);
      totalConfidence += confidence.score;
      messageCount++;
    }
  }

  return {
    messageCount: conversation.messages.length,
    toolsUsed: conversation.toolsUsed,
    intentsDetected: [...new Set(intentsDetected)],
    avgConfidence: messageCount > 0 ? Math.round(totalConfidence / messageCount) : 0
  };
}

// Get intelligence system status
export async function getSystemStatus(brandId: string = 'premier-nissan'): Promise<{
  healthy: boolean;
  learningStats: Awaited<ReturnType<typeof getLearningStats>>;
  knowledgeBaseStatus: string;
}> {
  const learningStats = await getLearningStats(brandId);

  return {
    healthy: true,
    learningStats,
    knowledgeBaseStatus: 'active'
  };
}

export default {
  processMessage,
  quickProcess,
  handleCorrection,
  getConversationSummary,
  getSystemStatus,
  generateSessionId
};
