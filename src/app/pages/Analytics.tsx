import { Calendar, TrendingUp, Users, Mail, MousePointer, DollarSign, Play, Clock, AlertCircle, CheckCircle, MoreVertical, BarChart3, Share2, StopCircle, Zap, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { campaignsApi, aiApi } from '@/app/lib/api';
import type { Campaign as APICampaign } from '@/app/lib/api';

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

interface Campaign {
  id: string;
  name: string;
  status: 'running' | 'pending' | 'stuck' | 'completed' | 'draft' | 'scheduled' | 'paused';
  audience: number;
  channel: string;
  startDate: string;
  metrics: {
    sent: number;
    opens: number;
    clicks: number;
    conversions: number;
    revenue?: number;
  };
  actions: Action[];
}

interface Action {
  id: string;
  type: string;
  timestamp: string;
  user: string;
  description: string;
}

// Transform API campaign to Analytics campaign
function transformCampaign(apiCampaign: APICampaign): Campaign {
  // Map API status to analytics status
  const statusMap: Record<string, Campaign['status']> = {
    'draft': 'pending',
    'scheduled': 'pending',
    'running': 'running',
    'completed': 'completed',
    'paused': 'stuck'
  };

  return {
    id: apiCampaign.id,
    name: apiCampaign.name,
    status: statusMap[apiCampaign.status] || 'pending',
    audience: apiCampaign.metrics?.sent || 0,
    channel: apiCampaign.channels?.join(' + ') || 'Email',
    startDate: apiCampaign.schedule?.start_date || apiCampaign.created_at,
    metrics: {
      sent: apiCampaign.metrics?.sent || 0,
      opens: apiCampaign.metrics?.opened || 0,
      clicks: apiCampaign.metrics?.clicked || 0,
      conversions: apiCampaign.metrics?.converted || 0,
      revenue: (apiCampaign.metrics?.converted || 0) * 100 // Estimate $100 per conversion
    },
    actions: [
      {
        id: `${apiCampaign.id}-created`,
        type: 'created',
        timestamp: apiCampaign.created_at,
        user: 'System',
        description: 'Campaign created'
      },
      ...(apiCampaign.gate_results || []).map((gate: any, idx: number) => ({
        id: `${apiCampaign.id}-gate-${idx}`,
        type: gate.passed ? 'completed' : 'error',
        timestamp: new Date().toISOString(),
        user: gate.gate === 'human_approval' ? (gate.details?.approver || 'Approver') : 'System',
        description: `Gate ${idx + 1}: ${gate.gate} - ${gate.passed ? 'Passed' : 'Failed'}`
      }))
    ]
  };
}

export function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'running' | 'pending' | 'stuck' | 'completed'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Fetch campaigns from API
  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await campaignsApi.list();
      if (response.success && response.data) {
        const transformed = response.data.map(transformCampaign);
        setCampaigns(transformed);
        // Auto-select first campaign if none selected
        if (!selectedCampaign && transformed.length > 0) {
          setSelectedCampaign(transformed[0]);
        }
      } else {
        setError(response.error || 'Failed to load campaigns');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Handle analyze performance
  const handleAnalyze = async () => {
    if (!selectedCampaign) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const response = await aiApi.analyze(selectedCampaign.id);
      if (response.success) {
        setAnalysisResult(response.data?.insights?.join('\n') || 'Analysis complete. Performance is within expected range.');
      } else {
        setError(response.error || 'Failed to analyze campaign');
      }
    } catch (err) {
      setError('Failed to analyze campaign');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle stop campaign
  const handleStop = async () => {
    if (!selectedCampaign) return;
    try {
      const response = await campaignsApi.pause(selectedCampaign.id);
      if (response.success) {
        setCampaigns(prev => prev.map(c =>
          c.id === selectedCampaign.id ? { ...c, status: 'stuck' as const } : c
        ));
        setSelectedCampaign(prev => prev ? { ...prev, status: 'stuck' as const } : null);
      } else {
        setError(response.error || 'Failed to stop campaign');
      }
    } catch (err) {
      setError('Failed to stop campaign');
    }
  };

  // Handle approve campaign
  const handleApprove = async () => {
    if (!selectedCampaign) return;
    try {
      const response = await campaignsApi.approve(selectedCampaign.id);
      if (response.success) {
        setCampaigns(prev => prev.map(c =>
          c.id === selectedCampaign.id ? { ...c, status: 'running' as const } : c
        ));
        setSelectedCampaign(prev => prev ? { ...prev, status: 'running' as const } : null);
      } else {
        setError(response.error || 'Failed to approve campaign');
      }
    } catch (err) {
      setError('Failed to approve campaign');
    }
  };

  // Handle resume/fix campaign
  const handleResume = async () => {
    if (!selectedCampaign) return;
    try {
      const response = await campaignsApi.resume(selectedCampaign.id);
      if (response.success) {
        setCampaigns(prev => prev.map(c =>
          c.id === selectedCampaign.id ? { ...c, status: 'running' as const } : c
        ));
        setSelectedCampaign(prev => prev ? { ...prev, status: 'running' as const } : null);
      } else {
        setError(response.error || 'Failed to resume campaign');
      }
    } catch (err) {
      setError('Failed to resume campaign');
    }
  };

  const statusConfig = {
    running: { label: 'Running', color: 'emerald', icon: Play, count: campaigns.filter(c => c.status === 'running').length },
    pending: { label: 'Pending Approval', color: 'amber', icon: Clock, count: campaigns.filter(c => c.status === 'pending').length },
    stuck: { label: 'Stuck', color: 'red', icon: AlertCircle, count: campaigns.filter(c => c.status === 'stuck').length },
    completed: { label: 'Completed', color: 'teal', icon: CheckCircle, count: campaigns.filter(c => c.status === 'completed').length },
  };

  const filteredCampaigns = selectedStatus === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === selectedStatus);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Error Banner */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-[13px] text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-[12px] text-red-600 font-semibold hover:text-red-700 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Left: Campaign List by Status */}
      <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col h-screen">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1E5ECC]" />
              <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
                Analytics
              </h2>
            </div>
            <button
              onClick={fetchCampaigns}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-all"
              title="Refresh"
              aria-label="Refresh campaigns"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Campaign performance
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Status Filters */}
          <div className="space-y-1 mb-3">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all ${
                selectedStatus === 'all'
                  ? 'bg-[#E6F0FF] border border-[#B3D4FF] text-[#1E5ECC]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Campaigns
              <span className="float-right text-[11px] opacity-70">{campaigns.length}</span>
            </button>

            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedStatus(key as any)}
                  className={`w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all flex items-center gap-2 ${
                    selectedStatus === key
                      ? 'bg-[#E6F0FF] border border-[#B3D4FF] text-[#1E5ECC]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    config.color === 'emerald' ? 'text-emerald-600' :
                    config.color === 'amber' ? 'text-amber-600' :
                    config.color === 'red' ? 'text-red-600' :
                    'text-teal-600'
                  }`} />
                  {config.label}
                  <span className="ml-auto text-[11px] opacity-70">{config.count}</span>
                </button>
              );
            })}
          </div>

          {/* Campaign List */}
          <div className="space-y-2">
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-[12px] text-slate-500">No campaigns found</p>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => {
                const config = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.pending;
                const Icon = config.icon;
                const isSelected = selectedCampaign?.id === campaign.id;

                return (
                  <button
                    key={campaign.id}
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setAnalysisResult(null);
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-[#E6F0FF] border-[#B3D4FF] shadow-sm'
                        : 'bg-white border-slate-200 hover:border-[#1E5ECC]/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        config.color === 'emerald' ? 'text-emerald-600' :
                        config.color === 'amber' ? 'text-amber-600' :
                        config.color === 'red' ? 'text-red-600' :
                        'text-teal-600'
                      }`} />
                      <h3 className="text-[12px] font-semibold text-slate-900 leading-tight flex-1">
                        {campaign.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600 ml-6">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {campaign.audience.toLocaleString()}
                      </span>
                      <span>{campaign.channel}</span>
                    </div>

                    {campaign.metrics.sent > 0 && (
                      <div className="flex items-center gap-2 mt-2 ml-6">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1E5ECC] rounded-full"
                            style={{ width: `${(campaign.metrics.opens / campaign.metrics.sent) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-[#1E5ECC]">
                          {Math.round((campaign.metrics.opens / campaign.metrics.sent) * 100)}%
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-[11px] text-slate-500">
            <div className="flex items-center justify-between mb-1">
              <span>Total Revenue</span>
              <span className="font-semibold text-slate-900">
                ${campaigns.reduce((sum, c) => sum + (c.metrics.revenue || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg. Open Rate</span>
              <span className="font-semibold text-emerald-600">
                {campaigns.length > 0
                  ? Math.round(campaigns.reduce((sum, c) => sum + (c.metrics.sent > 0 ? (c.metrics.opens / c.metrics.sent) * 100 : 0), 0) / campaigns.length)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Campaign Details & Commands */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedCampaign ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-[22px] font-bold text-slate-900">
                      {selectedCampaign.name}
                    </h1>
                    {(() => {
                      const config = statusConfig[selectedCampaign.status as keyof typeof statusConfig] || statusConfig.pending;
                      const Icon = config.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                          config.color === 'emerald' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                          config.color === 'amber' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                          config.color === 'red' ? 'bg-red-50 border border-red-200 text-red-700' :
                          'bg-teal-50 border border-teal-200 text-teal-700'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[13px] text-slate-600">
                    {selectedCampaign.channel} • {selectedCampaign.audience.toLocaleString()} recipients • Started {new Date(selectedCampaign.startDate).toLocaleDateString()}
                  </p>
                </div>
                <Tooltip text="Coming soon">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 cursor-not-allowed"
                    aria-label="More actions - coming soon"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>

              {/* Command Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Performance'}
                </button>

                {selectedCampaign.status === 'running' && (
                  <button
                    onClick={handleStop}
                    className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Campaign
                  </button>
                )}

                {selectedCampaign.status === 'pending' && (
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-semibold hover:bg-emerald-100 transition-all flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve & Launch
                  </button>
                )}

                {selectedCampaign.status === 'stuck' && (
                  <button
                    onClick={handleResume}
                    className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[13px] font-semibold hover:bg-amber-100 transition-all flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Resume Campaign
                  </button>
                )}

                <button className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Report
                </button>
              </div>
            </div>

            {/* Analysis Result */}
            {analysisResult && (
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                <h3 className="text-[13px] font-semibold text-sky-900 mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  AI Analysis
                </h3>
                <p className="text-[13px] text-sky-700 whitespace-pre-line">{analysisResult}</p>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sent</p>
                </div>
                <p className="text-[24px] font-bold text-slate-900">
                  {selectedCampaign.metrics.sent.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Opens</p>
                </div>
                <p className="text-[24px] font-bold text-slate-900">
                  {selectedCampaign.metrics.opens.toLocaleString()}
                </p>
                {selectedCampaign.metrics.sent > 0 && (
                  <p className="text-[11px] font-semibold text-emerald-600 mt-1">
                    {Math.round((selectedCampaign.metrics.opens / selectedCampaign.metrics.sent) * 100)}% rate
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <MousePointer className="w-4 h-4 text-teal-600" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Clicks</p>
                </div>
                <p className="text-[24px] font-bold text-slate-900">
                  {selectedCampaign.metrics.clicks.toLocaleString()}
                </p>
                {selectedCampaign.metrics.sent > 0 && (
                  <p className="text-[11px] font-semibold text-teal-600 mt-1">
                    {Math.round((selectedCampaign.metrics.clicks / selectedCampaign.metrics.sent) * 100)}% rate
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Conversions</p>
                </div>
                <p className="text-[24px] font-bold text-slate-900">
                  {selectedCampaign.metrics.conversions.toLocaleString()}
                </p>
                {selectedCampaign.metrics.sent > 0 && (
                  <p className="text-[11px] font-semibold text-purple-600 mt-1">
                    {Math.round((selectedCampaign.metrics.conversions / selectedCampaign.metrics.sent) * 100)}% rate
                  </p>
                )}
              </div>

              {selectedCampaign.metrics.revenue && selectedCampaign.metrics.revenue > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Revenue</p>
                  </div>
                  <p className="text-[24px] font-bold text-emerald-900">
                    ${(selectedCampaign.metrics.revenue / 1000).toFixed(1)}k
                  </p>
                  {selectedCampaign.metrics.conversions > 0 && (
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                      ${Math.round(selectedCampaign.metrics.revenue / selectedCampaign.metrics.conversions)} per conv.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Performance Chart Placeholder */}
            <div className="p-6 rounded-xl bg-white border border-slate-200">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Performance Over Time</h3>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-600">Chart visualization would go here</p>
                  <p className="text-[11px] text-slate-500">Opens, Clicks, Conversions by day</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-[18px] font-semibold text-slate-900 mb-2">Select a Campaign</h3>
              <p className="text-[13px] text-slate-600">
                Choose a campaign from the left to view analytics and take actions
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions Timeline */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-[15px] font-semibold text-slate-900">Activity Log</h2>
          {selectedCampaign && (
            <p className="text-[11px] text-slate-600 mt-1">
              {selectedCampaign.actions.length} {selectedCampaign.actions.length === 1 ? 'action' : 'actions'}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedCampaign ? (
            <div className="space-y-4">
              {selectedCampaign.actions.map((action, idx) => {
                const isLast = idx === selectedCampaign.actions.length - 1;

                return (
                  <div key={action.id} className="relative">
                    {/* Timeline connector */}
                    {!isLast && (
                      <div className="absolute left-4 top-10 w-0.5 h-full bg-slate-200" />
                    )}

                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        action.type === 'launched' ? 'bg-emerald-50 border border-emerald-200' :
                        action.type === 'error' || action.type === 'alert' ? 'bg-red-50 border border-red-200' :
                        action.type === 'completed' ? 'bg-teal-50 border border-teal-200' :
                        action.type === 'paused' ? 'bg-amber-50 border border-amber-200' :
                        'bg-sky-50 border border-sky-200'
                      }`}>
                        {action.type === 'launched' && <Play className="w-3.5 h-3.5 text-emerald-600" />}
                        {action.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                        {action.type === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                        {action.type === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-teal-600" />}
                        {action.type === 'paused' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {action.type === 'resumed' && <Play className="w-3.5 h-3.5 text-emerald-600" />}
                        {action.type === 'analyzed' && <BarChart3 className="w-3.5 h-3.5 text-sky-600" />}
                        {action.type === 'optimized' && <Zap className="w-3.5 h-3.5 text-sky-600" />}
                        {action.type === 'reviewed' && <Users className="w-3.5 h-3.5 text-amber-600" />}
                        {action.type === 'created' && <Calendar className="w-3.5 h-3.5 text-sky-600" />}
                        {action.type === 'exported' && <Share2 className="w-3.5 h-3.5 text-sky-600" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <p className="text-[13px] text-slate-900 font-medium mb-1">
                          {action.description}
                        </p>
                        <p className="text-[11px] text-slate-600 mb-0.5">
                          {action.user}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(action.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center px-4">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-[13px] text-slate-600">
                  Activity log will appear here when you select a campaign
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
