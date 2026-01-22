// Audit Log Service
// Tracks all AI actions for compliance and debugging

import supabase from './db';
import { withFailsafe } from '../utils/failsafe';

export type AuditEventType =
  | 'chat_message'
  | 'content_generated'
  | 'content_reviewed'
  | 'tool_invoked'
  | 'tool_executed'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied'
  | 'guardrail_triggered'
  | 'campaign_created'
  | 'campaign_executed'
  | 'error';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEntry {
  id?: string;
  event_type: AuditEventType;
  severity: AuditSeverity;
  brand_id: string;
  user_id?: string;
  session_id?: string;
  request_id?: string;
  tool_id?: string;
  message: string;
  details?: Record<string, any>;
  input_hash?: string;
  output_hash?: string;
  duration_ms?: number;
  created_at?: string;
}

// In-memory cache for recent logs (fallback if Supabase unavailable)
const recentLogs: AuditEntry[] = [];
const MAX_CACHE_SIZE = 1000;

// Generate hash for input/output tracking
function generateHash(content: any): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Log an audit event
export async function log(entry: Omit<AuditEntry, 'id' | 'created_at'>): Promise<AuditEntry> {
  const fullEntry: AuditEntry = {
    ...entry,
    created_at: new Date().toISOString()
  };

  // Add to local cache first
  recentLogs.unshift(fullEntry);
  if (recentLogs.length > MAX_CACHE_SIZE) {
    recentLogs.pop();
  }

  // Try to persist to Supabase
  const result = await withFailsafe(
    `audit_log_${entry.event_type}`,
    async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .insert(fullEntry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    fullEntry // Return entry even if DB fails
  );

  return result.data;
}

// Log chat message
export async function logChat(
  brandId: string,
  sessionId: string,
  userId: string | undefined,
  input: string,
  output: string,
  durationMs: number
): Promise<AuditEntry> {
  return log({
    event_type: 'chat_message',
    severity: 'info',
    brand_id: brandId,
    user_id: userId,
    session_id: sessionId,
    message: `Chat: ${input.substring(0, 50)}...`,
    details: {
      inputLength: input.length,
      outputLength: output.length
    },
    input_hash: generateHash(input),
    output_hash: generateHash(output),
    duration_ms: durationMs
  });
}

// Log content generation
export async function logContentGeneration(
  brandId: string,
  sessionId: string,
  contentType: string,
  input: Record<string, any>,
  output: Record<string, any>,
  brandScore: number,
  durationMs: number
): Promise<AuditEntry> {
  return log({
    event_type: 'content_generated',
    severity: 'info',
    brand_id: brandId,
    session_id: sessionId,
    message: `Generated ${contentType} content (brand score: ${brandScore}%)`,
    details: {
      contentType,
      brandScore,
      channels: Object.keys(output)
    },
    input_hash: generateHash(input),
    output_hash: generateHash(output),
    duration_ms: durationMs
  });
}

// Log content review
export async function logContentReview(
  brandId: string,
  requestId: string,
  passed: boolean,
  brandScore: number,
  checks: Array<{ id: string; passed: boolean }>
): Promise<AuditEntry> {
  return log({
    event_type: 'content_reviewed',
    severity: passed ? 'info' : 'warning',
    brand_id: brandId,
    request_id: requestId,
    message: `Content review: ${passed ? 'PASSED' : 'FAILED'} (score: ${brandScore}%)`,
    details: {
      passed,
      brandScore,
      checksTotal: checks.length,
      checksPassed: checks.filter(c => c.passed).length
    }
  });
}

// Log tool invocation
export async function logToolInvocation(
  brandId: string,
  sessionId: string,
  toolId: string,
  params: Record<string, any>,
  requestId: string
): Promise<AuditEntry> {
  return log({
    event_type: 'tool_invoked',
    severity: 'info',
    brand_id: brandId,
    session_id: sessionId,
    request_id: requestId,
    tool_id: toolId,
    message: `Tool invoked: ${toolId}`,
    details: {
      paramKeys: Object.keys(params)
    },
    input_hash: generateHash(params)
  });
}

// Log tool execution
export async function logToolExecution(
  brandId: string,
  toolId: string,
  requestId: string,
  success: boolean,
  result: any,
  durationMs: number
): Promise<AuditEntry> {
  return log({
    event_type: 'tool_executed',
    severity: success ? 'info' : 'error',
    brand_id: brandId,
    request_id: requestId,
    tool_id: toolId,
    message: `Tool ${toolId}: ${success ? 'SUCCESS' : 'FAILED'}`,
    details: {
      success,
      resultType: typeof result
    },
    output_hash: generateHash(result),
    duration_ms: durationMs
  });
}

// Log approval events
export async function logApproval(
  brandId: string,
  requestId: string,
  eventType: 'approval_requested' | 'approval_granted' | 'approval_denied',
  userId?: string,
  reason?: string
): Promise<AuditEntry> {
  return log({
    event_type: eventType,
    severity: eventType === 'approval_denied' ? 'warning' : 'info',
    brand_id: brandId,
    request_id: requestId,
    user_id: userId,
    message: `Approval ${eventType.replace('approval_', '')} for request ${requestId}`,
    details: {
      reason
    }
  });
}

// Log guardrail trigger
export async function logGuardrail(
  brandId: string,
  sessionId: string,
  guardrailId: string,
  guardrailName: string,
  content: string,
  blocked: boolean
): Promise<AuditEntry> {
  return log({
    event_type: 'guardrail_triggered',
    severity: blocked ? 'warning' : 'info',
    brand_id: brandId,
    session_id: sessionId,
    message: `Guardrail triggered: ${guardrailName} (${blocked ? 'BLOCKED' : 'WARNING'})`,
    details: {
      guardrailId,
      blocked,
      contentPreview: content.substring(0, 100)
    },
    input_hash: generateHash(content)
  });
}

// Log errors
export async function logError(
  brandId: string,
  sessionId: string | undefined,
  error: Error | string,
  context?: Record<string, any>
): Promise<AuditEntry> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  return log({
    event_type: 'error',
    severity: 'error',
    brand_id: brandId,
    session_id: sessionId,
    message: `Error: ${errorMessage}`,
    details: {
      ...context,
      stack: errorStack
    }
  });
}

