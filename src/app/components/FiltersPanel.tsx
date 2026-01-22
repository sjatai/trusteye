import { useState, memo } from 'react';
import {
  Search,
  Calendar,
  Tag,
  Filter as FilterIcon,
  List,
  BarChart3,
  FileText,
  Users as UsersIcon,
  ChevronRight,
  CheckCircle2,
  Mail,
  MessageSquare,
  Bell,
  Share2,
  Clock,
  Zap,
  Settings,
  Smartphone,
  Layout,
  Palette,
  Instagram,
  Linkedin,
  Twitter
} from 'lucide-react';

interface FiltersPanelProps {
  page: 'campaigns' | 'audiences' | 'content' | 'analytics' | 'automations' | 'integrations' | 'settings';
  onContentSectionChange?: (section: 'email' | 'sms' | 'social' | 'banners' | 'brandTone') => void;
}

interface FilterBlockProps {
  icon: React.ReactNode;
  title: string;
  options: string[];
  selectedOption?: string;
  onSelect?: (option: string) => void;
  defaultExpanded?: boolean;
}

function FilterBlock({
  icon,
  title,
  options,
  selectedOption,
  onSelect,
  defaultExpanded = false
}: FilterBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-2">
      {/* Filter Block Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between bg-white border-slate-200 hover:border-[#1E5ECC]/30 hover:shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0 text-[#1E5ECC]">{icon}</div>
          <div className="flex flex-col items-start">
            <span className="text-[13px] font-semibold text-slate-900">{title}</span>
            {selectedOption && (
              <span className="text-[10px] text-slate-500 mt-0.5">{selectedOption}</span>
            )}
          </div>
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="mt-1 ml-3 p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
          {/* Options List */}
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => onSelect?.(option)}
                className={`w-full px-3 py-2 text-left rounded-md text-[12px] transition-all ${
                  selectedOption === option
                    ? 'bg-[#E6F0FF] border border-[#B3D4FF] text-[#1E5ECC] font-semibold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const FiltersPanel = memo(function FiltersPanel({ page, onContentSectionChange }: FiltersPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('All Channels');
  const [selectedType, setSelectedType] = useState('All Segments');
  const [selectedSize, setSelectedSize] = useState('All Sizes');
  const [selectedContentType, setSelectedContentType] = useState('All Types');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 30 days');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('All Campaigns');
  const [selectedContentSection, setSelectedContentSection] = useState<string>('email');
  const [searchQuery, setSearchQuery] = useState('');

  const handleContentSectionClick = (section: 'email' | 'sms' | 'social' | 'banners' | 'brandTone') => {
    setSelectedContentSection(section);
    onContentSectionChange?.(section);
  };

  if (page === 'campaigns') {
    return (
      <div className="w-[280px] bg-white border-r border-slate-200 h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <List className="w-4 h-4 text-[#1E5ECC]" />
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
              Campaigns
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Filter and search campaigns
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-[#B3D4FF] focus:ring-2 focus:ring-[#1E5ECC]/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <FilterBlock
            icon={<FilterIcon className="w-4 h-4" />}
            title="Status"
            options={['All', 'Draft', 'Scheduled', 'Running', 'Completed', 'Paused']}
            selectedOption={selectedStatus}
            onSelect={setSelectedStatus}
            defaultExpanded={true}
          />

          {/* Channel Filter */}
          <FilterBlock
            icon={<Mail className="w-4 h-4" />}
            title="Channel"
            options={['All Channels', 'Email', 'SMS', 'Push', 'Social']}
            selectedOption={selectedChannel}
            onSelect={setSelectedChannel}
          />

          {/* Date Range */}
          <FilterBlock
            icon={<Calendar className="w-4 h-4" />}
            title="Date Range"
            options={['All Time', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom']}
            selectedOption="All Time"
            onSelect={() => {}}
          />
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Total Campaigns</span>
            <span className="font-semibold text-slate-900">247</span>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'audiences') {
    return (
      <div className="w-[280px] bg-white border-r border-slate-200 h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <UsersIcon className="w-4 h-4 text-[#1E5ECC]" />
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
              Audiences
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Filter and search segments
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search segments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-[#B3D4FF] focus:ring-2 focus:ring-[#1E5ECC]/20"
              />
            </div>
          </div>

          {/* Type Filter */}
          <FilterBlock
            icon={<Tag className="w-4 h-4" />}
            title="Type"
            options={['All Segments', 'Dynamic', 'Static', 'Imported']}
            selectedOption={selectedType}
            onSelect={setSelectedType}
            defaultExpanded={true}
          />

          {/* Size Filter */}
          <FilterBlock
            icon={<UsersIcon className="w-4 h-4" />}
            title="Size"
            options={['All Sizes', '< 10K', '10K - 50K', '50K - 100K', '> 100K']}
            selectedOption={selectedSize}
            onSelect={setSelectedSize}
          />

          {/* Engagement */}
          <FilterBlock
            icon={<BarChart3 className="w-4 h-4" />}
            title="Engagement"
            options={['All Levels', 'High', 'Medium', 'Low', 'Inactive']}
            selectedOption="All Levels"
            onSelect={() => {}}
          />
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Total Segments</span>
            <span className="font-semibold text-slate-900">89</span>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'content') {
    return (
      <div className="w-[280px] bg-white border-r border-slate-200 h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-[#1E5ECC]" />
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
              Content
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Filter and search content
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-[#B3D4FF] focus:ring-2 focus:ring-[#1E5ECC]/20"
              />
            </div>
          </div>

          {/* Section Navigation - Custom for Content page with preserved functionality */}
          <div className="mb-2">
            <button
              className="w-full px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between bg-white border-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#1E5ECC]" />
                <span className="text-[13px] font-semibold text-slate-900">Sections</span>
              </div>
            </button>
            <div className="mt-1 ml-3 p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="space-y-1">
                <button
                  onClick={() => handleContentSectionClick('email')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] transition-all text-left ${
                    selectedContentSection === 'email'
                      ? 'bg-[#E6F0FF] border border-[#B3D4FF] text-[#1E5ECC] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Mail className="w-4 h-4 text-purple-500" />
                  Email Templates
                </button>
                <button
                  onClick={() => handleContentSectionClick('sms')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] transition-all text-left ${
                    selectedContentSection === 'sms'
                      ? 'bg-[#E6F0FF] border border-[#B3D4FF] text-[#1E5ECC] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-teal-500" />
                  SMS Templates
                </button>
                <button
                  onClick={() => handleContentSectionClick('social')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] transition-all text-left ${
                    selectedContentSection === 'social'
                      ? 'bg-[#E6F0FF] border border-[#B3D4FF] text-[#1E5ECC] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-pink-500" />
                  Social Templates
                </button>
                {/* Social sub-channels */}
                {selectedContentSection === 'social' && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer">
                      <Instagram className="w-3.5 h-3.5 text-pink-500" />
                      Instagram
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer">
                      <Linkedin className="w-3.5 h-3.5 text-sky-600" />
                      LinkedIn
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer">
                      <Twitter className="w-3.5 h-3.5 text-slate-700" />
                      Twitter/X
                    </div>
                  </div>
                )}
                <button
                  onClick={() => handleContentSectionClick('banners')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] transition-all text-left ${
                    selectedContentSection === 'banners'
                      ? 'bg-[#E6F0FF] border border-[#B3D4FF] text-[#1E5ECC] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Layout className="w-4 h-4 text-sky-500" />
                  Web Banners
                </button>
                <button
                  onClick={() => handleContentSectionClick('brandTone')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] transition-all text-left ${
                    selectedContentSection === 'brandTone'
                      ? 'bg-[#E6F0FF] border border-[#B3D4FF] text-[#1E5ECC] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Palette className="w-4 h-4 text-amber-500" />
                  Brand Voice
                </button>
              </div>
            </div>
          </div>

          {/* Channel Filter */}
          <FilterBlock
            icon={<Mail className="w-4 h-4" />}
            title="Channel"
            options={['All Channels', 'Email', 'SMS', 'Push', 'Social']}
            selectedOption={selectedChannel}
            onSelect={setSelectedChannel}
          />

          {/* Status */}
          <FilterBlock
            icon={<CheckCircle2 className="w-4 h-4" />}
            title="Status"
            options={['All', 'Published', 'Draft', 'Archived']}
            selectedOption="All"
            onSelect={() => {}}
          />
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Total Assets</span>
            <span className="font-semibold text-slate-900">432</span>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'automations') {
    return (
      <div className="w-[280px] bg-white border-r border-slate-200 h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#1E5ECC]" />
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
              Automations
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Filter and search automations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search automations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-[#B3D4FF] focus:ring-2 focus:ring-[#1E5ECC]/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <FilterBlock
            icon={<FilterIcon className="w-4 h-4" />}
            title="Status"
            options={['All', 'Active', 'Paused', 'Draft', 'Completed']}
            selectedOption={selectedStatus}
            onSelect={setSelectedStatus}
            defaultExpanded={true}
          />

          {/* Type */}
          <FilterBlock
            icon={<Zap className="w-4 h-4" />}
            title="Type"
            options={['All Types', 'Journey', 'Trigger-based', 'Scheduled', 'API-driven']}
            selectedOption="All Types"
            onSelect={() => {}}
          />

          {/* Performance */}
          <FilterBlock
            icon={<BarChart3 className="w-4 h-4" />}
            title="Performance"
            options={['All', 'High Performance', 'Medium', 'Low', 'Needs Review']}
            selectedOption="All"
            onSelect={() => {}}
          />
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Active Automations</span>
            <span className="font-semibold text-slate-900">34</span>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'integrations') {
    return (
      <div className="w-[280px] bg-white border-r border-slate-200 h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="w-4 h-4 text-[#1E5ECC]" />
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
              Integrations
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Filter and search integrations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-[#B3D4FF] focus:ring-2 focus:ring-[#1E5ECC]/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <FilterBlock
            icon={<CheckCircle2 className="w-4 h-4" />}
            title="Status"
            options={['All', 'Connected', 'Not Connected', 'Error']}
            selectedOption={selectedStatus}
            onSelect={setSelectedStatus}
            defaultExpanded={true}
          />

          {/* Category */}
          <FilterBlock
            icon={<Tag className="w-4 h-4" />}
            title="Category"
            options={['All Categories', 'CRM', 'E-commerce', 'Analytics', 'Data Warehouse', 'Communication']}
            selectedOption="All Categories"
            onSelect={() => {}}
          />

          {/* Usage */}
          <FilterBlock
            icon={<BarChart3 className="w-4 h-4" />}
            title="Usage"
            options={['All', 'Frequently Used', 'Occasionally Used', 'Rarely Used', 'Never Used']}
            selectedOption="All"
            onSelect={() => {}}
          />
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Connected</span>
            <span className="font-semibold text-slate-900">12 / 45</span>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'settings') {
    return (
      <div className="w-[280px] bg-white border-r border-slate-200 h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-[#1E5ECC]" />
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
              Settings
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Configure your workspace
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-[#B3D4FF] focus:ring-2 focus:ring-[#1E5ECC]/20"
              />
            </div>
          </div>

          {/* Category Filter */}
          <FilterBlock
            icon={<Settings className="w-4 h-4" />}
            title="Category"
            options={['All Settings', 'Account', 'Team', 'Billing', 'Security', 'Notifications']}
            selectedOption="All Settings"
            onSelect={() => {}}
            defaultExpanded={true}
          />

          {/* Quick Actions */}
          <div className="mt-4 p-3 rounded-lg bg-[#E6F0FF] border border-[#B3D4FF]">
            <h3 className="text-[11px] font-semibold text-[#1E5ECC] uppercase tracking-wide mb-2">
              Quick Actions
            </h3>
            <div className="space-y-1.5">
              <button className="w-full px-2 py-1.5 text-left text-[11px] text-slate-700 hover:bg-white rounded transition-all">
                Invite Team Member
              </button>
              <button className="w-full px-2 py-1.5 text-left text-[11px] text-slate-700 hover:bg-white rounded transition-all">
                Update Billing
              </button>
              <button className="w-full px-2 py-1.5 text-left text-[11px] text-slate-700 hover:bg-white rounded transition-all">
                Download Data
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-[11px] text-slate-500">
            <div className="flex items-center justify-between mb-1">
              <span>Workspace</span>
              <span className="font-semibold text-slate-900">Enterprise</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Team Members</span>
              <span className="font-semibold text-slate-900">24</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'analytics') {
    return (
      <div className="w-[280px] bg-white border-r border-slate-200 h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-[#1E5ECC]" />
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
              Analytics
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Filter and analyze metrics
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Time Range Filter */}
          <FilterBlock
            icon={<Calendar className="w-4 h-4" />}
            title="Time Range"
            options={['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year', 'Custom range']}
            selectedOption={selectedTimeRange}
            onSelect={setSelectedTimeRange}
            defaultExpanded={true}
          />

          {/* Campaign Filter */}
          <FilterBlock
            icon={<List className="w-4 h-4" />}
            title="Campaigns"
            options={['All Campaigns', 'Email Only', 'SMS Only', 'Push Only', 'Multi-channel']}
            selectedOption={selectedCampaignFilter}
            onSelect={setSelectedCampaignFilter}
          />

          {/* Metrics - Checkboxes */}
          <div className="mb-2">
            <button
              className="w-full px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between bg-white border-slate-200 hover:border-[#1E5ECC]/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-[#1E5ECC]" />
                <span className="text-[13px] font-semibold text-slate-900">Metrics</span>
              </div>
            </button>
            <div className="mt-1 ml-3 p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="space-y-1">
                {['Opens', 'Clicks', 'Conversions', 'Revenue', 'Unsubscribes'].map((metric) => (
                  <label key={metric} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      defaultChecked={metric !== 'Unsubscribes'}
                      className="rounded border-slate-300 text-[#1E5ECC] focus:ring-[#1E5ECC]/20"
                    />
                    <span className="text-[12px] text-slate-700">{metric}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-[11px] text-slate-500">
            <div className="flex items-center justify-between mb-1">
              <span>Total Revenue</span>
              <span className="font-semibold text-slate-900">$2.4M</span>
            </div>
            <div className="flex items-center justify-between">
              <span>ROI</span>
              <span className="font-semibold text-emerald-600">+342%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
});
