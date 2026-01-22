import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Wifi, Battery, Signal } from 'lucide-react';
import type { ContentBody } from '../../types/content';

interface InstagramPreviewProps {
  content: ContentBody;
  brandScore?: number;
  username?: string;
}

export function InstagramPreview({ content, brandScore, username = 'premier_nissan' }: InstagramPreviewProps) {
  return (
    <div className="bg-slate-900 rounded-[32px] p-2 w-full max-w-[320px] mx-auto shadow-xl">
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

      {/* Instagram App */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Post Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white text-[8px] font-bold">
                  PN
                </div>
              </div>
            </div>
            <span className="text-[12px] font-semibold text-slate-900">{username}</span>
          </div>
          <button className="text-slate-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Post Image */}
        <div className="aspect-square bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center relative">
          {content.imageUrl ? (
            <img src={content.imageUrl} alt="Post" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">PN</span>
              </div>
              <p className="text-[11px] text-slate-500">Image preview</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-4">
            <button className="text-slate-900 hover:text-red-500 transition-colors">
              <Heart className="w-6 h-6" />
            </button>
            <button className="text-slate-900">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="text-slate-900">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button className="text-slate-900">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes */}
        <div className="px-3 pb-1">
          <p className="text-[12px] font-semibold text-slate-900">1,234 likes</p>
        </div>

        {/* Caption */}
        <div className="px-3 pb-2">
          <p className="text-[12px] text-slate-900">
            <span className="font-semibold">{username}</span>{' '}
            <span className="whitespace-pre-wrap">{content.body}</span>
          </p>
        </div>

        {/* Hashtags */}
        {content.hashtags && content.hashtags.length > 0 && (
          <div className="px-3 pb-2">
            <p className="text-[11px] text-sky-600">
              {content.hashtags.map(tag => `#${tag}`).join(' ')}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <div className="px-3 pb-3">
          <p className="text-[10px] text-slate-400 uppercase">Just now</p>
        </div>

        {/* Brand Score Badge */}
        {brandScore && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 w-fit">
              <span className="text-[10px] font-bold text-emerald-700">{brandScore}% brand aligned</span>
            </div>
          </div>
        )}
      </div>

      {/* Home Indicator */}
      <div className="mt-2 mb-1">
        <div className="w-32 h-1 bg-white/30 rounded-full mx-auto" />
      </div>
    </div>
  );
}
