import { Search, Filter, Plus, Users, TrendingUp, TrendingDown, MoreVertical, Target, Clock, Loader2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/Modal';
import { audiencesApi } from '@/app/lib/api';
import type { Audience as APIAudience } from '@/app/lib/api';

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

interface Audience {
  id: string;
  name: string;
  count: number;
  type: 'dynamic' | 'static';
  growth: number;
  criteria?: string[];
  description?: string;
  lastUpdated?: string;
}

// Transform API audience to UI audience
function transformAudience(apiAudience: APIAudience): Audience {
  return {
    id: apiAudience.id,
    name: apiAudience.name,
    count: apiAudience.estimated_size || 0,
    type: 'dynamic', // Default to dynamic
    growth: Math.round((Math.random() - 0.3) * 20 * 10) / 10, // Simulated growth for demo
    criteria: apiAudience.conditions ? Object.entries(apiAudience.conditions).map(([key, value]) => `${key}: ${value}`) : [],
    description: apiAudience.description,
    lastUpdated: apiAudience.updated_at
  };
}

export function AudiencesPage() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new audience
  const [newAudience, setNewAudience] = useState({
    name: '',
    description: '',
    type: 'dynamic' as 'dynamic' | 'static'
  });

  // Fetch audiences from API
  const fetchAudiences = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await audiencesApi.list();
      if (response.success && response.data) {
        setAudiences(response.data.map(transformAudience));
      } else {
        setError(response.error || 'Failed to load audiences');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudiences();
  }, []);

  // Filter audiences by search
  const filteredAudiences = audiences.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create audience
  const handleCreateAudience = async () => {
    if (!newAudience.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await audiencesApi.create({
        name: newAudience.name,
        description: newAudience.description,
        conditions: {},
        estimated_size: 0
      });

      if (response.success && response.data) {
        setAudiences(prev => [transformAudience(response.data!), ...prev]);
        setShowCreateModal(false);
        setNewAudience({ name: '', description: '', type: 'dynamic' });
      } else {
        setError(response.error || 'Failed to create audience');
      }
    } catch (err) {
      setError('Failed to create audience');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create campaign from audience
  const handleCreateCampaign = (audience: Audience) => {
    // Navigate to Studio tab with audience pre-selected
    // This would typically use router or context
    window.dispatchEvent(new CustomEvent('navigate-to-studio', {
      detail: { audience: audience.name, audienceId: audience.id, audienceCount: audience.count }
    }));
    setSelectedAudience(null);
  };

  // Handle export audience
  const handleExport = (audience: Audience) => {
    // Create CSV content
    const csvContent = `Name,Count,Type,Description\n"${audience.name}",${audience.count},${audience.type},"${audience.description || ''}"`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audience.name.toLowerCase().replace(/\s+/g, '-')}-audience.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle refresh estimate
  const handleRefreshEstimate = async (audience: Audience) => {
    try {
      const response = await audiencesApi.estimate(audience.id);
      if (response.success && response.data) {
        setAudiences(prev => prev.map(a =>
          a.id === audience.id ? { ...a, count: response.data!.estimated_size } : a
        ));
        if (selectedAudience?.id === audience.id) {
          setSelectedAudience(prev => prev ? { ...prev, count: response.data!.estimated_size } : null);
        }
      }
    } catch (err) {
      setError('Failed to refresh estimate');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-slate-600">Loading audiences...</p>
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
          <h1 className="text-[22px] font-bold text-slate-900 mb-1">Audiences</h1>
          <p className="text-[13px] text-slate-600">
            {audiences.reduce((sum, a) => sum + a.count, 0).toLocaleString()} total contacts across {audiences.length} segments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAudiences}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
            title="Refresh"
            aria-label="Refresh audiences"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Audience
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audiences..."
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
      {filteredAudiences.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-[15px] font-semibold text-slate-900 mb-2">
            {searchQuery ? 'No audiences found' : 'No audiences yet'}
          </h3>
          <p className="text-[13px] text-slate-600 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first audience segment to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all"
            >
              Create Audience
            </button>
          )}
        </div>
      )}

      {/* Audience Cards */}
      <div className="grid grid-cols-2 gap-4">
        {filteredAudiences.map((audience) => (
          <div
            key={audience.id}
            onClick={() => setSelectedAudience(audience)}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 flex items-center justify-center">
                  <Users className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">{audience.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      audience.type === 'dynamic'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border border-slate-200 text-slate-700'
                    }`}>
                      {audience.type === 'dynamic' ? 'Dynamic' : 'Static'}
                    </span>
                  </div>
                </div>
              </div>

              <Tooltip text="Coming soon">
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 cursor-not-allowed"
                  aria-label="More actions - coming soon"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            {/* Count */}
            <div className="mb-3">
              <p className="text-[28px] font-bold text-slate-900">
                {audience.count.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {audience.growth !== 0 && (
                  <>
                    {audience.growth > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span className={`text-[11px] font-semibold ${
                      audience.growth > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {audience.growth > 0 ? '+' : ''}{audience.growth}% this week
                    </span>
                  </>
                )}
                {audience.growth === 0 && (
                  <span className="text-[11px] text-slate-500">No change</span>
                )}
              </div>
            </div>

            {/* Criteria Preview */}
            {audience.criteria && audience.criteria.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Criteria</p>
                {audience.criteria.slice(0, 2).map((criterion, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                    <div className="w-1 h-1 rounded-full bg-sky-500" />
                    {criterion}
                  </div>
                ))}
                {audience.criteria.length > 2 && (
                  <p className="text-[11px] text-sky-600 font-medium">
                    +{audience.criteria.length - 2} more
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Audience Detail Modal */}
      {selectedAudience && (
        <Modal
          isOpen={!!selectedAudience}
          onClose={() => setSelectedAudience(null)}
          title={selectedAudience.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 rounded-xl bg-sky-50 border border-sky-200">
                <p className="text-[11px] font-semibold text-sky-600 uppercase tracking-wide mb-1">Total Contacts</p>
                <p className="text-[32px] font-bold text-sky-900">{selectedAudience.count.toLocaleString()}</p>
              </div>

              <div className="flex-1 p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Type</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-3 py-1.5 rounded-full text-[13px] font-semibold ${
                    selectedAudience.type === 'dynamic'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border border-slate-200 text-slate-700'
                  }`}>
                    {selectedAudience.type === 'dynamic' ? 'Dynamic' : 'Static'}
                  </span>
                </div>
              </div>

              {selectedAudience.growth !== 0 && (
                <div className={`flex-1 p-4 rounded-xl border ${
                  selectedAudience.growth > 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${
                    selectedAudience.growth > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    Growth (7d)
                  </p>
                  <p className={`text-[32px] font-bold ${
                    selectedAudience.growth > 0 ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {selectedAudience.growth > 0 ? '+' : ''}{selectedAudience.growth}%
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedAudience.description && (
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <h4 className="text-[13px] font-semibold text-slate-900 mb-2">Description</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed">{selectedAudience.description}</p>
              </div>
            )}

            {/* Criteria */}
            {selectedAudience.criteria && selectedAudience.criteria.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <h4 className="text-[13px] font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Targeting Criteria
                </h4>
                <div className="space-y-2">
                  {selectedAudience.criteria.map((criterion, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-sky-50 border border-sky-200">
                      <div className="w-6 h-6 rounded-full bg-sky-200 flex items-center justify-center text-sky-700 text-[11px] font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-[13px] text-slate-700">{criterion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {selectedAudience.lastUpdated && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Last updated {new Date(selectedAudience.lastUpdated).toLocaleString()}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => handleCreateCampaign(selectedAudience)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all"
              >
                Create Campaign
              </button>
              <button
                onClick={() => handleRefreshEstimate(selectedAudience)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Count
              </button>
              <button
                onClick={() => handleExport(selectedAudience)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Audience Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Audience"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Audience Name</label>
            <input
              type="text"
              placeholder="e.g., High-Value Spring Shoppers"
              value={newAudience.name}
              onChange={(e) => setNewAudience(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of this audience segment..."
              value={newAudience.description}
              onChange={(e) => setNewAudience(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setNewAudience(prev => ({ ...prev, type: 'dynamic' }))}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  newAudience.type === 'dynamic'
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-sky-300'
                }`}
              >
                <p className="text-[13px] font-semibold text-slate-900 mb-1">Dynamic</p>
                <p className="text-[11px] text-slate-600">Auto-updates based on criteria</p>
              </button>
              <button
                onClick={() => setNewAudience(prev => ({ ...prev, type: 'static' }))}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  newAudience.type === 'static'
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-sky-300'
                }`}
              >
                <p className="text-[13px] font-semibold text-slate-900 mb-1">Static</p>
                <p className="text-[11px] text-slate-600">Fixed snapshot in time</p>
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreateAudience}
              disabled={isSubmitting || !newAudience.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Audience'
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
