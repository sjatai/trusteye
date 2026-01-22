import { useState } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import type { ContentItem, ContentChannel } from '../types/content';
import { CHANNEL_CONFIG } from '../types/content';
import { EmailPreview } from './previews/EmailPreview';
import { SMSPreview } from './previews/SMSPreview';
import { InstagramPreview } from './previews/InstagramPreview';
import { SlackPreview } from './previews/SlackPreview';
import { BannerPreview } from './previews/BannerPreview';
import { PerformanceIndicator } from './PerformanceIndicator';

interface ContentPreviewPanelProps {
  content: ContentItem | null;
  onClose?: () => void;
  onCreateCampaign?: () => void;
}

export function ContentPreviewPanel({ content, onClose, onCreateCampaign }: ContentPreviewPanelProps) {
  const [activeChannel, setActiveChannel] = useState<ContentChannel | null>(null);

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-900 mb-1">Select Content to Preview</h3>
          <p className="text-[12px] text-slate-500">
            Click on any content item to see a channel-specific preview
          </p>
        </div>
      </div>
    );
  }

  // Set default channel if not selected
  const selectedChannel = activeChannel || content.channels[0];

  const renderPreview = () => {
    switch (selectedChannel) {
      case 'email':
        return <EmailPreview content={content.content} brandScore={content.brandScore} />;
      case 'sms':
        return <SMSPreview content={content.content} brandScore={content.brandScore} />;
      case 'instagram':
        return <InstagramPreview content={content.content} brandScore={content.brandScore} />;
      case 'slack':
        return <SlackPreview content={content.content} brandScore={content.brandScore} />;
      case 'web-banner':
        return <BannerPreview content={content.content} brandScore={content.brandScore} />;
      default:
        return <EmailPreview content={content.content} brandScore={content.brandScore} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900">{content.name}</h3>
          <p className="text-[11px] text-slate-500">Preview as it will appear</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Channel Tabs */}
      {content.channels.length > 1 && (
        <div className="px-4 py-2 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
          {content.channels.map(channel => (
            <button
              key={channel}
              onClick={() => setActiveChannel(channel)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                selectedChannel === channel
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{CHANNEL_CONFIG[channel].icon}</span>
              {CHANNEL_CONFIG[channel].label}
            </button>
          ))}
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderPreview()}
      </div>

      {/* Brand Score & Performance */}
      <div className="px-4 py-3 border-t border-slate-200 space-y-3">
        {/* Brand Score */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-600">Brand Alignment</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${content.brandScore}%` }}
              />
            </div>
            <span className="text-[12px] font-bold text-emerald-600">{content.brandScore}%</span>
          </div>
        </div>

        {/* Performance */}
        <PerformanceIndicator performance={content.performance} compact />
      </div>

      {/* Create Campaign Button */}
      {onCreateCampaign && (
        <div className="px-4 py-3 border-t border-slate-200">
          <button
            onClick={onCreateCampaign}
            className="w-full px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
          >
            Create Campaign
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
