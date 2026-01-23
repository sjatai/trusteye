import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, Plus, ChevronDown, X, FileText, Layout, Palette, Mail, Smartphone, Share2, Loader2 } from 'lucide-react';
import { ContentCard } from '../components/ContentCard';
import { ContentRow } from '../components/ContentRow';
import { ChannelBadge } from '../components/ChannelBadge';
import { BrandToneSection } from '../components/BrandToneSection';
import { contentLibrary, searchContent } from '../data/contentLibrary';
import { defaultBrandTone } from '../data/brandTone';
import { contentApi } from '../lib/api';
import type { ContentItem, ContentChannel, CampaignType, BrandTone } from '../types/content';
import { CHANNEL_CONFIG, CAMPAIGN_TYPE_CONFIG } from '../types/content';

interface ContentLibraryPageProps {
  onContentSelect?: (content: ContentItem | null) => void;
  scrollToSection?: 'email' | 'sms' | 'social' | 'banners' | 'brandTone' | null;
  contentItems?: ContentItem[];
  brandTone?: BrandTone;
  onBrandToneUpdate?: (tone: BrandTone) => void;
}

export function ContentLibraryPage({
  onContentSelect,
  scrollToSection: externalScrollRequest,
  contentItems,
  brandTone: externalBrandTone,
  onBrandToneUpdate,
}: ContentLibraryPageProps) {
  // State for API-loaded content
  const [apiContent, setApiContent] = useState<ContentItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(true);

  // Fetch content from API on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoadingApi(true);
        const response = await contentApi.list();
        if (response.success && response.data) {
          // Transform API data to ContentItem format
          const transformed: ContentItem[] = response.data.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type as 'template' | 'asset' | 'banner',
            channels: item.channels as ContentChannel[],
            campaignTypes: item.campaignTypes as CampaignType[],
            content: {
              subject: item.content.subject || '',
              body: item.content.body || item.content.post || item.content.message || '',
              cta: item.content.cta || 'Learn More',
            },
            brandScore: item.brandScore,
            performance: {
              timesUsed: item.performance?.timesUsed || 0,
              avgOpenRate: item.performance?.avgOpenRate || 0,
              avgClickRate: item.performance?.avgClickRate || 0,
              bestPerformingIn: item.performance?.bestPerformingIn || 'promotional',
              isMock: false,
            },
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          setApiContent(transformed);
        }
      } catch (error) {
        console.error('Failed to fetch content from API:', error);
      } finally {
        setIsLoadingApi(false);
      }
    };
    fetchContent();
  }, []);

  // Merge API content with provided contentItems and static library
  // Priority: API content (newest) > provided items > static library
  const contentSource = useMemo(() => {
    const combined = [...apiContent];
    // Add provided items that aren't already in API content
    if (contentItems) {
      contentItems.forEach(item => {
        if (!combined.find(c => c.id === item.id)) {
          combined.push(item);
        }
      });
    }
    // Add static library items that aren't already present
    contentLibrary.forEach(item => {
      if (!combined.find(c => c.id === item.id)) {
        combined.push(item);
      }
    });
    return combined;
  }, [apiContent, contentItems]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ContentChannel | 'all'>('all');
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType | 'all'>('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // Use external brand tone if provided, otherwise use local state
  const [localBrandTone, setLocalBrandTone] = useState(defaultBrandTone);
  const brandTone = externalBrandTone || localBrandTone;
  const handleBrandToneUpdate = (updates: Partial<BrandTone>) => {
    const newTone = { ...brandTone, ...updates };
    if (onBrandToneUpdate) {
      onBrandToneUpdate(newTone);
    } else {
      setLocalBrandTone(newTone);
    }
  };

  // Notify parent when content selection changes
  useEffect(() => {
    onContentSelect?.(selectedContent);
  }, [selectedContent, onContentSelect]);

  // Filter content based on search and filters
  const filteredContent = useMemo(() => {
    // Search function for contentSource
    const searchInContent = (query: string) => {
      const lowerQuery = query.toLowerCase();
      return contentSource.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.content.subject?.toLowerCase().includes(lowerQuery) ||
        item.content.body?.toLowerCase().includes(lowerQuery) ||
        item.campaignTypes.some(t => t.toLowerCase().includes(lowerQuery))
      );
    };
    let results = searchQuery ? searchInContent(searchQuery) : contentSource;

    if (selectedChannel !== 'all') {
      results = results.filter(item => item.channels.includes(selectedChannel));
    }

    if (selectedCampaignType !== 'all') {
      results = results.filter(item => item.campaignTypes.includes(selectedCampaignType));
    }

    return results;
  }, [searchQuery, selectedChannel, selectedCampaignType, contentSource]);

  // Group content by type and channel
  const emailTemplates = filteredContent.filter(item =>
    item.type === 'template' && item.channels.includes('email')
  );
  const smsTemplates = filteredContent.filter(item =>
    item.type === 'template' && item.channels.includes('sms') && !item.channels.includes('email')
  );
  // Social templates: Instagram, LinkedIn, Twitter (not Slack internal notifications)
  const socialTemplates = filteredContent.filter(item =>
    item.type === 'template' &&
    (item.channels.includes('instagram') || item.channels.includes('linkedin') || item.channels.includes('twitter'))
  );
  const banners = filteredContent.filter(item => item.type === 'banner');

  // Refs for section navigation
  const emailSectionRef = useRef<HTMLDivElement>(null);
  const smsSectionRef = useRef<HTMLDivElement>(null);
  const socialSectionRef = useRef<HTMLDivElement>(null);
  const bannersSectionRef = useRef<HTMLDivElement>(null);
  const brandToneSectionRef = useRef<HTMLDivElement>(null);

  // Section navigation
  const scrollToSection = (section: 'email' | 'sms' | 'social' | 'banners' | 'brandTone') => {
    const refs = {
      email: emailSectionRef,
      sms: smsSectionRef,
      social: socialSectionRef,
      banners: bannersSectionRef,
      brandTone: brandToneSectionRef,
    };
    refs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handle external scroll requests from FiltersPanel
  useEffect(() => {
    if (externalScrollRequest) {
      scrollToSection(externalScrollRequest);
    }
  }, [externalScrollRequest]);

  // Channels and campaign types for filters
  const channels: ContentChannel[] = ['email', 'sms', 'instagram', 'linkedin', 'twitter', 'slack', 'web-banner'];
  const campaignTypes: CampaignType[] = ['referral', 'recovery', 'winback', 'conquest', 'welcome', 'loyalty', 'service', 'birthday', 'seasonal'];

  const handleCreateCampaign = (content: ContentItem) => {
    // Dispatch event to navigate to AI Studio with template context
    const templateContext = {
      templateName: content.name,
      templateType: content.campaignTypes[0] || 'custom',
      channel: content.channels[0],
      subject: content.content.subject,
      body: content.content.body,
      brandScore: content.brandScore,
    };

    // Navigate to studio with template context
    window.dispatchEvent(new CustomEvent('openStudioWithTemplate', {
      detail: {
        content,
        templateContext,
        suggestedCommand: `Create a ${content.campaignTypes[0] || 'marketing'} campaign using the "${content.name}" template`,
      }
    }));
  };

  const clearFilters = () => {
    setSelectedChannel('all');
    setSelectedCampaignType('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedChannel !== 'all' || selectedCampaignType !== 'all' || searchQuery !== '';

  return (
    <div className="p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-[22px] font-bold text-slate-900 mb-1">Content Library</h1>
              <p className="text-[13px] text-slate-600">
                {filteredContent.length} content items • Multi-channel templates ready to use
              </p>
            </div>
            <button className="px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all flex items-center gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Create Content
            </button>
          </div>
        </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content by name, type, or campaign..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg border text-[13px] font-medium transition-all flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? 'bg-sky-50 border-sky-200 text-sky-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                {(selectedChannel !== 'all' ? 1 : 0) + (selectedCampaignType !== 'all' ? 1 : 0)}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            {/* Channel Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Channel
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedChannel('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    selectedChannel === 'all'
                      ? 'bg-sky-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                {channels.map(channel => (
                  <button
                    key={channel}
                    onClick={() => setSelectedChannel(channel)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      selectedChannel === channel
                        ? 'bg-sky-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{CHANNEL_CONFIG[channel].icon}</span>
                    {CHANNEL_CONFIG[channel].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Type Filter */}
            <div className="border-l border-slate-200 pl-4">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Campaign Type
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedCampaignType('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    selectedCampaignType === 'all'
                      ? 'bg-sky-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                {campaignTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedCampaignType(type)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      selectedCampaignType === type
                        ? 'bg-sky-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {CAMPAIGN_TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Templates Section */}
      {emailTemplates.length > 0 && (
        <div ref={emailSectionRef} className="mb-8 scroll-mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-purple-500" />
            <h2 className="text-[15px] font-semibold text-slate-900">
              Email Templates
              <span className="ml-2 text-[12px] font-normal text-slate-500">({emailTemplates.length})</span>
            </h2>
          </div>

          <div className="space-y-2">
            {emailTemplates.slice(0, 6).map((item) => (
              <ContentRow
                key={item.id}
                content={item}
                isSelected={selectedContent?.id === item.id}
                onClick={() => setSelectedContent(item)}
                onPreview={() => setSelectedContent(item)}
                onCreateCampaign={() => handleCreateCampaign(item)}
              />
            ))}
          </div>

          {emailTemplates.length > 6 && (
            <button className="mt-3 w-full py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              View all {emailTemplates.length} email templates
            </button>
          )}
        </div>
      )}

      {/* SMS Templates Section */}
      {smsTemplates.length > 0 && (
        <div ref={smsSectionRef} className="mb-8 scroll-mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-teal-500" />
            <h2 className="text-[15px] font-semibold text-slate-900">
              SMS Templates
              <span className="ml-2 text-[12px] font-normal text-slate-500">({smsTemplates.length})</span>
            </h2>
          </div>

          <div className="space-y-2">
            {smsTemplates.slice(0, 6).map((item) => (
              <ContentRow
                key={item.id}
                content={item}
                isSelected={selectedContent?.id === item.id}
                onClick={() => setSelectedContent(item)}
                onPreview={() => setSelectedContent(item)}
                onCreateCampaign={() => handleCreateCampaign(item)}
              />
            ))}
          </div>

          {smsTemplates.length > 6 && (
            <button className="mt-3 w-full py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              View all {smsTemplates.length} SMS templates
            </button>
          )}
        </div>
      )}

      {/* Social Templates (Instagram, LinkedIn, Twitter) */}
      {socialTemplates.length > 0 && (
        <div ref={socialSectionRef} className="mb-8 scroll-mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-pink-500" />
            <h2 className="text-[15px] font-semibold text-slate-900">
              Social Templates
              <span className="ml-2 text-[12px] font-normal text-slate-500">({socialTemplates.length})</span>
            </h2>
          </div>
          <p className="text-[12px] text-slate-500 mb-3">
            Social media posts for brand awareness and engagement
          </p>

          <div className="grid grid-cols-2 gap-4">
            {socialTemplates.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                isSelected={selectedContent?.id === item.id}
                onClick={() => setSelectedContent(item)}
                onPreview={() => setSelectedContent(item)}
                onCreateCampaign={() => handleCreateCampaign(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Banners Section */}
      {banners.length > 0 && (
        <div ref={bannersSectionRef} className="mb-8 scroll-mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Layout className="w-4 h-4 text-sky-500" />
            <h2 className="text-[15px] font-semibold text-slate-900">
              Web Banners
              <span className="ml-2 text-[12px] font-normal text-slate-500">({banners.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {banners.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                isSelected={selectedContent?.id === item.id}
                onClick={() => setSelectedContent(item)}
                onPreview={() => setSelectedContent(item)}
                onCreateCampaign={() => handleCreateCampaign(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-[15px] font-semibold text-slate-900 mb-2">No content found</h3>
          <p className="text-[13px] text-slate-600 mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Brand Tone Section */}
      <div ref={brandToneSectionRef} className="mt-8 scroll-mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-amber-500" />
          <h2 className="text-[15px] font-semibold text-slate-900">Brand Voice & Tone</h2>
        </div>
        <BrandToneSection
          brandTone={brandTone}
          onUpdate={handleBrandToneUpdate}
        />
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Content</p>
          <p className="text-[24px] font-bold text-slate-900">{contentSource.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Avg Brand Score</p>
          <p className="text-[24px] font-bold text-emerald-600">
            {contentSource.length > 0 ? Math.round(contentSource.reduce((acc, c) => acc + c.brandScore, 0) / contentSource.length) : 0}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email Templates</p>
          <p className="text-[24px] font-bold text-purple-600">
            {contentSource.filter(c => c.channels.includes('email')).length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">SMS Templates</p>
          <p className="text-[24px] font-bold text-sky-600">
            {contentSource.filter(c => c.channels.includes('sms')).length}
          </p>
        </div>
      </div>
    </div>
  );
}
