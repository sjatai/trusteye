import { FileText, Image as ImageIcon, Layout, Eye, Edit, ArrowRight, Sparkles, Instagram, Linkedin, Twitter } from 'lucide-react';
import type { ContentItem, CampaignType, ContentChannel } from '../types/content';
import { CAMPAIGN_TYPE_CONFIG } from '../types/content';
import { ChannelBadgeGroup } from './ChannelBadge';
import { PerformanceIndicator } from './PerformanceIndicator';

interface ContentCardProps {
  content: ContentItem;
  isSelected?: boolean;
  onClick?: () => void;
  onPreview?: () => void;
  onEdit?: () => void;
  onCreateCampaign?: () => void;
}

// Check if content is a social template
const isSocialTemplate = (channels: ContentChannel[]) =>
  channels.some(c => ['instagram', 'linkedin', 'twitter'].includes(c));

// Get social platform icon
const getSocialIcon = (channels: ContentChannel[]) => {
  if (channels.includes('instagram')) return Instagram;
  if (channels.includes('linkedin')) return Linkedin;
  if (channels.includes('twitter')) return Twitter;
  return null;
};

export function ContentCard({
  content,
  isSelected,
  onClick,
  onPreview,
  onEdit,
  onCreateCampaign,
}: ContentCardProps) {
  const typeIcons = {
    template: FileText,
    image: ImageIcon,
    banner: Layout,
  };

  const Icon = typeIcons[content.type];
  const hasImage = content.content.imageUrl;
  const isSocial = isSocialTemplate(content.channels);
  const SocialIcon = getSocialIcon(content.channels);

  const handleCreateCampaign = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateCampaign?.();
  };

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl bg-white border transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? 'border-sky-400 ring-2 ring-sky-100 shadow-md'
          : 'border-slate-200 hover:border-sky-300 hover:shadow-sm'
      }`}
    >
      {/* Image Thumbnail for social/banner templates */}
      {hasImage && (isSocial || content.type === 'banner') && (
        <div className="relative h-32 bg-slate-100 overflow-hidden">
          <img
            src={content.content.imageUrl}
            alt={content.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide image on error
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Social platform badge overlay */}
          {SocialIcon && (
            <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <SocialIcon className={`w-4 h-4 ${
                content.channels.includes('instagram') ? 'text-pink-500' :
                content.channels.includes('linkedin') ? 'text-sky-600' :
                'text-slate-700'
              }`} />
            </div>
          )}
          {/* Brand Score overlay */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700">{content.brandScore}%</span>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Only show icon box if no image */}
            {(!hasImage || (!isSocial && content.type !== 'banner')) && (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 flex items-center justify-center">
                <Icon className="w-5 h-5 text-sky-600" />
              </div>
            )}
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 line-clamp-1">{content.name}</h3>
              <ChannelBadgeGroup channels={content.channels} />
            </div>
          </div>

          {/* Brand Score - only show if no image header */}
          {(!hasImage || (!isSocial && content.type !== 'banner')) && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700">{content.brandScore}%</span>
            </div>
          )}
        </div>

      {/* Campaign Type Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {content.campaignTypes.slice(0, 3).map(type => {
          const config = CAMPAIGN_TYPE_CONFIG[type];
          return (
            <span
              key={type}
              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600"
            >
              {config.label}
            </span>
          );
        })}
        {content.campaignTypes.length > 3 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500">
            +{content.campaignTypes.length - 3}
          </span>
        )}
      </div>

      {/* Content Preview */}
      <p className="text-[11px] text-slate-600 line-clamp-2 mb-3">
        {content.content.subject || content.content.body.substring(0, 120)}...
      </p>

      {/* Performance */}
      <PerformanceIndicator performance={content.performance} compact />

      {/* Hover Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onPreview?.(); }}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Edit className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={handleCreateCampaign}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-sky-600 hover:bg-sky-50 transition-colors ml-auto"
        >
          Create Campaign
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      </div>
    </div>
  );
}

// Compact version for lists
export function ContentCardCompact({
  content,
  isSelected,
  onClick,
}: {
  content: ContentItem;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const typeIcons = {
    template: FileText,
    image: ImageIcon,
    banner: Layout,
  };

  const Icon = typeIcons[content.type];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-sky-400 bg-sky-50'
          : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-sky-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[12px] font-semibold text-slate-900 truncate">{content.name}</h4>
        <div className="flex items-center gap-2">
          <ChannelBadgeGroup channels={content.channels} size="sm" maxVisible={2} />
          <span className="text-[10px] text-slate-500">{content.brandScore}% score</span>
        </div>
      </div>
    </div>
  );
}
