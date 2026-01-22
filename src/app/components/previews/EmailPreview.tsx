import { Mail, Star, Archive, Trash2, MoreVertical, Reply, Forward, CheckCircle2 } from 'lucide-react';
import type { ContentBody } from '../../types/content';

interface EmailPreviewProps {
  content: ContentBody;
  brandScore?: number;
  from?: string;
}

export function EmailPreview({ content, brandScore, from = 'Premier Nissan' }: EmailPreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Email Client Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500">
              <Archive className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500">
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500">
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500">
            <Reply className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500">
            <Forward className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Email Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white font-bold">
            PN
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-slate-900">{from}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Just now</span>
                <button className="text-slate-400 hover:text-amber-500">
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[12px] text-slate-500">to me</p>
          </div>
        </div>

        {content.subject && (
          <h2 className="text-[16px] font-semibold text-slate-900 mt-3">{content.subject}</h2>
        )}
      </div>

      {/* Email Body */}
      <div className="px-4 py-4 min-h-[200px]">
        <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
          {content.body}
        </div>

        {content.cta && (
          <div className="mt-4">
            <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-colors">
              {content.cta}
            </button>
          </div>
        )}
      </div>

      {/* Compliance Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>CAN-SPAM compliant</span>
            <span>•</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Unsubscribe link</span>
          </div>
          {brandScore && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700">{brandScore}% brand aligned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
