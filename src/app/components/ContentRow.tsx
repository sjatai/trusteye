import { FileText, Mail, Smartphone, Eye, Edit, ArrowRight, Sparkles } from 'lucide-react';
import type { ContentItem, CampaignType } from '../types/content';
import { CAMPAIGN_TYPE_CONFIG, CHANNEL_CONFIG } from '../types/content';

interface ContentRowProps {
  content: ContentItem;
  isSelected?: boolean;
  onClick?: () => void;
  onPreview?: () => void;
  onEdit?: () => void;
  onCreateCampaign?: () => void;
}

export function ContentRow({
  content,
  isSelected,
  onClick,
  onPreview,
  onEdit,
  onCreateCampaign,
}: ContentRowProps) {
  // Determine channel icon (prioritize email, then sms)
  const primaryChannel = content.channels.includes('email') ? 'email' :
                         content.channels.includes('sms') ? 'sms' : content.channels[0];
  const ChannelIcon = primaryChannel === 'email' ? Mail : Smartphone;

  // Get primary campaign type
  const primaryType = content.campaignTypes[0];
  const typeConfig = primaryType ? CAMPAIGN_TYPE_CONFIG[primaryType] : null;

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-4 p-3 rounded-xl bg-white border transition-all cursor-pointer ${
        isSelected
          ? 'border-sky-400 ring-2 ring-sky-100 shadow-md'
          : 'border-slate-200 hover:border-sky-300 hover:shadow-sm'
      }`}
    >
      {/* Text Icon */}
      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-slate-600" />
      </div>

      {/* Name/Heading */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-semibold text-slate-900 truncate">{content.name}</h3>
        {content.content.subject && (
          <p className="text-[11px] text-slate-500 truncate">{content.content.subject}</p>
        )}
      </div>

      {/* Channel Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        primaryChannel === 'email'
          ? 'bg-purple-50 border border-purple-200'
          : 'bg-teal-50 border border-teal-200'
      }`}>
        <ChannelIcon className={`w-4 h-4 ${
          primaryChannel === 'email' ? 'text-purple-600' : 'text-teal-600'
        }`} />
      </div>

      {/* Brand Score (% Match) */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 flex-shrink-0">
        <Sparkles className="w-3 h-3 text-emerald-600" />
        <span className="text-[10px] font-bold text-emerald-700">{content.brandScore}%</span>
      </div>

      {/* Campaign Type */}
      {typeConfig && (
        <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-600 flex-shrink-0">
          {typeConfig.label}
        </span>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onPreview?.(); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          title="Preview"
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          title="Edit"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCreateCampaign?.(); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 transition-colors"
          title="Create Campaign"
        >
          Campaign
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile: Always visible action button */}
      <button
        onClick={(e) => { e.stopPropagation(); onCreateCampaign?.(); }}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors flex-shrink-0"
        title="Create Campaign"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
