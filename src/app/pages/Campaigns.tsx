import { Search, Filter, Plus, Play, Pause, MoreVertical, Clock, CheckCircle, Mail, Users, Calendar, TrendingUp, Loader2, AlertCircle, RefreshCw, Info, FileText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/app/components/Modal';
import { campaignsApi } from '@/app/lib/api';
import type { Campaign as APICampaign } from '@/app/lib/api';
import type { ContentItem } from '@/app/types/content';

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

// Extended campaign type for UI display
interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  audience: number;
  channel: string;
  startDate?: string;
  performance?: { opens: number; clicks: number };
  description?: string;
  objective?: string;
}

// Transform API campaign to UI campaign
function transformCampaign(apiCampaign: APICampaign): Campaign {
  return {
    id: apiCampaign.id,
    name: apiCampaign.name,
    status: apiCampaign.status,
    audience: apiCampaign.metrics?.sent || 0,
    channel: apiCampaign.channels?.join(' + ') || 'Email',
    startDate: apiCampaign.schedule?.start_date,
    performance: apiCampaign.metrics ? {
      opens: apiCampaign.metrics.sent > 0
        ? Math.round((apiCampaign.metrics.opened / apiCampaign.metrics.sent) * 100 * 10) / 10
        : 0,
      clicks: apiCampaign.metrics.sent > 0
        ? Math.round((apiCampaign.metrics.clicked / apiCampaign.metrics.sent) * 100 * 10) / 10
        : 0
    } : undefined,
    description: apiCampaign.content?.body?.substring(0, 100),
    objective: apiCampaign.content?.subject
  };
}

interface CampaignsPageProps {
  preSelectedContent?: ContentItem | null;
}

