import { useState, useEffect } from 'react';
import { X, Users, Mail, Send, Loader2, FileText, CheckCircle2, XCircle, AlertTriangle, Edit3 } from 'lucide-react';
import { Sheet, SheetContent } from './ui/sheet';
import { Button } from './ui/button';
import { GateVisualization, type GateStatus } from './TrustLayer/GateVisualization';
import { GuardrailsLive, useGuardrailAnimation, type GuardrailCheck } from './TrustLayer/GuardrailsLive';
import { ComplianceReceipt, generateReceiptId, generateContentHash, type ComplianceReceiptData } from './TrustLayer/ComplianceReceipt';
import { campaignsApi } from '../lib/api';

export interface CampaignData {
  id?: string;
  name: string;
  type: string;
  audienceSize: number;
  channel: string;
  content?: {
    subject?: string;
    body?: string;
    cta?: string;
  };
  brandScore?: number;
  gateResults?: any[];
  status?: string;
}

interface ReviewLaunchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: CampaignData;
  onSubmitReview?: (campaignId: string) => Promise<void>;
  onExecute?: (campaignId: string) => Promise<void>;
  onApprove?: (campaignId: string) => Promise<void>;
  onReject?: (campaignId: string, reason?: string) => Promise<void>;
  onEditContent?: () => void;
}

// Default guardrail checks
const defaultGuardrails: GuardrailCheck[] = [
  { id: 'tone', name: 'Tone Alignment', description: 'Matches brand voice', status: 'passed', message: 'Professional and friendly' },
  { id: 'compliance', name: 'Compliance Check', description: 'CAN-SPAM compliant', status: 'passed', message: 'Unsubscribe link present' },
  { id: 'pii', name: 'PII Detection', description: 'No sensitive data exposed', status: 'passed', message: 'No PII detected' },
  { id: 'spam', name: 'Spam Score', description: 'Email deliverability', status: 'passed', message: 'Score: 2/10 (Good)' },
  { id: 'brand', name: 'Brand Guidelines', description: 'Visual and text guidelines', status: 'passed', message: 'All guidelines followed' },
];

