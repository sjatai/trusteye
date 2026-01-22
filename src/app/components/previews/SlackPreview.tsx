import { Hash, ChevronDown, AtSign, Smile, Paperclip, Send, MoreVertical } from 'lucide-react';
import type { ContentBody } from '../../types/content';

interface SlackPreviewProps {
  content: ContentBody;
  brandScore?: number;
  channel?: string;
  botName?: string;
}

export function SlackPreview({
  content,
  brandScore,
  channel = 'notifications',
  botName = 'TrustEye'
}: SlackPreviewProps) {
  // Parse Slack-style markdown for basic formatting
  const formatSlackText = (text: string) => {
    // Bold: *text*
    let formatted = text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    // Links: <url|text>
    formatted = formatted.replace(/<([^|>]+)\|([^>]+)>/g, '<a href="$1" class="text-sky-600 hover:underline">$2</a>');
    return formatted;
  };

  return (
    <div className="bg-[#1a1d21] rounded-xl overflow-hidden shadow-lg border border-slate-700">
      {/* Slack Header */}
      <div className="bg-[#350d36] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">PN</span>
          </div>
          <span className="text-[13px] font-semibold text-white">Premier Nissan</span>
          <ChevronDown className="w-4 h-4 text-white/60" />
        </div>
      </div>

      {/* Channel Bar */}
      <div className="bg-[#222529] px-4 py-2 border-b border-slate-700/50 flex items-center gap-2">
        <Hash className="w-4 h-4 text-slate-400" />
        <span className="text-[13px] font-medium text-white">{channel}</span>
      </div>

      {/* Messages Area */}
      <div className="bg-[#1a1d21] p-4 min-h-[200px]">
        {/* Bot Message */}
        <div className="flex gap-3">
          {/* Bot Avatar */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
            TE
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-bold text-white">{botName}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-700 text-slate-300">APP</span>
              <span className="text-[11px] text-slate-500">Today at 9:41 AM</span>
            </div>

            {/* Message Content */}
            <div
              className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formatSlackText(content.body) }}
            />

            {/* Action Button (if CTA exists) */}
            {content.cta && (
              <div className="mt-3">
                <button className="px-3 py-1.5 rounded bg-[#007a5a] text-white text-[12px] font-medium hover:bg-[#148567] transition-colors">
                  {content.cta}
                </button>
              </div>
            )}

            {/* Reactions */}
            <div className="flex items-center gap-2 mt-2">
              <button className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <span className="text-[12px]">👍</span>
                <span className="text-[11px] text-slate-300">3</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <span className="text-[12px]">✅</span>
                <span className="text-[11px] text-slate-300">2</span>
              </button>
            </div>
          </div>

          {/* More Actions */}
          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded">
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2 bg-[#222529] rounded-lg px-3 py-2 border border-slate-700">
          <Paperclip className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={`Message #${channel}`}
            className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-500 outline-none"
            disabled
          />
          <AtSign className="w-4 h-4 text-slate-500" />
          <Smile className="w-4 h-4 text-slate-500" />
          <Send className="w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Brand Score Footer */}
      {brandScore && (
        <div className="px-4 py-2 bg-[#222529] border-t border-slate-700/50">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-700/50 w-fit">
            <span className="text-[10px] font-bold text-emerald-400">{brandScore}% brand aligned</span>
          </div>
        </div>
      )}
    </div>
  );
}
