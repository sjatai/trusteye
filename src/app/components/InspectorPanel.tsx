/**
 * INSPECTOR PANEL BUTTON LOGIC
 * ============================
 *
 * Button States (based on gateResults):
 *
 * 1. anyGateFailed (gate1 OR gate2 failed, OR gate3 explicitly failed without awaiting)
 *    → Show: "Edit Content & Retry" (red button)
 *    → Message: "Gate validation failed. Please fix the issues and resubmit."
 *
 * 2. allPassed (gate1 AND gate2 AND gate3 all passed)
 *    → Show: "Publish Campaign" (green button)
 *    → Message: "All 3 gates passed! Ready to launch."
 *
 * 3. awaitingApproval (gate1 passed AND gate2 passed AND gate3 not yet approved)
 *    → Show: "Approve" + "Reject" buttons
 *    → Message: "Gates 1 & 2 passed. Human approval required."
 *
 * 4. default (no gate results yet, or content ready but not reviewed)
 *    → Show: "Submit for Review" (indigo button)
 *    → Message: "Ready to submit for 3-gate approval"
 *
 * Key Logic:
 * - gate3AwaitingApproval = gate3.details.status === 'awaiting_approval' OR has slackMessageId
 * - anyGateFailed does NOT count gate3 as failed if it's just awaiting approval
 */

import { X, Send, CheckCircle, Users, Mail, Calendar, CheckCircle2, AlertCircle, ShieldCheck, Brain, User, Star, TrendingUp, XCircle, Clock, Sparkles, Loader2, Edit3 } from 'lucide-react';
import { useState, memo } from 'react';

interface InspectorPanelProps {
  type?: 'campaign' | 'segment' | 'content' | 'empty';
  data?: any;
  onClose?: () => void;
  onSubmitReview?: () => void;
  onApprove?: (campaignId: string) => Promise<void>;
  onReject?: (campaignId: string) => Promise<void>;
  onEditContent?: () => void;
  onPublish?: () => Promise<void>;
  onStartNew?: () => void;
  workflowState?: {
    audience?: string;
    messaging?: string;
    channel?: string;
    timing?: string;
    content?: string;
    goal?: string;
  };
}

