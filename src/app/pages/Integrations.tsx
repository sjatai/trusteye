import { Plus, CheckCircle2, Settings, ExternalLink, Mail, Database, ShoppingCart, MessageSquare, BarChart, Zap, Info, Instagram, Linkedin, Twitter, Loader2, XCircle, Link2 } from 'lucide-react';
import { useState, useEffect } from 'react';

// Use production API by default, localhost only in dev mode
const API_BASE = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3009' : 'https://api-production-26c1.up.railway.app');

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status: 'connected' | 'available' | 'loading';
  color: string;
  connections?: number;
  provider?: string;
  profile?: {
    name?: string;
    username?: string;
  };
  connectedAt?: string;
}

interface OAuthStatus {
  provider: string;
  connected: boolean;
  configured: boolean;
  profile?: {
    id: string;
    name: string;
    username?: string;
  };
  connectedAt?: string;
}

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

export function IntegrationsPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState<string | null>(null);
  const [setupInstructions, setSetupInstructions] = useState<any>(null);

  // Check URL params for OAuth callback results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const name = params.get('name');

    if (success) {
      showToastMessage(`Successfully connected ${name || success}!`, 'success');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh status
      fetchOAuthStatus();
    } else if (error) {
      showToastMessage(`Connection failed: ${error}`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch OAuth status on mount
  useEffect(() => {
    fetchOAuthStatus();
  }, []);

  const fetchOAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/oauth/status`);
      const data = await response.json();
      if (data.success) {
        setOauthStatus(data.integrations);
      }
    } catch (error) {
      console.error('Failed to fetch OAuth status:', error);
    }
  };

  const showToastMessage = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleConnect = async (provider: string) => {
    setLoadingProvider(provider);
    try {
      const response = await fetch(`${API_BASE}/api/oauth/${provider}/connect`);
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else if (data.setup) {
        // Show setup instructions
        setSetupInstructions(data.setup);
        setShowSetupModal(provider);
        setLoadingProvider(null);
      } else {
        showToastMessage(data.error || 'Failed to connect', 'error');
        setLoadingProvider(null);
      }
    } catch (error) {
      showToastMessage('Failed to initiate connection', 'error');
      setLoadingProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setLoadingProvider(provider);
    try {
      const response = await fetch(`${API_BASE}/api/oauth/${provider}/disconnect`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        showToastMessage(`${provider} disconnected`, 'success');
        fetchOAuthStatus();
      } else {
        showToastMessage(data.error || 'Failed to disconnect', 'error');
      }
    } catch (error) {
      showToastMessage('Failed to disconnect', 'error');
    }
    setLoadingProvider(null);
  };

  const handleShowSetup = async (provider: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/oauth/${provider}/setup`);
      const data = await response.json();
      if (data.success) {
        setSetupInstructions(data.instructions);
        setShowSetupModal(provider);
      }
    } catch (error) {
      showToastMessage('Failed to load setup instructions', 'error');
    }
  };

  // Get OAuth status for a provider
  const getProviderStatus = (provider: string): OAuthStatus | undefined => {
    return oauthStatus.find(s => s.provider === provider);
  };

  const baseIntegrations: Integration[] = [
    {
      id: '1',
      name: 'Birdeye',
      description: 'Customer reviews and reputation data',
      icon: Database,
      category: 'Reviews',
      status: 'connected',
      color: 'emerald',
      connections: 1,
    },
    {
      id: '2',
      name: 'Slack',
      description: 'Campaign notifications and approvals',
      icon: MessageSquare,
      category: 'Communication',
      status: 'connected',
      color: 'purple',
      connections: 1,
    },
    {
      id: '3',
      name: 'Resend',
      description: 'Email delivery service',
      icon: Mail,
      category: 'Email',
      status: 'connected',
      color: 'sky',
      connections: 1,
    },
  ];

  // Social media integrations with OAuth
  const socialIntegrations: Integration[] = [
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Post content to Instagram Business',
      icon: Instagram,
      category: 'Social',
      status: getProviderStatus('instagram')?.connected ? 'connected' : 'available',
      color: 'pink',
      provider: 'instagram',
      profile: getProviderStatus('instagram')?.profile,
      connectedAt: getProviderStatus('instagram')?.connectedAt,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Share updates on LinkedIn',
      icon: Linkedin,
      category: 'Social',
      status: getProviderStatus('linkedin')?.connected ? 'connected' : 'available',
      color: 'blue',
      provider: 'linkedin',
      profile: getProviderStatus('linkedin')?.profile,
      connectedAt: getProviderStatus('linkedin')?.connectedAt,
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      description: 'Post tweets and threads',
      icon: Twitter,
      category: 'Social',
      status: getProviderStatus('twitter')?.connected ? 'connected' : 'available',
      color: 'slate',
      provider: 'twitter',
      profile: getProviderStatus('twitter')?.profile,
      connectedAt: getProviderStatus('twitter')?.connectedAt,
    },
  ];

  const otherIntegrations: Integration[] = [
    {
      id: '4',
      name: 'Shopify',
      description: 'Sync products, orders, and customers',
      icon: ShoppingCart,
      category: 'E-commerce',
      status: 'available',
      color: 'amber',
    },
    {
      id: '5',
      name: 'Salesforce',
      description: 'CRM data synchronization',
      icon: Database,
      category: 'CRM',
      status: 'available',
      color: 'sky',
    },
    {
      id: '6',
      name: 'Google Analytics',
      description: 'Track campaign performance',
      icon: BarChart,
      category: 'Analytics',
      status: 'available',
      color: 'amber',
    },
    {
      id: '7',
      name: 'Zapier',
      description: 'Connect 5000+ apps',
      icon: Zap,
      category: 'Automation',
      status: 'available',
      color: 'orange',
    },
  ];

  const allIntegrations = [...baseIntegrations, ...socialIntegrations, ...otherIntegrations];
  const connected = allIntegrations.filter(i => i.status === 'connected');
  const available = allIntegrations.filter(i => i.status === 'available');

  const handleComingSoon = () => {
    showToastMessage('Coming soon', 'info');
  };

  return (
    <div className="p-8">
      {/* Toast notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-[13px] font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          toastType === 'success' ? 'bg-emerald-600' :
          toastType === 'error' ? 'bg-red-600' :
          'bg-slate-800'
        }`}>
          {toastType === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
           toastType === 'error' ? <XCircle className="w-4 h-4" /> :
           <Info className="w-4 h-4" />}
          {toastMessage}
        </div>
      )}

      {/* Setup Modal */}
      {showSetupModal && setupInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-slate-900">
                Setup {showSetupModal.charAt(0).toUpperCase() + showSetupModal.slice(1)}
              </h3>
              <button
                onClick={() => setShowSetupModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[13px] font-semibold text-slate-700 mb-2">Steps:</h4>
                <ol className="space-y-1.5">
                  {setupInstructions.steps?.map((step: string, i: number) => (
                    <li key={i} className="text-[12px] text-slate-600">{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="text-[13px] font-semibold text-slate-700 mb-2">Environment Variables:</h4>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-emerald-400">
                  {setupInstructions.envVars?.map((envVar: string, i: number) => (
                    <div key={i}>{envVar}</div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <a
                  href={setupInstructions.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-[#1E5ECC] font-medium hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Documentation
                </a>
                <button
                  onClick={() => setShowSetupModal(null)}
                  className="px-4 py-2 rounded-lg bg-[#1E5ECC] text-white text-[12px] font-semibold hover:bg-[#1a4fb3]"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 mb-1">Integrations</h1>
            <p className="text-[13px] text-slate-600">
              Connect your favorite tools and platforms
            </p>
          </div>
          <Tooltip text="Coming soon">
            <button
              onClick={handleComingSoon}
              className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-400 text-[13px] font-semibold cursor-not-allowed flex items-center gap-2"
              aria-label="Browse all integrations - coming soon"
            >
              <ExternalLink className="w-4 h-4" />
              Browse All
            </button>
          </Tooltip>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Connected</span>
            <p className="text-[20px] font-bold text-emerald-900">{connected.length}</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-sky-50 border border-sky-200">
            <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wide">Available</span>
            <p className="text-[20px] font-bold text-sky-900">{available.length}</p>
          </div>
        </div>
      </div>

      {/* Connected Integrations */}
      <div className="mb-8">
        <h2 className="text-[15px] font-semibold text-slate-900 mb-3">Connected</h2>
        <div className="grid grid-cols-3 gap-3">
          {connected.map((integration) => {
            const Icon = integration.icon;
            const colorClasses: Record<string, string> = {
              emerald: 'from-emerald-500 to-emerald-600',
              sky: 'from-sky-500 to-sky-600',
              purple: 'from-purple-500 to-purple-600',
              teal: 'from-teal-500 to-teal-600',
              pink: 'from-pink-500 to-rose-600',
              blue: 'from-blue-600 to-blue-700',
              slate: 'from-slate-700 to-slate-900',
            };

            return (
              <div
                key={integration.id}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClasses[integration.color] || colorClasses.emerald} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-emerald-700">Active</span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-[14px] font-semibold text-slate-900 mb-1">
                  {integration.name}
                </h3>
                <p className="text-[11px] text-slate-600 mb-1">
                  {integration.description}
                </p>
                {integration.profile?.username && (
                  <p className="text-[10px] text-slate-500">
                    @{integration.profile.username}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-3">
                  <span className="text-[11px] text-slate-500">
                    {integration.provider ? 'OAuth connected' : `${integration.connections} connection${integration.connections === 1 ? '' : 's'}`}
                  </span>
                  {integration.provider ? (
                    <button
                      onClick={() => handleDisconnect(integration.provider!)}
                      disabled={loadingProvider === integration.provider}
                      className="text-[11px] font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-50"
                    >
                      {loadingProvider === integration.provider ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      Disconnect
                    </button>
                  ) : (
                    <Tooltip text="Coming soon">
                      <button
                        onClick={handleComingSoon}
                        className="text-[11px] font-semibold text-slate-400 cursor-not-allowed flex items-center gap-1"
                        aria-label={`Configure ${integration.name} - coming soon`}
                      >
                        <Settings className="w-3 h-3" />
                        Configure
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Media Integrations */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Social Media</h2>
          <span className="px-2 py-0.5 rounded-full bg-[#E6F0FF] text-[10px] font-semibold text-[#1E5ECC]">
            OAuth
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {socialIntegrations.filter(i => i.status === 'available').map((integration) => {
            const Icon = integration.icon;
            const colorClasses: Record<string, string> = {
              pink: 'from-pink-500 to-rose-600',
              blue: 'from-blue-600 to-blue-700',
              slate: 'from-slate-700 to-slate-900',
            };
            const providerStatus = getProviderStatus(integration.provider!);

            return (
              <div
                key={integration.id}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#1E5ECC]/30 hover:shadow-md transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClasses[integration.color]} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600">
                    {integration.category}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-[14px] font-semibold text-slate-900 mb-1">
                  {integration.name}
                </h3>
                <p className="text-[11px] text-slate-600 mb-3">
                  {integration.description}
                </p>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <button
                    onClick={() => handleConnect(integration.provider!)}
                    disabled={loadingProvider === integration.provider}
                    className="w-full px-3 py-2 rounded-lg bg-[#1E5ECC] text-white text-[12px] font-semibold hover:bg-[#1a4fb3] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {loadingProvider === integration.provider ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                    Connect with OAuth
                  </button>
                  {!providerStatus?.configured && (
                    <button
                      onClick={() => handleShowSetup(integration.provider!)}
                      className="w-full text-[11px] text-slate-500 hover:text-[#1E5ECC]"
                    >
                      View setup instructions
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-3">Other Integrations</h2>
        <div className="grid grid-cols-3 gap-3">
          {otherIntegrations.map((integration) => {
            const Icon = integration.icon;
            const colorClasses: Record<string, string> = {
              amber: 'from-amber-500 to-amber-600',
              yellow: 'from-yellow-500 to-yellow-600',
              orange: 'from-orange-500 to-orange-600',
              sky: 'from-sky-500 to-sky-600',
            };

            return (
              <div
                key={integration.id}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClasses[integration.color] || colorClasses.amber} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600">
                    {integration.category}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-[14px] font-semibold text-slate-900 mb-1">
                  {integration.name}
                </h3>
                <p className="text-[11px] text-slate-600 mb-3">
                  {integration.description}
                </p>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-200">
                  <Tooltip text="Coming soon">
                    <button
                      onClick={handleComingSoon}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 text-[12px] font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                      aria-label={`Connect ${integration.name} - coming soon`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Connect
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Integration CTA */}
      <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-sky-300 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 flex items-center justify-center">
            <Zap className="w-6 h-6 text-sky-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
              Need a Custom Integration?
            </h3>
            <p className="text-[13px] text-slate-600">
              Use our API or webhooks to connect any platform
            </p>
          </div>
          <Tooltip text="Coming soon">
            <button
              onClick={handleComingSoon}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-400 text-[13px] font-semibold cursor-not-allowed"
              aria-label="View API documentation - coming soon"
            >
              View Docs
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
