import { Shield, Brain, User, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';

export interface GateStatus {
  gate: 1 | 2 | 3;
  status: 'pending' | 'processing' | 'passed' | 'failed';
  details?: {
    checks?: string[];
    brandScore?: number;
    approver?: string;
    approvedAt?: string;
    error?: string;
  };
}

interface GateVisualizationProps {
  gates: GateStatus[];
  className?: string;
  compact?: boolean;
}

export function GateVisualization({ gates, className = '', compact = false }: GateVisualizationProps) {
  const getGateInfo = (gateNumber: 1 | 2 | 3) => {
    switch (gateNumber) {
      case 1:
        return {
          icon: Shield,
          title: 'Rules Validation',
          description: 'Automated compliance checks',
          color: 'indigo',
        };
      case 2:
        return {
          icon: Brain,
          title: 'AI Review',
          description: 'Brand alignment & guardrails',
          color: 'purple',
        };
      case 3:
        return {
          icon: User,
          title: 'Human Approval',
          description: 'Final sign-off via Slack',
          color: 'sky',
        };
    }
  };

  const getStatusDisplay = (status: GateStatus['status']) => {
    switch (status) {
      case 'pending':
        return {
          bgColor: 'bg-slate-100',
          iconColor: 'text-slate-400',
          borderColor: 'border-slate-200',
          StatusIcon: Clock,
        };
      case 'processing':
        return {
          bgColor: 'bg-amber-100',
          iconColor: 'text-amber-600',
          borderColor: 'border-amber-300',
          StatusIcon: Clock,
          animate: true,
        };
      case 'passed':
        return {
          bgColor: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          borderColor: 'border-emerald-300',
          StatusIcon: CheckCircle2,
        };
      case 'failed':
        return {
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-300',
          StatusIcon: XCircle,
        };
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {[1, 2, 3].map((gateNum) => {
          const gate = gates.find(g => g.gate === gateNum) || { gate: gateNum as 1 | 2 | 3, status: 'pending' as const };
          const statusDisplay = getStatusDisplay(gate.status);
          const gateInfo = getGateInfo(gateNum as 1 | 2 | 3);
          const Icon = gateInfo.icon;

          return (
            <div key={gateNum} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${statusDisplay.bgColor} ${statusDisplay.borderColor} ${statusDisplay.animate ? 'animate-pulse' : ''}`}
              >
                {gate.status === 'passed' || gate.status === 'failed' ? (
                  <statusDisplay.StatusIcon className={`w-4 h-4 ${statusDisplay.iconColor}`} />
                ) : (
                  <Icon className={`w-4 h-4 ${statusDisplay.iconColor}`} />
                )}
              </div>
              {gateNum < 3 && (
                <ArrowRight className={`w-3 h-3 ${gate.status === 'passed' ? 'text-emerald-500' : 'text-slate-300'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
        <Shield className="w-4 h-4 text-indigo-600" />
        3-Gate Approval System
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((gateNum) => {
          const gate = gates.find(g => g.gate === gateNum) || { gate: gateNum as 1 | 2 | 3, status: 'pending' as const };
          const gateInfo = getGateInfo(gateNum as 1 | 2 | 3);
          const statusDisplay = getStatusDisplay(gate.status);
          const Icon = gateInfo.icon;

          return (
            <div
              key={gateNum}
              className={`p-4 rounded-xl border-2 transition-all duration-500 ${statusDisplay.borderColor} ${
                gate.status === 'processing' ? 'ring-2 ring-amber-200 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${statusDisplay.bgColor} ${statusDisplay.animate ? 'animate-pulse' : ''}`}
                >
                  {gate.status === 'passed' || gate.status === 'failed' ? (
                    <statusDisplay.StatusIcon className={`w-5 h-5 ${statusDisplay.iconColor}`} />
                  ) : (
                    <Icon className={`w-5 h-5 ${statusDisplay.iconColor}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-slate-900">
                      Gate {gateNum}: {gateInfo.title}
                    </span>
                    {gate.status === 'passed' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        PASSED
                      </span>
                    )}
                    {gate.status === 'failed' && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
                        FAILED
                      </span>
                    )}
                    {gate.status === 'processing' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold animate-pulse">
                        PROCESSING
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{gateInfo.description}</p>

                  {/* Gate-specific details */}
                  {gate.details && (
                    <div className="mt-2">
                      {/* Gate 1: Checks */}
                      {gateNum === 1 && gate.details.checks && (
                        <div className="space-y-1">
                          {gate.details.checks.map((check, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span className="text-slate-600">{check}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Gate 2: Brand Score */}
                      {gateNum === 2 && gate.details.brandScore !== undefined && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">Brand Score:</span>
                          <span className={`text-[12px] font-bold ${
                            gate.details.brandScore >= 80 ? 'text-emerald-600' :
                            gate.details.brandScore >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {gate.details.brandScore}%
                          </span>
                        </div>
                      )}

                      {/* Gate 3: Approver */}
                      {gateNum === 3 && gate.details.approver && (
                        <div className="mt-1 text-[10px] text-slate-600">
                          Approved by <span className="font-semibold">{gate.details.approver}</span>
                          {gate.details.approvedAt && (
                            <span> at {new Date(gate.details.approvedAt).toLocaleString()}</span>
                          )}
                        </div>
                      )}

                      {/* Error */}
                      {gate.details.error && (
                        <div className="mt-1 text-[10px] text-red-600">{gate.details.error}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GateVisualization;
