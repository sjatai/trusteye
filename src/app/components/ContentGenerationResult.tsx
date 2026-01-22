import { useState } from 'react';
import { Mail, MessageSquare, Instagram, Check, Copy, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import type { GeneratedContent } from '../lib/api';

interface ContentGenerationResultProps {
  content: GeneratedContent;
  campaignType: string;
  audience: string;
  onSave?: () => void;
  onCreateCampaign?: () => void;
  onRegenerate?: (channel: string) => void;
}

const CHANNEL_CONFIG = {
  email: { icon: Mail, label: 'Email', color: 'purple' },
  sms: { icon: MessageSquare, label: 'SMS', color: 'sky' },
  social: { icon: Instagram, label: 'Social', color: 'pink' },
};

export function ContentGenerationResult({
  content,
  campaignType,
  audience,
  onSave,
  onCreateCampaign,
  onRegenerate,
}: ContentGenerationResultProps) {
  const [activeChannel, setActiveChannel] = useState<'email' | 'sms' | 'social'>(
    content.email ? 'email' : content.sms ? 'sms' : 'social'
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get available channels
  const availableChannels = (['email', 'sms', 'social'] as const).filter(
    (ch) => content[ch]
  );

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderBrandScore = () => {
    const score = content.brandScore || 0;
    const getScoreColor = (s: number) => {
      if (s >= 90) return 'text-emerald-600 bg-emerald-50';
      if (s >= 75) return 'text-amber-600 bg-amber-50';
      return 'text-red-600 bg-red-50';
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">Brand Score</span>
        <div className={`px-2 py-0.5 rounded-full ${getScoreColor(score)}`}>
          <span className="text-[12px] font-bold">{score}%</span>
        </div>
      </div>
    );
  };

  const renderEmailContent = () => {
    if (!content.email) return null;
    const { subject, previewText, body, cta } = content.email;

    return (
      <div className="space-y-3">
        {/* Subject */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Subject Line</span>
            <button
              onClick={() => handleCopy(subject, 'email-subject')}
              className="text-slate-400 hover:text-slate-600"
            >
              {copiedField === 'email-subject' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[13px] font-medium text-slate-900 bg-slate-50 rounded-lg px-3 py-2">
            {subject}
          </p>
        </div>

        {/* Preview Text */}
        {previewText && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Preview Text</span>
            <p className="text-[12px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              {previewText}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Email Body</span>
            <button
              onClick={() => handleCopy(body, 'email-body')}
              className="text-slate-400 hover:text-slate-600"
            >
              {copiedField === 'email-body' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="text-[13px] text-slate-700 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
            {body}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Call to Action</span>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-sky-500 text-white text-[13px] font-semibold rounded-lg">
              {cta}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSmsContent = () => {
    if (!content.sms) return null;
    const { message } = content.sms;
    const charCount = message.length;
    const isOverLimit = charCount > 160;

    return (
      <div className="space-y-3">
        {/* Phone Mockup */}
        <div className="bg-slate-900 rounded-[24px] p-3 max-w-[280px] mx-auto">
          <div className="bg-white rounded-[16px] p-3">
            {/* Sender */}
            <div className="text-center mb-2">
              <span className="text-[10px] text-slate-500">Premier Nissan</span>
            </div>

            {/* Message Bubble */}
            <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2">
              <p className="text-[13px] text-slate-900">{message}</p>
            </div>

            {/* Character Count */}
            <div className="mt-2 text-right">
              <span className={`text-[10px] ${isOverLimit ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {charCount}/160
                {isOverLimit && ' - Over limit!'}
              </span>
            </div>
          </div>
        </div>

        {/* Copy Button */}
        <div className="flex justify-center">
          <button
            onClick={() => handleCopy(message, 'sms-message')}
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {copiedField === 'sms-message' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Message
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSocialContent = () => {
    if (!content.social) return null;
    const { post, hashtags } = content.social;

    return (
      <div className="space-y-3">
        {/* Instagram-style Post */}
        <div className="border border-slate-200 rounded-xl overflow-hidden max-w-[320px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-700">PN</span>
              </div>
            </div>
            <span className="text-[12px] font-semibold text-slate-900">premier_nissan</span>
          </div>

          {/* Image Placeholder */}
          <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-[14px] text-slate-400">Image Here</span>
          </div>

          {/* Caption */}
          <div className="p-3">
            <p className="text-[13px] text-slate-900">{post}</p>
            {hashtags && hashtags.length > 0 && (
              <p className="text-[13px] text-sky-500 mt-1">
                {hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
              </p>
            )}
          </div>
        </div>

        {/* Copy Button */}
        <div className="flex justify-center">
          <button
            onClick={() => handleCopy(`${post}\n\n${hashtags?.map(h => h.startsWith('#') ? h : `#${h}`).join(' ') || ''}`, 'social-post')}
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {copiedField === 'social-post' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Caption
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderActiveChannel = () => {
    switch (activeChannel) {
      case 'email':
        return renderEmailContent();
      case 'sms':
        return renderSmsContent();
      case 'social':
        return renderSocialContent();
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-slate-900">AI-Generated Content</h3>
              <p className="text-[11px] text-slate-500">
                {campaignType} campaign • {audience}
              </p>
            </div>
          </div>
          {renderBrandScore()}
        </div>
      </div>

      {/* Channel Tabs */}
      {availableChannels.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50">
          {availableChannels.map((channel) => {
            const config = CHANNEL_CONFIG[channel];
            const Icon = config.icon;
            const isActive = activeChannel === channel;

            return (
              <button
                key={channel}
                onClick={() => setActiveChannel(channel)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  isActive
                    ? `bg-${config.color}-100 text-${config.color}-700 border border-${config.color}-200`
                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}

          {/* Regenerate Button */}
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(activeChannel)}
              className="ml-auto flex items-center gap-1 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="p-4">{renderActiveChannel()}</div>

      {/* Suggestions */}
      {content.suggestions && content.suggestions.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-amber-50">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-2">
            AI Suggestions
          </p>
          <ul className="space-y-1">
            {content.suggestions.map((suggestion, i) => (
              <li key={i} className="text-[12px] text-amber-800 flex items-start gap-2">
                <span className="text-amber-500">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Brand Score Details */}
      {content.brandScoreDetails && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Brand Score Breakdown
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(content.brandScoreDetails).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-[11px] font-semibold text-slate-900">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        {onSave && (
          <button
            onClick={onSave}
            className="px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Save to Library
          </button>
        )}
        {onCreateCampaign && (
          <button
            onClick={onCreateCampaign}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-[13px] font-semibold rounded-lg hover:bg-sky-600 transition-colors"
          >
            Create Campaign
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