// Query audit logs
export async function queryLogs(options: {
  brandId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  sessionId?: string;
  requestId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: AuditEntry[]; total: number }> {
  const result = await withFailsafe(
    'audit_query',
    async () => {
      let query = supabase
        .from('audit_log')
        .select('*', { count: 'exact' });

      if (options.brandId) query = query.eq('brand_id', options.brandId);
      if (options.eventType) query = query.eq('event_type', options.eventType);
      if (options.severity) query = query.eq('severity', options.severity);
      if (options.sessionId) query = query.eq('session_id', options.sessionId);
      if (options.requestId) query = query.eq('request_id', options.requestId);
      if (options.startDate) query = query.gte('created_at', options.startDate);
      if (options.endDate) query = query.lte('created_at', options.endDate);

      query = query
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    },
    // Fallback to in-memory cache
    {
      data: recentLogs.filter(l =>
        (!options.brandId || l.brand_id === options.brandId) &&
        (!options.eventType || l.event_type === options.eventType)
      ).slice(0, options.limit || 50),
      total: recentLogs.length
    }
  );

  return result.data;
}

// Get audit summary stats
export async function getStats(
  brandId: string,
  hours: number = 24
): Promise<{
  totalEvents: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  errorRate: number;
}> {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data } = await queryLogs({
    brandId,
    startDate,
    limit: 1000
  });

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const entry of data) {
    byType[entry.event_type] = (byType[entry.event_type] || 0) + 1;
    bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
  }

  const errorCount = data.filter(e => e.severity === 'error' || e.severity === 'critical').length;

  return {
    totalEvents: data.length,
    byType,
    bySeverity,
    errorRate: data.length > 0 ? errorCount / data.length : 0
  };
}

export default {
  log,
  logChat,
  logContentGeneration,
  logContentReview,
  logToolInvocation,
  logToolExecution,
  logApproval,
  logGuardrail,
  logError,
  queryLogs,
  getStats
};
