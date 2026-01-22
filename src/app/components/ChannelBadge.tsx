import type { ContentChannel } from '../types/content';
import { CHANNEL_CONFIG } from '../types/content';

interface ChannelBadgeProps {
  channel: ContentChannel;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ChannelBadge({ channel, size = 'sm', showLabel = false }: ChannelBadgeProps) {
  const config = CHANNEL_CONFIG[channel];

  const colorClasses = {
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-sky-50 border-sky-200 text-sky-700',
  };

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-[11px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${colorClasses[config.color as keyof typeof colorClasses]} ${sizeClasses[size]}`}
      title={config.label}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

interface ChannelBadgeGroupProps {
  channels: ContentChannel[];
  size?: 'sm' | 'md';
  maxVisible?: number;
}

export function ChannelBadgeGroup({ channels, size = 'sm', maxVisible = 3 }: ChannelBadgeGroupProps) {
  const visible = channels.slice(0, maxVisible);
  const remaining = channels.length - maxVisible;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map(channel => (
        <ChannelBadge key={channel} channel={channel} size={size} />
      ))}
      {remaining > 0 && (
        <span className={`text-slate-500 ${size === 'sm' ? 'text-[10px]' : 'text-[11px]'}`}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
