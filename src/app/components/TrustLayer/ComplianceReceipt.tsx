import { Download, Shield, CheckCircle2, Clock, User, FileText, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export interface ComplianceReceiptData {
  receiptId: string;
  campaignId: string;
  campaignName: string;
  timestamp: string;
  gates: {
    gate: 1 | 2 | 3;
    passed: boolean;
    timestamp: string;
    details: Record<string, any>;
  }[];
  brandScore: number;
  approver?: {
    name: string;
    email?: string;
    approvedAt: string;
  };
  contentHash?: string;
  audienceSize: number;
  channels: string[];
}

interface ComplianceReceiptProps {
  data: ComplianceReceiptData;
  onDownload?: () => void;
  className?: string;
}

export function ComplianceReceipt({ data, onDownload, className = '' }: ComplianceReceiptProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyReceiptId = async () => {
    await navigator.clipboard.writeText(data.receiptId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Generate receipt content
    const receiptContent = {
      ...data,
      generatedAt: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(receiptContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-receipt-${data.receiptId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onDownload?.();
  };

  const allGatesPassed = data.gates.every(g => g.passed);

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${
      allGatesPassed ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50' : 'border-amber-300 bg-amber-50'
    } ${className}`}>
      {/* Header */}
      <div className={`px-5 py-4 ${allGatesPassed ? 'bg-emerald-100/50' : 'bg-amber-100/50'} border-b ${allGatesPassed ? 'border-emerald-200' : 'border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allGatesPassed ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-[14px] font-bold ${allGatesPassed ? 'text-emerald-900' : 'text-amber-900'}`}>
                Compliance Receipt
              </h3>
              <p className={`text-[11px] ${allGatesPassed ? 'text-emerald-700' : 'text-amber-700'}`}>
                {allGatesPassed ? 'All gates passed - Campaign approved' : 'Review required - Some gates pending'}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            allGatesPassed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            {allGatesPassed ? 'Verified' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="p-5 space-y-4">
        {/* Receipt ID */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Receipt ID</p>
            <p className="text-[12px] font-mono text-slate-900">{data.receiptId}</p>
          </div>
          <button
            onClick={handleCopyReceiptId}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Campaign Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Campaign</p>
            <p className="text-[12px] font-semibold text-slate-900 truncate">{data.campaignName}</p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Audience</p>
            <p className="text-[12px] font-semibold text-slate-900">{data.audienceSize.toLocaleString()}</p>
          </div>
        </div>

        {/* Brand Score */}
        <div className="p-3 rounded-lg bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Brand Alignment Score</p>
            <p className={`text-[16px] font-bold ${
              data.brandScore >= 80 ? 'text-emerald-600' :
              data.brandScore >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {data.brandScore}%
            </p>
          </div>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.brandScore >= 80 ? 'bg-emerald-500' :
                data.brandScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${data.brandScore}%` }}
            />
          </div>
        </div>

        {/* 3-Gate Summary */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Gate Verification</p>
          {data.gates.map(gate => (
            <div
              key={gate.gate}
              className={`p-3 rounded-lg flex items-center justify-between ${
                gate.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {gate.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
                <span className={`text-[11px] font-semibold ${gate.passed ? 'text-emerald-900' : 'text-slate-600'}`}>
                  Gate {gate.gate}:
                  {gate.gate === 1 && ' Rules Validation'}
                  {gate.gate === 2 && ' AI Review'}
                  {gate.gate === 3 && ' Human Approval'}
                </span>
              </div>
              <span className={`text-[10px] ${gate.passed ? 'text-emerald-600' : 'text-slate-500'}`}>
                {gate.passed ? new Date(gate.timestamp).toLocaleTimeString() : 'Pending'}
              </span>
            </div>
          ))}
        </div>

        {/* Approver Info */}
        {data.approver && (
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                <User className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Approved By</p>
                <p className="text-[12px] font-semibold text-slate-900">{data.approver.name}</p>
                <p className="text-[10px] text-slate-500">
                  {new Date(data.approver.approvedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Hash */}
        {data.contentHash && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Content Hash</p>
            <p className="text-[10px] font-mono text-slate-600 break-all">{data.contentHash}</p>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200">
          <span>Generated: {new Date(data.timestamp).toLocaleString()}</span>
          <span>Channels: {data.channels.join(', ')}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 bg-white border-t border-slate-200 flex gap-3">
        <button
          onClick={handleDownload}
          className={`flex-1 px-4 py-2.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-2 transition-all ${
            allGatesPassed
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          Download Receipt
        </button>
        <button className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition-all flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          View Details
        </button>
      </div>
    </div>
  );
}

// Generate a unique receipt ID
export function generateReceiptId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TR-${timestamp}-${random}`.toUpperCase();
}

// Generate a content hash (simplified)
export function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export default ComplianceReceipt;