export function CampaignsPage({ preSelectedContent }: CampaignsPageProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentTemplate, setContentTemplate] = useState<ContentItem | null>(null);

  // Form state for new campaign
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    channel: 'Email'
  });

  // Handle content pre-selection from Content Library
  const handleContentSelect = useCallback((content: ContentItem) => {
    setContentTemplate(content);
    // Pre-populate form with content
    setNewCampaign({
      name: `${content.campaignTypes[0]?.charAt(0).toUpperCase()}${content.campaignTypes[0]?.slice(1) || ''} Campaign - ${content.name}`,
      description: content.content.body || '',
      channel: content.channels[0] === 'email' ? 'Email' :
               content.channels[0] === 'sms' ? 'SMS' :
               content.channels[0] === 'instagram' ? 'Social' : 'Email'
    });
    setShowCreateModal(true);
  }, []);

  // Listen for content selection events from other pages
  useEffect(() => {
    const handleCreateFromContent = (event: CustomEvent<{ content: ContentItem }>) => {
      handleContentSelect(event.detail.content);
    };

    window.addEventListener('createCampaignFromContent', handleCreateFromContent as EventListener);
    return () => {
      window.removeEventListener('createCampaignFromContent', handleCreateFromContent as EventListener);
    };
  }, [handleContentSelect]);

  // Handle pre-selected content from props
  useEffect(() => {
    if (preSelectedContent) {
      handleContentSelect(preSelectedContent);
    }
  }, [preSelectedContent, handleContentSelect]);

  // Fetch campaigns from API
  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await campaignsApi.list();
      if (response.success && response.data) {
        setCampaigns(response.data.map(transformCampaign));
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

  // Filter campaigns by search
  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.channel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create campaign
  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) return;

    setIsSubmitting(true);
    try {
      // Build content from template if available
      const campaignContent = contentTemplate ? {
        subject: contentTemplate.content.subject || newCampaign.name,
        body: contentTemplate.content.body || newCampaign.description,
        cta: contentTemplate.content.cta || 'Learn More',
      } : {
        body: newCampaign.description
      };

      const response = await campaignsApi.create({
        name: newCampaign.name,
        type: contentTemplate ? 'template' : 'manual',
        channels: [newCampaign.channel],
        content: campaignContent,
        brandScore: contentTemplate?.brandScore,
      });

      if (response.success && response.data) {
        setCampaigns(prev => [transformCampaign(response.data!), ...prev]);
        setShowCreateModal(false);
        setNewCampaign({ name: '', description: '', channel: 'Email' });
        setContentTemplate(null);
      } else {
        setError(response.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle launch campaign (submit for review)
  const handleLaunch = async (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await campaignsApi.review(campaign.id);
      if (response.success) {
        // Refresh to get updated status
        fetchCampaigns();
      } else {
        setError(response.error || 'Failed to launch campaign');
      }
    } catch (err) {
      setError('Failed to launch campaign');
    }
  };

  // Handle pause campaign
  const handlePause = async (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await campaignsApi.pause(campaign.id);
      if (response.success) {
        setCampaigns(prev => prev.map(c =>
          c.id === campaign.id ? { ...c, status: 'paused' as const } : c
        ));
      } else {
        setError(response.error || 'Failed to pause campaign');
      }
    } catch (err) {
      setError('Failed to pause campaign');
    }
  };

  // Handle resume campaign
  const handleResume = async (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await campaignsApi.resume(campaign.id);
      if (response.success) {
        setCampaigns(prev => prev.map(c =>
          c.id === campaign.id ? { ...c, status: 'running' as const } : c
        ));
      } else {
        setError(response.error || 'Failed to resume campaign');
      }
    } catch (err) {
      setError('Failed to resume campaign');
    }
  };

  const getStatusConfig = (status: Campaign['status']) => {
    const configs = {
      draft: { icon: Clock, color: 'slate', label: 'Draft' },
      scheduled: { icon: Calendar, color: 'sky', label: 'Scheduled' },
      running: { icon: Play, color: 'emerald', label: 'Active' },
      completed: { icon: CheckCircle, color: 'teal', label: 'Completed' },
      paused: { icon: Pause, color: 'amber', label: 'Paused' },
    };
    return configs[status];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-slate-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[12px] text-red-600 font-semibold hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 mb-1">Campaigns</h1>
          <p className="text-[13px] text-slate-600">
            {campaigns.length} total campaigns • {campaigns.filter(c => c.status === 'running').length} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCampaigns}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
            title="Refresh"
            aria-label="Refresh campaigns"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
          />
        </div>
        <button className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
            <Mail className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-[15px] font-semibold text-slate-900 mb-2">
            {searchQuery ? 'No campaigns found' : 'No campaigns yet'}
          </h3>
          <p className="text-[13px] text-slate-600 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first campaign to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all"
            >
              Create Campaign
            </button>
          )}
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-3">
        {filteredCampaigns.map((campaign) => {
          const statusConfig = getStatusConfig(campaign.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign)}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                {/* Left: Campaign Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[15px] font-semibold text-slate-900">{campaign.name}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
                      ${statusConfig.color === 'emerald' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : ''}
                      ${statusConfig.color === 'sky' ? 'bg-sky-50 border border-sky-200 text-sky-700' : ''}
                      ${statusConfig.color === 'slate' ? 'bg-slate-50 border border-slate-200 text-slate-700' : ''}
                      ${statusConfig.color === 'amber' ? 'bg-amber-50 border border-amber-200 text-amber-700' : ''}
                      ${statusConfig.color === 'teal' ? 'bg-teal-50 border border-teal-200 text-teal-700' : ''}
                    `}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {campaign.audience.toLocaleString()} users
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {campaign.channel}
                    </span>
                    {campaign.startDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(campaign.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Performance Metrics */}
                  {campaign.performance && campaign.performance.opens > 0 && (
                    <div className="flex items-center gap-4 mt-3">
                      <div className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200">
                        <span className="text-[10px] text-sky-600 font-semibold uppercase tracking-wide">Opens</span>
                        <p className="text-[15px] font-bold text-sky-700">{campaign.performance.opens}%</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Clicks</span>
                        <p className="text-[15px] font-bold text-emerald-700">{campaign.performance.clicks}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {campaign.status === 'draft' && (
                    <button
                      onClick={(e) => handleLaunch(campaign, e)}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[12px] font-semibold hover:bg-sky-100 transition-all"
                    >
                      Launch
                    </button>
                  )}
                  {campaign.status === 'running' && (
                    <button
                      onClick={(e) => handlePause(campaign, e)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-all"
                      aria-label="Pause campaign"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={(e) => handleResume(campaign, e)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-all"
                      aria-label="Resume campaign"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <Tooltip text="Coming soon">
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 cursor-not-allowed"
                      aria-label="More actions - coming soon"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <Modal
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          title={selectedCampaign.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                {(() => {
                  const statusConfig = getStatusConfig(selectedCampaign.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold
                      ${statusConfig.color === 'emerald' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : ''}
                      ${statusConfig.color === 'sky' ? 'bg-sky-50 border border-sky-200 text-sky-700' : ''}
                      ${statusConfig.color === 'slate' ? 'bg-slate-50 border border-slate-200 text-slate-700' : ''}
                      ${statusConfig.color === 'amber' ? 'bg-amber-50 border border-amber-200 text-amber-700' : ''}
                      ${statusConfig.color === 'teal' ? 'bg-teal-50 border border-teal-200 text-teal-700' : ''}
                    `}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  );
                })()}
                {selectedCampaign.startDate && (
                  <span className="text-[13px] text-slate-600">
                    Started {new Date(selectedCampaign.startDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {selectedCampaign.status === 'draft' && (
                  <button
                    onClick={(e) => {
                      handleLaunch(selectedCampaign, e);
                      setSelectedCampaign(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all"
                  >
                    Launch Campaign
                  </button>
                )}
                {selectedCampaign.status === 'running' && (
                  <button
                    onClick={(e) => {
                      handlePause(selectedCampaign, e);
                      setSelectedCampaign(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 transition-all flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                {selectedCampaign.status === 'paused' && (
                  <button
                    onClick={(e) => {
                      handleResume(selectedCampaign, e);
                      setSelectedCampaign(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}
                <button className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all">
                  Edit
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Audience Size</p>
                <p className="text-[24px] font-bold text-slate-900">{selectedCampaign.audience.toLocaleString()}</p>
                <p className="text-[11px] text-slate-600 mt-1">Active users</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Channel</p>
                <p className="text-[16px] font-semibold text-slate-900">{selectedCampaign.channel}</p>
                <p className="text-[11px] text-slate-600 mt-1">Delivery method</p>
              </div>

              {selectedCampaign.performance && selectedCampaign.performance.opens > 0 && (
                <>
                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                    <p className="text-[11px] font-semibold text-sky-600 uppercase tracking-wide mb-2">Open Rate</p>
                    <p className="text-[24px] font-bold text-sky-700">{selectedCampaign.performance.opens}%</p>
                    <p className="text-[11px] text-sky-600 mt-1">Industry avg: 21%</p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">Click Rate</p>
                    <p className="text-[24px] font-bold text-emerald-700">{selectedCampaign.performance.clicks}%</p>
                    <p className="text-[11px] text-emerald-600 mt-1">Industry avg: 2.5%</p>
                  </div>
                </>
              )}
            </div>

            {/* Description and Objective */}
            {(selectedCampaign.description || selectedCampaign.objective) && (
              <div className="space-y-4">
                {selectedCampaign.description && (
                  <div>
                    <h4 className="text-[13px] font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{selectedCampaign.description}</p>
                  </div>
                )}

                {selectedCampaign.objective && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <h4 className="text-[13px] font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Campaign Subject
                    </h4>
                    <p className="text-[13px] text-emerald-700">{selectedCampaign.objective}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setContentTemplate(null);
        }}
        title="Create New Campaign"
        size="md"
      >
        <div className="space-y-4">
          {/* Content Template Badge */}
          {contentTemplate && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide">
                  Using Content Template
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-purple-900">{contentTemplate.name}</span>
                <span className="text-[11px] text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                  {contentTemplate.brandScore}% brand score
                </span>
              </div>
              <p className="text-[12px] text-purple-700 mt-1 line-clamp-2">
                {contentTemplate.content.body?.substring(0, 100)}...
              </p>
              <button
                onClick={() => setContentTemplate(null)}
                className="mt-2 text-[11px] text-purple-600 hover:text-purple-800 underline"
              >
                Remove template
              </button>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Campaign Name</label>
            <input
              type="text"
              placeholder="e.g., Spring Product Launch"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of campaign goals..."
              value={newCampaign.description}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Channel</label>
            <select
              value={newCampaign.channel}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, channel: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            >
              <option>Email</option>
              <option>SMS</option>
              <option>Push Notification</option>
              <option>Email + SMS</option>
              <option>Multi-channel</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreateCampaign}
              disabled={isSubmitting || !newCampaign.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
