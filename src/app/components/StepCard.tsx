import { Mail, MessageSquare, Bell, MessageCircle, Globe, Gift, MoreVertical } from 'lucide-react';

// Tooltip component for disabled buttons
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}

type ChannelType = 'email' | 'sms' | 'push' | 'whatsapp' | 'onsite' | 'reward';

interface StepCardProps {
  channel: ChannelType;
  title: string;
  schedule: string;
  preview: string;
  status?: 'sent' | 'scheduled' | 'draft';
  imageUrl?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const channelConfig = {
  email: { icon: Mail, color: 'bg-purple-500', label: 'Email' },
  sms: { icon: MessageSquare, color: 'bg-purple-500', label: 'SMS' },
  push: { icon: Bell, color: 'bg-indigo-500', label: 'Push' },
  whatsapp: { icon: MessageCircle, color: 'bg-green-500', label: 'WhatsApp' },
  onsite: { icon: Globe, color: 'bg-blue-500', label: 'Onsite' },
  reward: { icon: Gift, color: 'bg-pink-500', label: 'Reward' },
};

export function StepCard({ channel, title, schedule, preview, status = 'scheduled', imageUrl, isSelected, onClick }: StepCardProps) {
  const config = channelConfig[channel];
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-2xl p-6 hover:shadow-sm transition-all cursor-pointer ${
        isSelected ? 'border-slate-900 ring-1 ring-slate-900/10' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
            <p className="text-[13px] text-slate-500 mt-0.5">{schedule}</p>
          </div>
        </div>
        <Tooltip text="Coming soon">
          <button
            className="p-1 rounded-lg text-slate-400 cursor-not-allowed"
            aria-label="More actions - coming soon"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Preview */}
      <div className="space-y-3">
        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <img src={imageUrl} alt="Message preview" className="w-full h-auto" />
          </div>
        )}
        <div className="text-[14px] text-slate-700 leading-relaxed">{preview}</div>
      </div>

      {/* Status */}
      {status === 'sent' && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[12px] font-medium">
            Sent
          </span>
        </div>
      )}
    </div>
  );
}