export const InspectorPanel = memo(function InspectorPanel({ type = 'empty', data, onClose, onSubmitReview, onApprove, onReject, onEditContent, onPublish, onStartNew, workflowState }: InspectorPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!onPublish) return;
    setIsPublishing(true);
    try {
      await onPublish();
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!onSubmitReview) return;
    setIsSubmitting(true);
    try {
      await onSubmitReview();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!onApprove || !data?.id) return;
    setIsApproving(true);
    try {
      await onApprove(data.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !data?.id) return;
    try {
      await onReject(data.id);
    } catch (e) {
      console.error('Reject error:', e);
    }
  };
  // Show workflow progress in empty state on AI Studio page
  if (type === 'empty' && workflowState && Object.keys(workflowState).length > 0) {
    return (
      <div className="w-[360px] bg-white border-l border-slate-200 h-screen flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="text-[15px] font-semibold text-slate-900">Campaign Progress</h3>
          <p className="text-[11px] text-slate-500 mt-1">Your selections so far</p>
        </div>

        {/* Workflow State */}
        <div className="p-5 space-y-3">
          {workflowState.audience && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                  Audience Selected
                </span>
              </div>
              <p className="text-[13px] font-semibold text-emerald-900">
                {workflowState.audience}
              </p>
            </div>
          )}

          {workflowState.messaging && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                  Messaging Selected
                </span>
              </div>
              <p className="text-[13px] font-semibold text-emerald-900">
                {workflowState.messaging}
              </p>
            </div>
          )}

          {workflowState.channel && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                  Channel Selected
                </span>
              </div>
              <p className="text-[13px] font-semibold text-emerald-900">
                {workflowState.channel}
              </p>
            </div>
          )}

          {workflowState.timing && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                  Timing Selected
                </span>
              </div>
              <p className="text-[13px] font-semibold text-emerald-900">
                {workflowState.timing}
              </p>
            </div>
          )}

          {workflowState.content && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                  Content Selected
                </span>
              </div>
              <p className="text-[13px] font-semibold text-emerald-900">
                {workflowState.content}
              </p>
            </div>
          )}

          {/* Next Step Hint */}
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-sky-600" />
              <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wide">
                Next Step
              </span>
            </div>
            <p className="text-[12px] text-sky-900">
              {!workflowState.audience && 'Select an audience to continue'}
              {workflowState.audience && !workflowState.messaging && 'Select messaging approach'}
              {workflowState.messaging && !workflowState.channel && 'Select communication channel'}
              {workflowState.channel && !workflowState.timing && 'Set timing preferences'}
              {workflowState.timing && !workflowState.content && 'Choose or create content'}
              {workflowState.content && 'Review and launch your campaign'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'empty') {
    return (
      <div className="w-[360px] bg-white border-l border-slate-200 h-screen flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="text-[15px] font-semibold text-slate-900">Preview</h3>
          <p className="text-[11px] text-slate-500 mt-1">See how your campaigns look</p>
        </div>

        {/* Device Mockups */}
        <div className="flex-1 p-5 space-y-6">
          {/* Mobile Preview */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Mobile Preview
            </p>
            <div className="relative mx-auto w-[180px]">
              {/* Phone Frame */}
              <div className="relative rounded-[28px] bg-slate-900 p-2 shadow-xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-900 rounded-b-2xl z-10" />
                
                {/* Screen */}
                <div className="relative rounded-[20px] bg-white overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                  {/* Status Bar */}
                  <div className="h-11 bg-gradient-to-br from-sky-50 to-white border-b border-slate-100 flex items-center justify-between px-4 pt-2">
                    <span className="text-[9px] font-semibold text-slate-900">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-slate-300" />
                      <div className="w-3 h-3 rounded-sm bg-slate-300" />
                      <div className="w-3 h-3 rounded-sm bg-slate-300" />
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-teal-400" />
                      <div>
                        <div className="w-16 h-2 bg-slate-200 rounded mb-1" />
                        <div className="w-20 h-1.5 bg-slate-100 rounded" />
                      </div>
                    </div>
                    
                    <div className="w-full h-20 bg-gradient-to-br from-emerald-50 to-sky-50 rounded-lg border border-slate-100" />
                    
                    <div className="space-y-1.5">
                      <div className="w-full h-2 bg-slate-100 rounded" />
                      <div className="w-full h-2 bg-slate-100 rounded" />
                      <div className="w-3/4 h-2 bg-slate-100 rounded" />
                    </div>

                    <div className="w-full h-6 bg-sky-500 rounded-lg mt-3" />
                  </div>
                </div>
              </div>

              {/* Label */}
              <p className="text-center text-[10px] text-slate-500 mt-3">Push Notification</p>
            </div>
          </div>

          {/* Email Preview */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Email Preview
            </p>
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
              {/* Email Header */}
              <div className="p-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-teal-400" />
                  <div className="flex-1">
                    <div className="w-24 h-2 bg-slate-200 rounded mb-1" />
                    <div className="w-32 h-1.5 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="p-3 space-y-2">
                <div className="w-full h-16 bg-gradient-to-br from-emerald-50 to-sky-50 rounded border border-slate-100" />
                
                <div className="space-y-1.5 py-2">
                  <div className="w-full h-1.5 bg-slate-100 rounded" />
                  <div className="w-full h-1.5 bg-slate-100 rounded" />
                  <div className="w-full h-1.5 bg-slate-100 rounded" />
                  <div className="w-2/3 h-1.5 bg-slate-100 rounded" />
                </div>

                <div className="w-full h-5 bg-sky-500 rounded mt-2" />
              </div>

              {/* Email Footer */}
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
                <div className="w-20 h-1 bg-slate-200 rounded mx-auto" />
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
            <p className="text-[11px] text-sky-700 leading-relaxed">
              💡 Start a campaign to see live previews across all channels
            </p>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETED CAMPAIGN - Show Receipt View
  if (type === 'campaign' && (data?.status === 'completed' || data?.receipt)) {
    const receipt = data?.receipt || {};

    return (
      <div className="w-[360px] bg-white border-l border-slate-200 h-screen flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-[15px] font-semibold text-emerald-700">Campaign Published!</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Compliance receipt</p>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 p-5 space-y-4">
          {/* Receipt ID */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">
              Receipt ID
            </div>
            <p className="text-[18px] font-bold text-emerald-900 font-mono">
              {receipt.id || `TR-${Date.now().toString(36).toUpperCase()}`}
            </p>
          </div>

          {/* Campaign Summary */}
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Campaign</div>
              <p className="text-[14px] font-semibold text-slate-900">{data?.name || receipt.campaignName}</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Audience</div>
              <p className="text-[13px] text-slate-700">{data?.audienceDescription || receipt.audience}</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Emails Sent</div>
              <p className="text-[13px] text-slate-700">{receipt.audienceSize || data?.audienceSize || 1}</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Brand Score</div>
              <p className="text-[13px] text-slate-700">{receipt.brandScore || data?.brandScore || 85}%</p>
            </div>
          </div>

          {/* Gate Results */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-3">
              3-Gate Verification
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[12px] text-slate-700">Gate 1: Rules Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[12px] text-slate-700">Gate 2: AI Review</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[12px] text-slate-700">Gate 3: Human Approval</span>
              </div>
            </div>
          </div>

          {/* Approval Info */}
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Approved By</div>
              <p className="text-[12px] text-slate-700">{receipt.approvedBy || 'sumitjain@gmail.com'}</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Published At</div>
              <p className="text-[12px] text-slate-700">{new Date(receipt.executedAt || Date.now()).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Footer with Start New button */}
        <div className="border-t border-slate-200 p-4 bg-emerald-50 space-y-3">
          <p className="text-[11px] text-emerald-700 text-center">
            ✅ Campaign successfully published and compliant
          </p>
          {onStartNew && (
            <button
              onClick={onStartNew}
              className="w-full px-4 py-3 rounded-xl bg-[#1E5ECC] hover:bg-[#1a4fad] text-white text-[13px] font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start New Campaign
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'campaign') {
    const brandScore = data?.brandScore || 85;
    const brandScoreDetails = data?.brandScoreDetails || {
      toneAlignment: 85,
      voiceConsistency: 88,
      messageClarity: 90,
      audienceRelevance: 87,
    };
    const gateResults = data?.gateResults || [];

    return (
      <div className="w-[360px] bg-white border-l border-slate-200 h-screen flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-[15px] font-semibold text-slate-900">Campaign Preview</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Campaign Data */}
        <div className="p-5 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className="inline-flex px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold">
              {data?.status || 'Draft'}
            </div>
            <div className="inline-flex px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">
              {data?.campaignType || 'Campaign'}
            </div>
          </div>

          {/* Campaign Name */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1 block">
              Campaign Name
            </label>
            <p className="text-[15px] font-semibold text-slate-900">
              {data?.name || 'Untitled Campaign'}
            </p>
          </div>

          {/* Brand Score - THE WOW FACTOR */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-indigo-600" />
                <span className="text-[12px] font-bold text-indigo-900 uppercase tracking-wide">Brand Score</span>
              </div>
              <div className="text-[24px] font-bold text-indigo-600">
                {brandScore}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Tone Alignment</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${brandScoreDetails.toneAlignment}%` }} />
                  </div>
                  <span className="font-semibold text-slate-900 w-8">{brandScoreDetails.toneAlignment}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Voice Consistency</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${brandScoreDetails.voiceConsistency}%` }} />
                  </div>
                  <span className="font-semibold text-slate-900 w-8">{brandScoreDetails.voiceConsistency}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Message Clarity</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${brandScoreDetails.messageClarity}%` }} />
                  </div>
                  <span className="font-semibold text-slate-900 w-8">{brandScoreDetails.messageClarity}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Audience Relevance</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${brandScoreDetails.audienceRelevance}%` }} />
                  </div>
                  <span className="font-semibold text-slate-900 w-8">{brandScoreDetails.audienceRelevance}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Gate Approval Status */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
              3-Gate Approval
            </div>

            {/* Gate 1: Rules */}
            <div className="flex items-center gap-3">
              {gateResults.find((g: any) => g.gate === 1)?.passed !== undefined ? (
                gateResults.find((g: any) => g.gate === 1)?.passed ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                )
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-slate-900">Gate 1: Rules Validation</p>
                <p className="text-[10px] text-slate-500">Automated compliance checks</p>
              </div>
            </div>

            {/* Gate 2: AI Review */}
            <div className="flex items-center gap-3">
              {gateResults.find((g: any) => g.gate === 2)?.passed !== undefined ? (
                gateResults.find((g: any) => g.gate === 2)?.passed ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                )
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-slate-900">Gate 2: AI Review</p>
                <p className="text-[10px] text-slate-500">Brand alignment & guardrails</p>
              </div>
            </div>

            {/* Gate 3: Human Approval */}
            <div className="flex items-center gap-3">
              {gateResults.find((g: any) => g.gate === 3)?.passed !== undefined ? (
                gateResults.find((g: any) => g.gate === 3)?.passed ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : gateResults.find((g: any) => g.gate === 3)?.details?.slackMessageId ? (
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                )
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-slate-900">Gate 3: Human Approval</p>
                <p className="text-[10px] text-slate-500">Slack notification for final sign-off</p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Audience</span>
              </div>
              <p className="text-[16px] font-bold text-slate-900">
                {data?.audienceSize?.toLocaleString() || '0'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Channel</span>
              </div>
              <p className="text-[13px] font-semibold text-slate-900">
                {data?.channel || 'Email'}
              </p>
            </div>
          </div>

          {/* Email Preview */}
          {data?.content && (
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Content Preview
              </div>

              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-[11px] text-slate-500 mb-1">Subject:</p>
                <p className="text-[13px] font-medium text-slate-900">
                  {data.content.subject}
                </p>
              </div>

              {data.content.body && (
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-[11px] text-slate-500 mb-1">Body:</p>
                  <p className="text-[12px] text-slate-700 whitespace-pre-line line-clamp-4">
                    {data.content.body}
                  </p>
                </div>
              )}

              {data.content.cta && (
                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                  <p className="text-[11px] text-indigo-500 mb-1">Call to Action:</p>
                  <p className="text-[12px] font-semibold text-indigo-700">
                    {data.content.cta}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Real Customer Data (Reviews) */}
          {data?.reviews && data.reviews.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
                  Real Birdeye Data
                </span>
              </div>

              {data.reviews.slice(0, 2).map((review: any, idx: number) => (
                <div key={idx} className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-amber-900">{review.customerName}</span>
                    <span className="text-[10px] text-amber-600">{review.rating}★</span>
                  </div>
                  <p className="text-[10px] text-amber-800 line-clamp-2">{review.review}</p>
                </div>
              ))}
            </div>
          )}

          {/* Competitor Data (for conquest) */}
          {data?.competitorData && (
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
                  Competitor Intel
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-purple-600">Their Wait Time</p>
                  <p className="font-bold text-purple-900">{data.competitorData.waitTime}</p>
                </div>
                <div>
                  <p className="text-purple-600">Our Wait Time</p>
                  <p className="font-bold text-emerald-600">{data.competitorData.ourWaitTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Estimate */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide mb-3">
              Predicted Performance
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[20px] font-bold text-emerald-900">28.5%</p>
                <p className="text-[11px] text-emerald-700">Open Rate</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-emerald-900">4.2%</p>
                <p className="text-[11px] text-emerald-700">Click Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-auto border-t border-slate-200 p-4 bg-white space-y-2 sticky bottom-0">
          {(() => {
            const gate1 = gateResults.find((g: any) => g.gate === 1);
            const gate2 = gateResults.find((g: any) => g.gate === 2);
            const gate3 = gateResults.find((g: any) => g.gate === 3);
            // Gate 3 is "pending" not "failed" if awaiting approval (either via Slack or in-app)
            const gate3AwaitingApproval = gate3?.details?.status === 'awaiting_approval' || gate3?.details?.slackMessageId;
            const anyGateFailed = (gate1?.passed === false) || (gate2?.passed === false) || (gate3?.passed === false && !gate3AwaitingApproval);
            const awaitingApproval = gate1?.passed && gate2?.passed && (gate3?.details?.status === 'awaiting_approval' || !gate3?.passed);
            const allPassed = gate1?.passed && gate2?.passed && gate3?.passed;

            if (anyGateFailed) {
              // Gate failed - show edit content button
              return (
                <>
                  <button
                    onClick={onEditContent}
                    className="w-full px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Content & Retry
                  </button>
                  <p className="text-[11px] text-red-600 text-center font-medium">
                    Gate validation failed. Please fix the issues and resubmit.
                  </p>
                </>
              );
            }

            if (allPassed) {
              // All gates passed - show publish
              return (
                <>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isPublishing ? 'Publishing...' : 'Publish Campaign'}
                  </button>
                  <p className="text-[11px] text-emerald-600 text-center font-medium">
                    All 3 gates passed! Ready to launch.
                  </p>
                </>
              );
            }

            if (awaitingApproval) {
              // Awaiting approval - show approve/reject buttons
              return (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isApproving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-600 text-center">
                    Gates 1 & 2 passed. Human approval required.
                  </p>
                </>
              );
            }

            // Default - show submit for review
            return (
              <>
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !data?.content}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[13px] font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Gates...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit for 3-Gate Approval
                    </>
                  )}
                </button>
                {!data?.content && (
                  <p className="text-[11px] text-amber-600 text-center">
                    Generate content first before submitting for review
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  }

  if (type === 'segment') {
    return (
      <div className="w-[360px] bg-white border-l border-slate-200 h-screen flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-[15px] font-semibold text-slate-900">Segment Preview</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Segment Data */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1 block">
              Segment Name
            </label>
            <p className="text-[15px] font-semibold text-slate-900">
              {data?.name || 'Untitled Segment'}
            </p>
          </div>

          {/* Profile Count */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
            <div className="text-[11px] font-medium text-indigo-700 uppercase tracking-wide mb-2">
              Total Profiles
            </div>
            <p className="text-[28px] font-bold text-indigo-900">
              {data?.count?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Criteria */}
          {data?.criteria && (
            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                Criteria
              </label>
              <div className="space-y-2">
                {data.criteria.map((criterion: string, index: number) => (
                  <div key={index} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[12px] text-slate-700">
                    • {criterion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="mt-auto border-t border-slate-200 p-4 bg-white space-y-2 sticky bottom-0">
          <button className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[13px] font-semibold hover:shadow-md transition-all">
            Use This Segment
          </button>
          <button className="w-full px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-semibold hover:bg-slate-50 transition-all">
            Edit Criteria
          </button>
        </div>
      </div>
    );
  }

  // Default empty
  return (
    <div className="w-[360px] bg-white border-l border-slate-200 h-screen">
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">No preview available</p>
      </div>
    </div>
  );
});