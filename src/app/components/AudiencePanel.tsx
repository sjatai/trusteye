import { Users, ChevronDown } from 'lucide-react';

export function AudiencePanel() {
  const audienceSize = 184649;
  const signals = [
    { label: 'VIPs', count: 102945 },
    { label: 'Churn risk', count: 81704 },
  ];

  return (
    <div className="w-[280px] bg-white p-6 h-[calc(100vh-73px)] overflow-y-auto sticky top-[73px]">
      <div className="space-y-6">
        {/* Audience Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-[16px] font-semibold text-slate-900">Audience</h2>
        </div>

        {/* Audience Size */}
        <div>
          <div className="text-[13px] text-slate-500 uppercase tracking-wide mb-2">Total Recipients</div>
          <div className="text-[24px] font-semibold text-slate-900">{audienceSize.toLocaleString()}</div>
        </div>

        {/* Segment Selector */}
        <div>
          <label className="text-[13px] text-slate-500 uppercase tracking-wide mb-2 block">Segment</label>
          <button className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group">
            <span className="text-[14px] text-slate-900 font-medium">VIP Spring Prospects</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        {/* Signal Chips */}
        <div>
          <div className="text-[13px] text-slate-500 uppercase tracking-wide mb-3">Signals</div>
          <div className="space-y-2">
            {signals.map((signal, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <span className="text-[14px] text-slate-700 font-medium">{signal.label}</span>
                <span className="text-[14px] text-slate-500 font-mono">{signal.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[12px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Estimated reach</span>
              <span className="font-medium text-slate-700">~95%</span>
            </div>
            <div className="flex justify-between">
              <span>Last updated</span>
              <span className="font-medium text-slate-700">2 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}