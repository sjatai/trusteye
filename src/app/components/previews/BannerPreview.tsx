import { Maximize2 } from 'lucide-react';
import type { ContentBody } from '../../types/content';

interface BannerPreviewProps {
  content: ContentBody;
  brandScore?: number;
}

// Banner dimension presets
const BANNER_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  '728x90': { width: 728, height: 90, label: 'Leaderboard' },
  '300x250': { width: 300, height: 250, label: 'Medium Rectangle' },
  '160x600': { width: 160, height: 600, label: 'Wide Skyscraper' },
  '300x600': { width: 300, height: 600, label: 'Half Page' },
  '970x250': { width: 970, height: 250, label: 'Billboard' },
  '1200x400': { width: 1200, height: 400, label: 'Hero Banner' },
};

export function BannerPreview({ content, brandScore }: BannerPreviewProps) {
  const dimensions = content.dimensions || '728x90';
  const preset = BANNER_DIMENSIONS[dimensions] || BANNER_DIMENSIONS['728x90'];

  // Scale factor to fit in preview area
  const maxWidth = 400;
  const maxHeight = 300;
  const scaleX = maxWidth / preset.width;
  const scaleY = maxHeight / preset.height;
  const scale = Math.min(scaleX, scaleY, 1);

  const scaledWidth = preset.width * scale;
  const scaledHeight = preset.height * scale;

  // Determine layout based on aspect ratio
  const aspectRatio = preset.width / preset.height;
  const isHorizontal = aspectRatio > 2;
  const isVertical = aspectRatio < 0.5;
  const isSquareish = aspectRatio >= 0.5 && aspectRatio <= 2;

  return (
    <div className="space-y-3">
      {/* Dimension Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-slate-400" />
          <span className="text-[12px] font-medium text-slate-700">{preset.label}</span>
          <span className="text-[11px] text-slate-500">({dimensions})</span>
        </div>
        {brandScore && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700">{brandScore}%</span>
          </div>
        )}
      </div>

      {/* Banner Preview Container */}
      <div className="bg-slate-100 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
        {/* Scaled Banner */}
        <div
          className="bg-gradient-to-r from-sky-500 to-teal-500 rounded-lg shadow-lg overflow-hidden flex items-center justify-center relative"
          style={{ width: scaledWidth, height: scaledHeight }}
        >
          {/* Banner Content */}
          {isHorizontal && (
            <div className="flex items-center justify-between w-full h-full px-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">PN</span>
                </div>
                <p className="text-white text-[12px] font-medium max-w-[60%] line-clamp-1">
                  {content.body}
                </p>
              </div>
              {content.cta && (
                <button className="px-3 py-1 bg-white text-sky-600 text-[10px] font-bold rounded-full whitespace-nowrap">
                  {content.cta}
                </button>
              )}
            </div>
          )}

          {isVertical && (
            <div className="flex flex-col items-center justify-between h-full py-4 px-3 text-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-[12px]">PN</span>
              </div>
              <p className="text-white text-[11px] font-medium leading-tight">
                {content.body}
              </p>
              {content.cta && (
                <button className="px-3 py-1.5 bg-white text-sky-600 text-[10px] font-bold rounded-full">
                  {content.cta}
                </button>
              )}
            </div>
          )}

          {isSquareish && (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <span className="text-white font-bold text-sm">PN</span>
              </div>
              <p className="text-white text-[12px] font-semibold leading-tight mb-3 line-clamp-3">
                {content.body}
              </p>
              {content.cta && (
                <button className="px-4 py-2 bg-white text-sky-600 text-[11px] font-bold rounded-full">
                  {content.cta}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actual Dimensions Note */}
      <p className="text-[10px] text-slate-500 text-center">
        Actual size: {preset.width} x {preset.height} pixels
        {scale < 1 && ` (shown at ${Math.round(scale * 100)}% scale)`}
      </p>
    </div>
  );
}
