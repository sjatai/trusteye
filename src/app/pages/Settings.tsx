import { User, Bell, Lock, Palette, Database, CreditCard, Users as UsersIcon, Zap } from 'lucide-react';
import { useState } from 'react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Privacy', icon: Database },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'team', label: 'Team', icon: UsersIcon },
    { id: 'integrations', label: 'API & Webhooks', icon: Zap },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-slate-900 mb-1">Settings</h1>
        <p className="text-[13px] text-slate-600">
          Manage your account preferences and configurations
        </p>
      </div>

      <div className="flex gap-6">
        {/* Tabs Sidebar */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-sky-50 border border-sky-200 text-sky-700'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'data' && <DataSettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'team' && <TeamSettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Profile Information</h3>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center text-white text-[20px] font-bold">
            JD
          </div>
          <div>
            <button className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[12px] font-semibold hover:bg-sky-100 transition-all">
              Change Avatar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              defaultValue="John Doe"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue="john.doe@company.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Role</label>
            <input
              type="text"
              defaultValue="Marketing Manager"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all">
            Save Changes
          </button>
          <button className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const notifications = [
    { id: 'campaign_launched', label: 'Campaign launched', description: 'When a campaign goes live', enabled: true },
    { id: 'campaign_completed', label: 'Campaign completed', description: 'When a campaign finishes', enabled: true },
    { id: 'low_engagement', label: 'Low engagement alerts', description: 'When campaigns underperform', enabled: false },
    { id: 'weekly_report', label: 'Weekly performance report', description: 'Email summary every Monday', enabled: true },
  ];

  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200">
      <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Notification Preferences</h3>
      
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="flex-1">
              <p className="text-[13px] font-medium text-slate-900">{notif.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{notif.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={notif.enabled} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>
        </div>

        <button className="mt-6 px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all">
          Update Password
        </button>
      </div>

      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Two-Factor Authentication</h3>
        <p className="text-[13px] text-slate-600 mb-4">Add an extra layer of security to your account</p>
        
        <button className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-semibold hover:bg-emerald-100 transition-all">
          Enable 2FA
        </button>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200">
      <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Appearance</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            <button className="p-4 rounded-lg border-2 border-sky-300 bg-sky-50 text-left">
              <div className="w-8 h-8 rounded bg-white border border-slate-200 mb-2" />
              <p className="text-[12px] font-semibold text-slate-900">Light</p>
            </button>
            <button className="p-4 rounded-lg border border-slate-200 bg-white text-left hover:border-sky-300 transition-all">
              <div className="w-8 h-8 rounded bg-slate-900 mb-2" />
              <p className="text-[12px] font-semibold text-slate-900">Dark</p>
            </button>
            <button className="p-4 rounded-lg border border-slate-200 bg-white text-left hover:border-sky-300 transition-all">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-white to-slate-900 mb-2" />
              <p className="text-[12px] font-semibold text-slate-900">Auto</p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-3">Accent Color</label>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-lg bg-sky-500 border-2 border-sky-700" />
            <button className="w-10 h-10 rounded-lg bg-emerald-500 border-2 border-transparent hover:border-emerald-700" />
            <button className="w-10 h-10 rounded-lg bg-purple-500 border-2 border-transparent hover:border-purple-700" />
            <button className="w-10 h-10 rounded-lg bg-orange-500 border-2 border-transparent hover:border-orange-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSettings() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Data Export</h3>
        <p className="text-[13px] text-slate-600 mb-4">Download all your campaign data, audiences, and analytics</p>
        
        <button className="px-4 py-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[13px] font-semibold hover:bg-sky-100 transition-all">
          Request Data Export
        </button>
      </div>

      <div className="p-6 rounded-xl bg-white border border-red-200">
        <h3 className="text-[15px] font-semibold text-red-900 mb-4">Danger Zone</h3>
        <p className="text-[13px] text-slate-600 mb-4">Permanently delete your account and all associated data</p>
        
        <button className="px-4 py-2 rounded-lg bg-red-50 border border-red-300 text-red-700 text-[13px] font-semibold hover:bg-red-100 transition-all">
          Delete Account
        </button>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Current Plan</h3>
        
        <div className="p-4 rounded-lg bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[18px] font-bold text-slate-900">Pro Plan</span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">Active</span>
          </div>
          <p className="text-[13px] text-slate-600 mb-3">$99/month • Billed annually</p>
          <p className="text-[11px] text-slate-500">Next billing date: Feb 19, 2026</p>
        </div>

        <button className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all">
          Upgrade Plan
        </button>
      </div>

      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Payment Method</h3>
        
        <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 mb-4">
          <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-[10px] font-bold">
            VISA
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-slate-900">•••• 4242</p>
            <p className="text-[11px] text-slate-500">Expires 12/2027</p>
          </div>
          <button className="text-[12px] font-semibold text-sky-600 hover:text-sky-700">
            Edit
          </button>
        </div>

        <button className="px-4 py-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[13px] font-semibold hover:bg-sky-100 transition-all">
          Add Payment Method
        </button>
      </div>
    </div>
  );
}

function TeamSettings() {
  const team = [
    { name: 'John Doe', email: 'john@company.com', role: 'Owner', avatar: 'JD' },
    { name: 'Jane Smith', email: 'jane@company.com', role: 'Admin', avatar: 'JS' },
    { name: 'Mike Johnson', email: 'mike@company.com', role: 'Member', avatar: 'MJ' },
  ];

  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-900">Team Members</h3>
        <button className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-[12px] font-semibold hover:bg-sky-600 transition-all">
          Invite Member
        </button>
      </div>
      
      <div className="space-y-3">
        {team.map((member, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center text-white text-[12px] font-bold">
                {member.avatar}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{member.name}</p>
                <p className="text-[11px] text-slate-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                {member.role}
              </span>
              {member.role !== 'Owner' && (
                <button className="text-[11px] font-semibold text-slate-600 hover:text-slate-900">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationSettings() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4">API Keys</h3>
        <p className="text-[13px] text-slate-600 mb-4">Use these keys to integrate KQ Studio with your applications</p>
        
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 mb-4">
          kq_live_1a2b3c4d5e6f7g8h9i0j
        </div>

        <button className="px-4 py-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[13px] font-semibold hover:bg-sky-100 transition-all">
          Generate New Key
        </button>
      </div>

      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Webhooks</h3>
        <p className="text-[13px] text-slate-600 mb-4">Receive real-time notifications about campaign events</p>
        
        <button className="px-4 py-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[13px] font-semibold hover:bg-sky-100 transition-all">
          Add Webhook
        </button>
      </div>
    </div>
  );
}
