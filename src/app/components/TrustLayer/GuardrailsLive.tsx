import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertTriangle, Loader2, Shield } from 'lucide-react';

export interface GuardrailCheck {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'checking' | 'passed' | 'warning' | 'failed';
  message?: string;
}

interface GuardrailsLiveProps {
  checks: GuardrailCheck[];
  title?: string;
  showAnimation?: boolean;
  className?: string;
}

export function GuardrailsLive({
  checks,
  title = 'Brand Guardrails',
  showAnimation = true,
  className = ''
}: GuardrailsLiveProps) {
  const passedCount = checks.filter(c => c.status === 'passed').length;
  const totalCount = checks.length;
  const allPassed = passedCount === totalCount;
  const hasFailure = checks.some(c => c.status === 'failed');
  const isProcessing = checks.some(c => c.status === 'checking');

  const getStatusIcon = (status: GuardrailCheck['status']) => {
    switch (status) {
      case 'pending':
        return <Circle className="w-4 h-4 text-slate-300" />;
      case 'checking':
        return <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />;
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusClass = (status: GuardrailCheck['status']) => {
    switch (status) {
      case 'pending':
        return 'text-slate-400';
      case 'checking':
        return 'text-sky-600';
      case 'passed':
        return 'text-emerald-700';
      case 'warning':
        return 'text-amber-700';
      case 'failed':
        return 'text-red-700';
    }
  };

  return (
    <div className={`rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        allPassed ? 'bg-emerald-50 border-b border-emerald-200' :
        hasFailure ? 'bg-red-50 border-b border-red-200' :
        isProcessing ? 'bg-sky-50 border-b border-sky-200' :
        'bg-slate-50 border-b border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${
            allPassed ? 'text-emerald-600' :
            hasFailure ? 'text-red-600' :
            isProcessing ? 'text-sky-600' :
            'text-slate-500'
          }`} />
          <span className="text-[12px] font-bold text-slate-900 uppercase tracking-wide">
            {title}
          </span>
        </div>
        <span className={`text-[11px] font-semibold ${
          allPassed ? 'text-emerald-600' :
          hasFailure ? 'text-red-600' :
          'text-slate-600'
        }`}>
          {passedCount}/{totalCount} passed
        </span>
      </div>

      {/* Checks List */}
      <div className="divide-y divide-slate-100">
        {checks.map((check, index) => (
          <div
            key={check.id}
            className={`px-4 py-3 flex items-start gap-3 transition-all duration-300 ${
              showAnimation && check.status === 'checking' ? 'bg-sky-50' : 'bg-white'
            }`}
            style={showAnimation ? { animationDelay: `${index * 100}ms` } : undefined}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(check.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-medium ${getStatusClass(check.status)}`}>
                {check.name}
              </p>
              {check.description && (
                <p className="text-[10px] text-slate-500 mt-0.5">{check.description}</p>
              )}
              {check.message && check.status !== 'pending' && (
                <p className={`text-[10px] mt-1 ${
                  check.status === 'passed' ? 'text-emerald-600' :
                  check.status === 'warning' ? 'text-amber-600' :
                  check.status === 'failed' ? 'text-red-600' :
                  'text-sky-600'
                }`}>
                  {check.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      {(allPassed || hasFailure) && (
        <div className={`px-4 py-3 ${allPassed ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-[11px] font-semibold ${allPassed ? 'text-emerald-700' : 'text-red-700'}`}>
            {allPassed
              ? 'All guardrails passed - content is brand-safe'
              : 'Some guardrails failed - review required'}
          </p>
        </div>
      )}
    </div>
  );
}

// Demo helper: Simulate guardrail checking animation
export function useGuardrailAnimation(initialChecks: GuardrailCheck[]) {
  const [checks, setChecks] = useState<GuardrailCheck[]>(
    initialChecks.map(c => ({ ...c, status: 'pending' }))
  );
  const [isComplete, setIsComplete] = useState(false);

  const startChecking = () => {
    setIsComplete(false);
    let currentIndex = 0;

    const processNext = () => {
      if (currentIndex >= initialChecks.length) {
        setIsComplete(true);
        return;
      }

      // Set current to checking
      setChecks(prev => prev.map((c, i) =>
        i === currentIndex ? { ...c, status: 'checking' } : c
      ));

      // After delay, set to passed and move to next
      setTimeout(() => {
        setChecks(prev => prev.map((c, i) =>
          i === currentIndex ? { ...initialChecks[i], status: initialChecks[i].status } : c
        ));
        currentIndex++;
        processNext();
      }, 400 + Math.random() * 300);
    };

    processNext();
  };

  const reset = () => {
    setChecks(initialChecks.map(c => ({ ...c, status: 'pending' })));
    setIsComplete(false);
  };

  return { checks, startChecking, reset, isComplete };
}

export default GuardrailsLive;
