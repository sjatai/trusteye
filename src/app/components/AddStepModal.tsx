import { Mail, MessageSquare, Bell, MessageCircle, Globe, Gift, X } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';

interface AddStepModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const channels = [
  { id: 'email', icon: Mail, label: 'Email', description: 'Send personalized email campaigns', color: 'bg-purple-500' },
  { id: 'sms', icon: MessageSquare, label: 'SMS', description: 'Reach customers via text message', color: 'bg-purple-500' },
  { id: 'push', icon: Bell, label: 'Push Notification', description: 'Send mobile push notifications', color: 'bg-indigo-500' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', description: 'Connect via WhatsApp messaging', color: 'bg-green-500' },
  { id: 'onsite', icon: Globe, label: 'Onsite Message', description: 'Display messages on your website', color: 'bg-blue-500' },
  { id: 'reward', icon: Gift, label: 'Reward', description: 'Send loyalty points or rewards', color: 'bg-pink-500' },
];

export function AddStepModal({ isOpen, onClose }: AddStepModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] p-0 gap-0 [&>button]:hidden rounded-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-slate-900">Add Journey Step</h2>
              <p className="text-[13px] text-slate-500 mt-1">Choose a channel for your next step</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Channel List */}
        <div className="px-6 py-4 max-h-[500px] overflow-y-auto">
          <div className="grid gap-2">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <button
                  key={channel.id}
                  onClick={onClose}
                  className="flex items-center gap-4 px-4 py-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-left group"
                >
                  <div className={`w-12 h-12 rounded-xl ${channel.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-slate-900 group-hover:text-slate-950">
                      {channel.label}
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-0.5">{channel.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}