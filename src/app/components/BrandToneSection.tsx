import { useState } from 'react';
import { Palette, ChevronDown, ChevronUp, Edit, Check, X, MessageSquare } from 'lucide-react';
import type { BrandTone, ContentChannel } from '../types/content';
import { CHANNEL_CONFIG } from '../types/content';
import { EMOJI_USAGE_LABELS } from '../data/brandTone';

interface BrandToneSectionProps {
  brandTone: BrandTone;
  onUpdate?: (updates: Partial<BrandTone>) => void;
  collapsible?: boolean;
}

export function BrandToneSection({ brandTone, onUpdate, collapsible = true }: BrandToneSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'default' | ContentChannel>('default');
  const [editedTone, setEditedTone] = useState(brandTone);

  const handleSave = () => {
    onUpdate?.(editedTone);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTone(brandTone);
    setIsEditing(false);
  };

  const channels: ContentChannel[] = ['email', 'sms', 'instagram', 'slack', 'web-banner'];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between p-4 ${collapsible ? 'cursor-pointer hover:bg-slate-50' : ''} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">Brand Tone</h3>
            <p className="text-[11px] text-slate-500">{brandTone.voice}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(true); }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          )}
          {collapsible && (
            isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4">
          {/* Channel Tabs */}
          <div className="flex items-center gap-1 mb-4 pb-3 border-b border-slate-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('default')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                activeTab === 'default'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Default
            </button>
            {channels.map(channel => (
              <button
                key={channel}
                onClick={() => setActiveTab(channel)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeTab === channel
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{CHANNEL_CONFIG[channel].icon}</span>
                {CHANNEL_CONFIG[channel].label}
              </button>
            ))}
          </div>

          {activeTab === 'default' ? (
            <DefaultToneContent
              brandTone={isEditing ? editedTone : brandTone}
              isEditing={isEditing}
              onUpdate={setEditedTone}
            />
          ) : (
            <ChannelOverrideContent
              channel={activeTab}
              brandTone={isEditing ? editedTone : brandTone}
              isEditing={isEditing}
              onUpdate={setEditedTone}
            />
          )}

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DefaultToneContent({
  brandTone,
  isEditing,
  onUpdate,
}: {
  brandTone: BrandTone;
  isEditing: boolean;
  onUpdate: (tone: BrandTone) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Voice */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Voice</label>
        {isEditing ? (
          <input
            type="text"
            value={brandTone.voice}
            onChange={(e) => onUpdate({ ...brandTone, voice: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        ) : (
          <p className="mt-1 text-[13px] text-slate-900 font-medium">{brandTone.voice}</p>
        )}
      </div>

      {/* Attributes */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Attributes</label>
        <div className="mt-1 flex flex-wrap gap-1">
          {brandTone.attributes.map((attr, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-medium text-purple-700"
            >
              {attr}
            </span>
          ))}
        </div>
      </div>

      {/* Words to Use */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Words to Use</label>
        <div className="mt-1 flex flex-wrap gap-1">
          {brandTone.wordsToUse.slice(0, 8).map((word, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-700"
            >
              {word}
            </span>
          ))}
          {brandTone.wordsToUse.length > 8 && (
            <span className="px-2 py-1 text-[10px] text-slate-500">+{brandTone.wordsToUse.length - 8} more</span>
          )}
        </div>
      </div>

      {/* Words to Avoid */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Words to Avoid</label>
        <div className="mt-1 flex flex-wrap gap-1">
          {brandTone.wordsToAvoid.slice(0, 6).map((word, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded-full bg-red-50 border border-red-200 text-[10px] font-medium text-red-700"
            >
              {word}
            </span>
          ))}
          {brandTone.wordsToAvoid.length > 6 && (
            <span className="px-2 py-1 text-[10px] text-slate-500">+{brandTone.wordsToAvoid.length - 6} more</span>
          )}
        </div>
      </div>

      {/* Emoji & Exclamation Policy */}
      <div className="flex gap-4">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Emoji Policy</label>
          <p className="mt-1 text-[12px] text-slate-700">{EMOJI_USAGE_LABELS[brandTone.emojiUsage]}</p>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Exclamation Marks</label>
          <p className="mt-1 text-[12px] text-slate-700 capitalize">{brandTone.exclamationPolicy}</p>
        </div>
      </div>
    </div>
  );
}

function ChannelOverrideContent({
  channel,
  brandTone,
  isEditing,
  onUpdate,
}: {
  channel: ContentChannel;
  brandTone: BrandTone;
  isEditing: boolean;
  onUpdate: (tone: BrandTone) => void;
}) {
  const override = brandTone.channelOverrides[channel];
  const config = CHANNEL_CONFIG[channel];

  if (!override) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-[12px] text-slate-500">No overrides for {config.label}</p>
        <p className="text-[11px] text-slate-400">Using default brand tone</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
        <p className="text-[11px] text-purple-700">
          <strong>{config.icon} {config.label}</strong> uses these overrides instead of the default tone
        </p>
      </div>

      {override.voice && (
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Voice Override</label>
          <p className="mt-1 text-[13px] text-slate-900 font-medium">{override.voice}</p>
        </div>
      )}

      {override.attributes && (
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Attributes</label>
          <div className="mt-1 flex flex-wrap gap-1">
            {override.attributes.map((attr, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-medium text-purple-700"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      )}

      {override.emojiUsage && (
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Emoji Policy</label>
          <p className="mt-1 text-[12px] text-slate-700">{EMOJI_USAGE_LABELS[override.emojiUsage]}</p>
        </div>
      )}

      {override.maxLength && (
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Max Length</label>
          <p className="mt-1 text-[12px] text-slate-700">{override.maxLength} characters</p>
        </div>
      )}
    </div>
  );
}
