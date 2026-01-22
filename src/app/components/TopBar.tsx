import { useState } from 'react';
import { Pencil, Search } from 'lucide-react';
import { Button } from './ui/button';

type CampaignStatus = 'draft' | 'approval-required' | 'ready' | 'running';

interface TopBarProps {
  onReviewLaunch: () => void;
}

export function TopBar({ onReviewLaunch }: TopBarProps) {
  const [campaignName, setCampaignName] = useState('Spring Campaign 2026');
  const [isEditing, setIsEditing] = useState(false);
  const [status] = useState<CampaignStatus>('approval-required');

  const statusConfig = {
    'draft': { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
    'approval-required': { label: 'Approval required', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    'ready': { label: 'Ready', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'running': { label: 'Running', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="border-b bg-white px-8 py-4 sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-slate-500 uppercase tracking-wide font-medium">Create Campaign</span>
          <div className="w-px h-4 bg-slate-300" />
          {isEditing ? (
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="px-2 py-1 border border-slate-300 rounded-lg outline-none focus:border-slate-400 text-[18px] font-semibold"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <span className="text-[18px] font-semibold text-slate-900">{campaignName}</span>
              <Pencil className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${currentStatus.className}`}>
            {currentStatus.label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              className="pl-9 pr-4 py-2 w-[280px] bg-slate-50 border border-slate-200 rounded-lg text-[13px] placeholder:text-slate-500 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            />
          </div>

          <Button
            onClick={onReviewLaunch}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-[13px] font-semibold transition-colors"
          >
            Review & Launch
          </Button>
        </div>
      </div>
    </div>
  );
}