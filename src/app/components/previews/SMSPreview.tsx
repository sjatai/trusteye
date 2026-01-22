import { Wifi, Battery, Signal, AlertCircle } from 'lucide-react';
import type { ContentBody } from '../../types/content';

interface SMSPreviewProps {
  content: ContentBody;
  brandScore?: number;
  from?: string;
}

export function SMSPreview({ content, brandScore, from = 'Premier Nissan' }: SMSPreviewProps) {
  const charCount = content.body.length;
  const maxChars = 160;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="bg-slate-900 rounded-[32px] p-2 w-full max-w-[280px] mx-auto shadow-xl">
      {/* Phone Status Bar */}
      <div className="px-6 pt-2 pb-1 flex items-center justify-between text-white text-[10px]">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {/* Notch */}
      <div className="w-24 h-6 bg-black rounded-full mx-auto mb-2" />

      {/* Message Screen */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
              PN
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-900">{from}</p>
              <p className="text-[10px] text-slate-500">Business</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-3 min-h-[240px] bg-[#e5ddd5]">
          {/* Message Bubble */}
          <div className="flex justify-start mb-2">
            <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
              <p className="text-[13px] text-slate-900 leading-relaxed whitespace-pre-wrap">
                {content.body}
              </p>
              <p className="text-[9px] text-slate-400 text-right mt-1">Now</p>
            </div>
          </div>
        </div>

        {/* Character Count & Warning */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 text-[11px] ${isOverLimit ? 'text-red-600' : 'text-slate-500'}`}>
              {isOverLimit && <AlertCircle className="w-3.5 h-3.5" />}
              <span>{charCount}/{maxChars} characters</span>
              {isOverLimit && <span className="font-medium">(over limit!)</span>}
            </div>
            {brandScore && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700">{brandScore}%</span>
              </div>
            )}
          </div>
          {isOverLimit && (
            <p className="text-[10px] text-red-600 mt-1">
              SMS over 160 characters may be split into multiple messages
            </p>
          )}
        </div>

        {/* Input Area */}
        <div className="p-2 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full px-4 py-2">
              <p className="text-[11px] text-slate-400">iMessage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="mt-2 mb-1">
        <div className="w-32 h-1 bg-white/30 rounded-full mx-auto" />
      </div>
    </div>
  );
}