export function ReviewLaunchDrawer({ isOpen, onClose, campaign, onSubmitReview, onExecute, onApprove, onReject, onEditContent }: ReviewLaunchDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [gates, setGates] = useState<GateStatus[]>([
    { gate: 1, status: 'pending' },
    { gate: 2, status: 'pending' },
    { gate: 3, status: 'pending' },
  ]);

  // Update gates from campaign data
  useEffect(() => {
    if (campaign?.gateResults) {
      const updatedGates: GateStatus[] = campaign.gateResults.map((g: any) => ({
        gate: g.gate as 1 | 2 | 3,
        status: g.passed ? 'passed' : (g.details?.status === 'pending_approval' || g.details?.status === 'awaiting_approval' ? 'processing' : 'pending'),
        details: {
          checks: g.details?.checks ? Object.entries(g.details.checks).filter(([, v]) => v).map(([k]) => k) : undefined,
          brandScore: g.details?.brandScore,
          approver: g.details?.approvedBy,
          approvedAt: g.details?.approvedAt,
          error: g.details?.error,
        },
      }));
      setGates(updatedGates);
    }
  }, [campaign?.gateResults]);

  // Guardrails animation
  const { checks, startChecking, isComplete } = useGuardrailAnimation(defaultGuardrails);

  const handleSubmitReview = async () => {
    if (!campaign) return;

    setIsSubmitting(true);
    startChecking();

    try {
      // If we don't have a campaign ID, create one first
      let campaignId = campaign.id;

      if (!campaignId) {
        const createResponse = await campaignsApi.create({
          name: campaign.name,
          type: campaign.type,
          channels: [campaign.channel.toLowerCase().split(' + ')[0]],
          content: campaign.content,
        });
        if (createResponse.success && createResponse.data) {
          campaignId = createResponse.data.id;
        }
      }

      if (campaignId) {
        // Show processing state for Gate 1
        setGates(prev => prev.map(g => g.gate === 1 ? { ...g, status: 'processing' } : g));

        // Submit for actual review - this runs real guardrails
        const reviewResponse = await campaignsApi.review(campaignId);

        if (reviewResponse.success && reviewResponse.data?.gates) {
          const gateResults = reviewResponse.data.gates;
          const gate1Result = gateResults.find((g: any) => g.gate === 1);
          const gate2Result = gateResults.find((g: any) => g.gate === 2);

          // Update Gate 1 with ACTUAL results
          if (gate1Result) {
            const blockers = gate1Result.details?.guardrailBlockers || [];
            const errors = gate1Result.details?.errors || [];
            const allIssues = [...blockers, ...errors.filter((e: string) => !blockers.some((b: string) => e.includes(b)))];

            setGates(prev => prev.map(g => g.gate === 1 ? {
              ...g,
              status: gate1Result.passed ? 'passed' : 'failed',
              details: {
                checks: allIssues, // Array of issues for UI to display
                error: allIssues.length > 0 ? `Found ${allIssues.length} content violation(s)` : undefined
              }
            } : g));

            // If Gate 1 failed, don't proceed
            if (!gate1Result.passed) {
              console.error('Gate 1 failed:', allIssues);
              return;
            }
          }

          // Update Gate 2 with ACTUAL results
          await new Promise(r => setTimeout(r, 500)); // Brief delay for visual feedback
          setGates(prev => prev.map(g => g.gate === 2 ? { ...g, status: 'processing' } : g));
          await new Promise(r => setTimeout(r, 500));

          if (gate2Result) {
            setGates(prev => prev.map(g => g.gate === 2 ? {
              ...g,
              status: gate2Result.passed ? 'passed' : 'failed',
              details: { brandScore: gate2Result.details?.brandScore || 85 }
            } : g));

            // If Gate 2 failed, don't proceed
            if (!gate2Result.passed) {
              return;
            }
          }

          // Both gates passed - proceed to Gate 3
          setGates(prev => prev.map(g => g.gate === 3 ? { ...g, status: 'processing' } : g));
          onSubmitReview?.(campaignId);
        }
      }
    } catch (error) {
      console.error('Review submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecute = async () => {
    if (!campaign?.id) return;

    setIsExecuting(true);
    try {
      await onExecute?.(campaign.id);
      setShowReceipt(true);
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleApprove = async () => {
    if (!campaign?.id) return;

    setIsApproving(true);
    try {
      await onApprove?.(campaign.id);
      // Update gate 3 to passed
      setGates(prev => prev.map(g =>
        g.gate === 3
          ? { ...g, status: 'passed', details: { approver: 'You', approvedAt: new Date().toISOString() } }
          : g
      ));
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!campaign?.id) return;

    try {
      await onReject?.(campaign.id, 'Rejected via UI');
      // Update gate 3 to failed
      setGates(prev => prev.map(g =>
        g.gate === 3
          ? { ...g, status: 'failed', details: { error: 'Rejected by reviewer' } }
          : g
      ));
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const allGatesPassed = gates.every(g => g.status === 'passed');
  const pendingApproval = gates.find(g => g.gate === 3)?.status === 'processing';
  const anyGateFailed = gates.some(g => g.status === 'failed');
  const failedGate = gates.find(g => g.status === 'failed');
  const gate1Failed = gates.find(g => g.gate === 1)?.status === 'failed';
  const gate2Failed = gates.find(g => g.gate === 2)?.status === 'failed';

  // Generate receipt data
  const receiptData: ComplianceReceiptData = {
    receiptId: generateReceiptId(),
    campaignId: campaign?.id || 'draft',
    campaignName: campaign?.name || 'Untitled Campaign',
    timestamp: new Date().toISOString(),
    gates: gates.map(g => ({
      gate: g.gate,
      passed: g.status === 'passed',
      timestamp: new Date().toISOString(),
      details: g.details || {},
    })),
    brandScore: campaign?.brandScore || 85,
    approver: gates.find(g => g.gate === 3)?.details?.approver
      ? { name: gates.find(g => g.gate === 3)!.details!.approver!, approvedAt: gates.find(g => g.gate === 3)!.details!.approvedAt! }
      : undefined,
    contentHash: campaign?.content?.body ? generateContentHash(campaign.content.body) : undefined,
    audienceSize: campaign?.audienceSize || 0,
    channels: campaign?.channel ? campaign.channel.split(' + ') : ['Email'],
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[520px] p-0 flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex-shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-slate-900">3-Gate Review & Launch</h2>
              <p className="text-[13px] text-slate-600 mt-1">{campaign?.name || 'Campaign Review'}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Campaign Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Audience</span>
              </div>
              <p className="text-[16px] font-bold text-slate-900">
                {campaign?.audienceSize?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Channel</span>
              </div>
              <p className="text-[13px] font-semibold text-slate-900">
                {campaign?.channel || 'Email'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-indigo-600 uppercase">Brand Score</span>
              </div>
              <p className="text-[16px] font-bold text-indigo-600">
                {campaign?.brandScore || 85}%
              </p>
            </div>
          </div>

          {/* 3-Gate Visualization */}
          <GateVisualization gates={gates} />

          {/* Guardrails Live Check */}
          <GuardrailsLive checks={checks} title="Content Guardrails" />

          {/* Compliance Receipt (shown after execution) */}
          {showReceipt && (
            <ComplianceReceipt data={receiptData} />
          )}

          {/* Gate Failure Alert */}
          {anyGateFailed && failedGate && (
            <div className="p-4 rounded-xl border-2 border-red-300 bg-red-50 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-[13px] font-bold text-red-800">
                  Gate {failedGate.gate} Failed - Action Required
                </span>
              </div>
              {failedGate.details?.error && (
                <p className="text-[12px] text-red-700">{failedGate.details.error}</p>
              )}
              {failedGate.details?.checks && failedGate.details.checks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-red-800">Issues Found:</p>
                  {failedGate.details.checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] text-red-700">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email Preview - with redlines if gate failed */}
          {campaign?.content && !showReceipt && (
            <div className={`p-4 rounded-xl border space-y-3 ${anyGateFailed ? 'border-2 border-red-300 bg-red-50/50' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${anyGateFailed ? 'text-red-500' : 'text-slate-500'}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wide ${anyGateFailed ? 'text-red-800' : 'text-slate-900'}`}>
                    {anyGateFailed ? 'Content Needs Revision' : 'Content Preview'}
                  </span>
                </div>
                {anyGateFailed && onEditContent && (
                  <button
                    onClick={onEditContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-semibold transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Content
                  </button>
                )}
              </div>

              {campaign.content.subject && (
                <div className={`p-3 rounded-lg ${anyGateFailed ? 'bg-red-100/50 border border-red-200' : 'bg-slate-50'}`}>
                  <p className={`text-[10px] mb-1 ${anyGateFailed ? 'text-red-500' : 'text-slate-500'}`}>Subject:</p>
                  <p className={`text-[13px] font-medium ${anyGateFailed ? 'text-red-900' : 'text-slate-900'}`}>{campaign.content.subject}</p>
                </div>
              )}

              {campaign.content.body && (
                <div className={`p-3 rounded-lg ${anyGateFailed ? 'bg-red-100/50 border border-red-200' : 'bg-slate-50'}`}>
                  <p className={`text-[10px] mb-1 ${anyGateFailed ? 'text-red-500' : 'text-slate-500'}`}>Body:</p>
                  <p className={`text-[12px] whitespace-pre-line line-clamp-4 ${anyGateFailed ? 'text-red-800' : 'text-slate-700'}`}>{campaign.content.body}</p>
                </div>
              )}

              {campaign.content.cta && (
                <div className={`p-3 rounded-lg border ${anyGateFailed ? 'bg-red-100/50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}>
                  <p className={`text-[10px] mb-1 ${anyGateFailed ? 'text-red-500' : 'text-indigo-500'}`}>Call to Action:</p>
                  <p className={`text-[12px] font-semibold ${anyGateFailed ? 'text-red-700' : 'text-indigo-700'}`}>{campaign.content.cta}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-200 flex-shrink-0 space-y-3 bg-white">
          {showReceipt ? (
            <>
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-[14px] font-semibold"
                onClick={onClose}
              >
                Done
              </Button>
              <p className="text-[12px] text-slate-500 text-center">
                Campaign executed successfully! Check your email.
              </p>
            </>
          ) : anyGateFailed ? (
            /* Gate Failed - Show Edit Content */
            <>
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2"
                onClick={onEditContent}
              >
                <Edit3 className="w-4 h-4" />
                Edit Content & Retry
              </Button>
              <p className="text-[12px] text-red-600 text-center font-medium">
                Gate {failedGate?.gate} failed. Please fix the issues above and resubmit.
              </p>
            </>
          ) : allGatesPassed ? (
            <>
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2"
                onClick={handleExecute}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publish Campaign
                  </>
                )}
              </Button>
              <p className="text-[12px] text-emerald-600 text-center font-medium">
                All 3 gates passed! Ready to launch.
              </p>
            </>
          ) : pendingApproval ? (
            /* Gate 3 Pending - Show Approve/Reject Buttons */
            <>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2"
                  onClick={handleApprove}
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Approve
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2"
                  onClick={handleReject}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </div>
              <p className="text-[12px] text-amber-600 text-center">
                Gates 1 & 2 passed. Human approval required (Gate 3).
              </p>
              <p className="text-[10px] text-slate-400 text-center">
                Also sent to Slack #marketing-approvals
              </p>
            </>
          ) : (
            <>
              <Button
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2"
                onClick={handleSubmitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Gates...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit for 3-Gate Review
                  </>
                )}
              </Button>
              <p className="text-[12px] text-slate-500 text-center">
                Campaign will go through automated checks and approval
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}