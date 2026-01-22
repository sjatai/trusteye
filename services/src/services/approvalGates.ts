// Approval Gates Service
// Orchestrates the 3-gate approval system

import { Tool, getToolById } from '../config/tools-registry';
import { runGuardrails, runBlockingGuardrails, GuardrailReport } from './guardrailRunner';
import { validateToolParams } from './toolResolver';
import gateTwo from './gateTwo';
import slack from './slack';
import { withFailsafe } from '../utils/failsafe';

// Approval status tracking
export type ApprovalStatus =
  | 'pending_gate1'
  | 'pending_gate2'
  | 'pending_gate3'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface ApprovalRequest {
  id: string;
  toolId: string;
  params: Record<string, any>;
  content?: {
    email?: { subject?: string; body?: string };
    sms?: { message?: string };
    social?: { post?: string };
  };
  userId: string;
  brandId: string;
  createdAt: string;
  status: ApprovalStatus;
  gates: {
    gate1?: Gate1Result;
    gate2?: Gate2Result;
    gate3?: Gate3Result;
  };
}

export interface Gate1Result {
  passed: boolean;
  timestamp: string;
  validationErrors: string[];
  guardrailReport: GuardrailReport;
}

export interface Gate2Result {
  passed: boolean;
  timestamp: string;
  brandScore: number;
  brandScoreDetails: {
    toneAlignment: number;
    voiceConsistency: number;
    messageClarity: number;
    audienceRelevance: number;
  };
  checks: Array<{
    id: string;
    name: string;
    passed: boolean;
    details?: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  suggestions: string[];
}

export interface Gate3Result {
  passed: boolean;
  timestamp: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  slackMessageId?: string;
}

// In-memory approval storage (would be Supabase in production)
const approvalRequests: Map<string, ApprovalRequest> = new Map();

// Generate unique ID
function generateId(): string {
  return `apr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Create a new approval request
export async function createApprovalRequest(
  toolId: string,
  params: Record<string, any>,
  content: ApprovalRequest['content'],
  userId: string,
  brandId: string
): Promise<ApprovalRequest> {
  const request: ApprovalRequest = {
    id: generateId(),
    toolId,
    params,
    content,
    userId,
    brandId,
    createdAt: new Date().toISOString(),
    status: 'pending_gate1',
    gates: {}
  };

  approvalRequests.set(request.id, request);
  return request;
}

// Gate 1: Rules Validation
export async function runGate1(requestId: string): Promise<Gate1Result> {
  const request = approvalRequests.get(requestId);
  if (!request) throw new Error(`Approval request ${requestId} not found`);

  const validationErrors: string[] = [];

  // 1. Validate tool exists
  const tool = getToolById(request.toolId);
  if (!tool) {
    validationErrors.push(`Unknown tool: ${request.toolId}`);
  } else {
    // 2. Validate required params
    const paramValidation = validateToolParams(tool, request.params);
    if (!paramValidation.valid) {
      validationErrors.push(...paramValidation.missing.map(p => `Missing required parameter: ${p}`));
      validationErrors.push(...paramValidation.errors);
    }
  }

  // 3. Run blocking guardrails on content
  const contentText = buildContentText(request.content);
  const guardrailReport = runGuardrails(contentText, {
    brandId: request.brandId,
    type: detectContentType(request.content)
  });

  // Add blocking guardrail violations to errors
  if (guardrailReport.blockers.length > 0) {
    validationErrors.push(...guardrailReport.blockers.map(b => `Guardrail blocked: ${b}`));
  }

  const result: Gate1Result = {
    passed: validationErrors.length === 0,
    timestamp: new Date().toISOString(),
    validationErrors,
    guardrailReport
  };

  // Update request
  request.gates.gate1 = result;
  request.status = result.passed ? 'pending_gate2' : 'rejected';
  approvalRequests.set(requestId, request);

  return result;
}

// Gate 2: AI Review
export async function runGate2(requestId: string): Promise<Gate2Result> {
  const request = approvalRequests.get(requestId);
  if (!request) throw new Error(`Approval request ${requestId} not found`);

  if (request.status !== 'pending_gate2') {
    throw new Error(`Request ${requestId} is not ready for Gate 2 (status: ${request.status})`);
  }

  const aiReview = await gateTwo.reviewContent(
    request.content || {},
    request.brandId
  );

  const result: Gate2Result = {
    passed: aiReview.passed,
    timestamp: new Date().toISOString(),
    brandScore: aiReview.brandScore,
    brandScoreDetails: aiReview.brandScoreDetails,
    checks: aiReview.checks,
    suggestions: aiReview.suggestions
  };

  // Update request
  request.gates.gate2 = result;

  // Check if tool requires human approval
  const tool = getToolById(request.toolId);
  if (tool?.requires_approval) {
    request.status = result.passed ? 'pending_gate3' : 'rejected';
  } else {
    // Auto-approve if no human approval required
    request.status = result.passed ? 'approved' : 'rejected';
  }

  approvalRequests.set(requestId, request);

  return result;
}

// Gate 3: Human Approval (via Slack)
export async function runGate3(requestId: string): Promise<Gate3Result> {
  const request = approvalRequests.get(requestId);
  if (!request) throw new Error(`Approval request ${requestId} not found`);

  if (request.status !== 'pending_gate3') {
    throw new Error(`Request ${requestId} is not ready for Gate 3 (status: ${request.status})`);
  }

  const tool = getToolById(request.toolId);

  // Send Slack approval request
  const slackResult = await withFailsafe(
    `gate3_slack_${requestId}`,
    async () => {
      // Build approval payload for Slack
      const slackSent = await slack.sendCampaignApprovalRequest({
        campaignId: requestId,
        campaignName: tool?.name || request.toolId,
        campaignType: tool?.category || 'internal',
        audienceSize: 0, // Would be populated from params
        channels: [tool?.category || 'internal'],
        gate1Passed: request.gates.gate1?.passed || false,
        gate2Passed: request.gates.gate2?.passed || false,
        brandScore: request.gates.gate2?.brandScore || 0
      });

      return {
        slackMessageId: slackSent ? `msg_${Date.now()}` : null,
        sent: slackSent
      };
    },
    { slackMessageId: null, sent: false }
  );

  const result: Gate3Result = {
    passed: false, // Will be updated when human approves
    timestamp: new Date().toISOString(),
    slackMessageId: slackResult.data.slackMessageId || undefined
  };

  // Update request - stays pending until human approves
  request.gates.gate3 = result;
  approvalRequests.set(requestId, request);

  return result;
}

// Handle human approval response
export async function handleApproval(
  requestId: string,
  approved: boolean,
  userId: string,
  reason?: string
): Promise<ApprovalRequest> {
  const request = approvalRequests.get(requestId);
  if (!request) throw new Error(`Approval request ${requestId} not found`);

  if (request.status !== 'pending_gate3') {
    throw new Error(`Request ${requestId} is not pending approval`);
  }

  request.gates.gate3 = {
    ...request.gates.gate3!,
    passed: approved,
    timestamp: new Date().toISOString(),
    ...(approved ? { approvedBy: userId } : { rejectedBy: userId, rejectionReason: reason })
  };

  request.status = approved ? 'approved' : 'rejected';
  approvalRequests.set(requestId, request);

  return request;
}

// Run all gates in sequence
export async function runAllGates(
  toolId: string,
  params: Record<string, any>,
  content: ApprovalRequest['content'],
  userId: string,
  brandId: string
): Promise<{ request: ApprovalRequest; canExecute: boolean }> {
  // Create request
  const request = await createApprovalRequest(toolId, params, content, userId, brandId);

  // Gate 1
  const gate1 = await runGate1(request.id);
  if (!gate1.passed) {
    return { request: approvalRequests.get(request.id)!, canExecute: false };
  }

  // Gate 2
  const gate2 = await runGate2(request.id);
  if (!gate2.passed) {
    return { request: approvalRequests.get(request.id)!, canExecute: false };
  }

  // Check if Gate 3 is needed
  const tool = getToolById(toolId);
  if (tool?.requires_approval) {
    // Gate 3 - sends to Slack, doesn't wait for response
    await runGate3(request.id);
    return { request: approvalRequests.get(request.id)!, canExecute: false };
  }

  // No Gate 3 needed - can execute immediately
  return { request: approvalRequests.get(request.id)!, canExecute: true };
}

// Get approval request by ID
export function getApprovalRequest(id: string): ApprovalRequest | undefined {
  return approvalRequests.get(id);
}

// Get all pending approvals
export function getPendingApprovals(brandId?: string): ApprovalRequest[] {
  return Array.from(approvalRequests.values())
    .filter(r =>
      r.status === 'pending_gate3' &&
      (!brandId || r.brandId === brandId)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Utility: Build content text for guardrail checking
function buildContentText(content?: ApprovalRequest['content']): string {
  if (!content) return '';

  const parts: string[] = [];
  if (content.email?.subject) parts.push(content.email.subject);
  if (content.email?.body) parts.push(content.email.body);
  if (content.sms?.message) parts.push(content.sms.message);
  if (content.social?.post) parts.push(content.social.post);

  return parts.join('\n\n');
}

// Utility: Detect content type
function detectContentType(content?: ApprovalRequest['content']): string {
  if (content?.email) return 'email';
  if (content?.sms) return 'sms';
  if (content?.social) return 'social';
  return 'generic';
}

// Utility: Build approval summary for Slack
function buildApprovalSummary(request: ApprovalRequest, tool?: Tool): string {
  const lines = [
    `📋 *Campaign Approval Request*`,
    ``,
    `*Tool:* ${tool?.name || request.toolId}`,
    `*Request ID:* ${request.id}`,
    `*Brand Score:* ${request.gates.gate2?.brandScore || 'N/A'}%`,
    ``
  ];

  if (request.content?.email) {
    lines.push(`*Email Subject:* ${request.content.email.subject || 'N/A'}`);
    lines.push(`*Email Preview:* ${(request.content.email.body || '').substring(0, 100)}...`);
  }

  if (request.content?.sms?.message) {
    lines.push(`*SMS:* ${request.content.sms.message}`);
  }

  if (request.content?.social?.post) {
    lines.push(`*Social Post:* ${request.content.social.post.substring(0, 100)}...`);
  }

  // Add warnings if any
  const warnings = request.gates.gate1?.guardrailReport.warnings || [];
  if (warnings.length > 0) {
    lines.push(``);
    lines.push(`⚠️ *Warnings:*`);
    warnings.forEach(w => lines.push(`• ${w}`));
  }

  // Add suggestions if any
  const suggestions = request.gates.gate2?.suggestions || [];
  if (suggestions.length > 0) {
    lines.push(``);
    lines.push(`💡 *Suggestions:*`);
    suggestions.slice(0, 3).forEach(s => lines.push(`• ${s}`));
  }

  return lines.join('\n');
}

export default {
  createApprovalRequest,
  runGate1,
  runGate2,
  runGate3,
  runAllGates,
  handleApproval,
  getApprovalRequest,
  getPendingApprovals
};
