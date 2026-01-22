import { BarChart3, Info } from 'lucide-react';
import type { ContentPerformance } from '../types/content';

interface PerformanceIndicatorProps {
  performance: ContentPerformance;
  compact?: boolean;
}

export function PerformanceIndicator({ performance, compact = false }: PerformanceIndicatorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          {performance.timesUsed}x
        </span>
        <span>{performance.avgOpenRate}% open</span>
        <span
          className="text-slate-400 cursor-help"
          title="Performance data is simulated for demonstration"
        >
          (mock)
        </span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          Performance History
        </span>
        <span
          className="text-[9px] text-slate-400 flex items-center gap-1 cursor-help"
          title="Performance data is simulated for demonstration purposes"
        >
          <Info className="w-3 h-3" />
          mock data
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Used</p>
          <p className="text-[15px] font-bold text-slate-900">{performance.timesUsed}x</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Open Rate</p>
          <p className="text-[15px] font-bold text-emerald-600">{performance.avgOpenRate}%</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Click Rate</p>
          <p className="text-[15px] font-bold text-sky-600">{performance.avgClickRate}%</p>
        </div>
      </div>

      {performance.bestPerformingIn && (
        <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
          Best in: <span className="font-medium capitalize">{performance.bestPerformingIn}</span> campaigns
        </p>
      )}
    </div>
  );
}
