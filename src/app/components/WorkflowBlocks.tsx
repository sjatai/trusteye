import { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Send,
  Clock,
  FileText,
  CheckCircle2,
  Target,
  Sparkles,
  ChevronRight,
  Search,
  Plus,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface WorkflowBlockProps {
  icon: React.ReactNode;
  title: string;
  status: 'complete' | 'active' | 'pending' | 'warning';
  options?: string[];
  selectedOption?: string;
  customLabel?: string; // For dynamic audiences
  onSelect?: (option: string) => void;
  onCreateNew?: () => void;
  warningMessage?: string;
  warningAction?: { label: string; onClick: () => void };
}

function WorkflowBlock({
  icon,
  title,
  status,
  options = [],
  selectedOption,
  customLabel,
  onSelect,
  onCreateNew,
  warningMessage,
  warningAction
}: WorkflowBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = () => {
    if (status === 'complete') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (status === 'active') return 'bg-sky-50 border-sky-200 text-sky-700';
    if (status === 'warning') return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-slate-50 border-slate-200 text-slate-400';
  };

  const getStatusIcon = () => {
    if (status === 'complete') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    if (status === 'active') return <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />;
    if (status === 'warning') return <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
    return <div className="w-2 h-2 rounded-full bg-slate-300" />;
  };

  const displayLabel = customLabel || selectedOption;

  return (
    <div className="mb-2">
      {/* Compact Block Header */}
      <button
        onClick={() => options.length > 0 && setIsExpanded(!isExpanded)}
        className={`w-full px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between ${getStatusColor()} ${
          options.length > 0 ? 'hover:shadow-sm cursor-pointer' : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex flex-col items-start">
            <span className="text-[13px] font-semibold">{title}</span>
            {displayLabel && (
              <span className="text-[10px] opacity-70 mt-0.5 max-w-[160px] truncate">{displayLabel}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {options.length > 0 && (
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
        </div>
      </button>

      {/* Warning Message */}
      {status === 'warning' && warningMessage && (
        <div className="mt-1 ml-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-[11px] text-amber-700 mb-2">{warningMessage}</p>
          {warningAction && (
            <button
              onClick={warningAction.onClick}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all"
            >
              {warningAction.label}
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Expanded Options */}
      {isExpanded && options.length > 0 && (
        <div className="mt-1 ml-3 p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
          {/* Search */}
          <div className="mb-2 relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            />
          </div>

          {/* Options List - Scrollable */}
          <div className="max-h-[160px] overflow-y-auto space-y-1">
            {filteredOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect?.(option);
                  setIsExpanded(false);
                  setSearchQuery('');
                }}
                className={`w-full px-3 py-2 text-left rounded-md text-[12px] transition-all ${
                  selectedOption === option
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {option}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-center text-[11px] text-slate-400">
                No matches found
              </div>
            )}
          </div>

          {/* Create New Option */}
          {onCreateNew && (
            <>
              <div className="my-2 border-t border-slate-200" />
              <button
                onClick={() => {
                  onCreateNew();
                  setIsExpanded(false);
                }}
                className="w-full px-3 py-2 text-left rounded-md text-[12px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-all flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Create new {title.toLowerCase()}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Available channels (what's configured in integrations)
const AVAILABLE_CHANNELS = ['email', 'slack', 'sms', 'website'];

// Campaign type options
const CAMPAIGN_TYPES = [
  { value: 'new', label: '+ New Campaign' },
  { value: 'loyalty', label: 'Loyalty Campaign', isEventBased: true },
  { value: 'referral', label: 'Referral Campaign' },
  { value: 'recovery', label: 'Recovery Campaign' },
  { value: 'conquest', label: 'Conquest Campaign' },
  { value: 'win-back', label: 'Win-Back Campaign' },
  { value: 'promotional', label: 'Promotional Campaign' },
  { value: 'seasonal', label: 'Seasonal Campaign' },
];

// Event-based audience options (triggered by actions, not static lists)
const EVENT_BASED_AUDIENCES = [
  'Website Visitors',
  'Appointment Bookers',
  'Service Completers',
  'Purchase Events',
  'Review Submitters',
];

// Standard audience options
const STANDARD_AUDIENCES = [
  '5-Star Reviewers',
  'Negative Reviewers (1-2 stars)',
  'Inactive 90+ Days',
  'VIP Members',
  'High-Value Buyers',
  'Churn Risk Users',
  'New Subscribers',
  'Repeat Purchasers',
  'Cart Abandoners'
];

// Exported interface for workflow state
export type WorkflowState = {
  campaignType?: string;
  campaignName?: string;
  audience?: string;
  audienceDescription?: string; // Custom label from natural language
  audienceSize?: number;
  isEventBased?: boolean; // True for event-triggered campaigns (loyalty, etc.)
  messaging?: string;
  channel?: string;
  channels?: string[];
  timing?: string;
  content?: string;
  hasContent?: boolean;
  gateResults?: any[];
};

interface WorkflowBlocksProps {
  state?: WorkflowState;
  onStateChange?: (updates: Partial<WorkflowState>) => void;
  onNavigate?: (page: string) => void;
}

export function WorkflowBlocks({ state = {}, onStateChange, onNavigate }: WorkflowBlocksProps) {
  // Calculate completion status
  const hasCampaignType = !!state.campaignType && state.campaignType !== 'new';
  const hasAudience = !!state.audience || !!state.audienceDescription;
  const hasChannel = !!state.channel;
  const hasContent = !!state.hasContent;
  const hasGates = !!state.gateResults?.length;

  // Check for invalid channels
  const requestedChannels = state.channels || [];
  const invalidChannels = requestedChannels.filter(c => !AVAILABLE_CHANNELS.includes(c.toLowerCase()));
  const hasInvalidChannels = invalidChannels.length > 0;

  // Calculate progress
  const completedSteps = [hasCampaignType, hasAudience, hasChannel, hasContent].filter(Boolean).length;
  const totalSteps = 6;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  const handleCampaignTypeSelect = (value: string) => {
    const type = CAMPAIGN_TYPES.find(t => t.label === value);
    if (type) {
      onStateChange?.({
        campaignType: type.value,
        campaignName: type.label,
        isEventBased: type.isEventBased || false,
        // Clear audience when switching campaign types
        audience: undefined,
        audienceDescription: undefined,
        audienceSize: undefined,
      });
    }
  };

  const handleAudienceSelect = (value: string) => {
    onStateChange?.({ audience: value, audienceDescription: value });
  };

  const handleChannelSelect = (value: string) => {
    // Parse channel selection
    let channels: string[] = [];
    if (value.includes('Email')) channels.push('email');
    if (value.includes('SMS')) channels.push('sms');
    if (value.includes('Push')) channels.push('push');
    if (value.includes('Website')) channels.push('website');
    if (value.includes('All')) channels = ['email', 'sms', 'push', 'website'];

    onStateChange?.({ channel: value, channels });
  };

  const handleTimingSelect = (value: string) => {
    onStateChange?.({ timing: value });
  };

  // Channel options
  const channelOptions = [
    'Email Only',
    'SMS Only',
    'Slack Notification',
    'Website Banner',
    'Email + SMS',
    'Email + Website',
    'Email + Slack',
    'Multi-channel (All)'
  ];

  // Different timing options for event-based vs regular campaigns
  const isEventBased = state.isEventBased || CAMPAIGN_TYPES.find(t => t.value === state.campaignType)?.isEventBased;

  const timingOptions = isEventBased ? [
    'Ongoing (Always Active)',
    'Next 7 Days',
    'Next 30 Days',
    'Next 90 Days',
    'Custom Duration'
  ] : [
    'Send Immediately',
    'Schedule for Tomorrow',
    'Schedule for Weekend',
    'Optimal Send Time (AI)',
    'Custom Schedule'
  ];

  // Build audience options based on campaign type
  const baseAudiences = isEventBased ? EVENT_BASED_AUDIENCES : STANDARD_AUDIENCES;
  const audienceOptions = state.audienceDescription && !baseAudiences.includes(state.audienceDescription)
    ? [state.audienceDescription, ...baseAudiences]
    : baseAudiences;

  return (
    <div className="w-[280px] h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Sticky Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
            Campaign Builder
          </h2>
        </div>
        <p className="text-[11px] text-slate-500">
          Configure step-by-step or use commands
        </p>
      </div>

      {/* Scrollable Workflow Blocks - Compact */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Campaign Type Selector (was Goal) */}
        <WorkflowBlock
          icon={<Target className="w-4 h-4" />}
          title="Campaign Type"
          status={hasCampaignType ? 'complete' : 'active'}
          options={CAMPAIGN_TYPES.map(t => t.label)}
          selectedOption={state.campaignName || (state.campaignType ? CAMPAIGN_TYPES.find(t => t.value === state.campaignType)?.label : undefined)}
          onSelect={handleCampaignTypeSelect}
        />

        {/* Audience */}
        <WorkflowBlock
          icon={<Users className="w-4 h-4" />}
          title="Audience"
          status={hasAudience ? 'complete' : hasCampaignType ? 'active' : 'pending'}
          options={audienceOptions}
          selectedOption={state.audience}
          customLabel={state.audienceDescription}
          onSelect={handleAudienceSelect}
          onCreateNew={() => onNavigate?.('audiences')}
        />

        {/* Audience Size Badge - different for event-based */}
        {hasAudience && (
          isEventBased ? (
            <div className="ml-3 mb-2 -mt-1 px-2 py-1 rounded bg-sky-50 border border-sky-200 inline-flex items-center gap-1">
              <Target className="w-3 h-3 text-sky-600" />
              <span className="text-[10px] font-semibold text-sky-700">
                Event-triggered
              </span>
            </div>
          ) : state.audienceSize && state.audienceSize > 0 ? (
            <div className="ml-3 mb-2 -mt-1 px-2 py-1 rounded bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-700">
                {state.audienceSize.toLocaleString()} customers
              </span>
            </div>
          ) : null
        )}

        {/* Messaging/Campaign Name */}
        <WorkflowBlock
          icon={<MessageSquare className="w-4 h-4" />}
          title="Messaging"
          status={state.messaging ? 'complete' : hasAudience ? 'active' : 'pending'}
          selectedOption={state.messaging}
        />

        {/* Channel - with validation */}
        <WorkflowBlock
          icon={<Send className="w-4 h-4" />}
          title="Channel"
          status={hasInvalidChannels ? 'warning' : hasChannel ? 'complete' : state.messaging ? 'active' : 'pending'}
          options={channelOptions}
          selectedOption={state.channel}
          onSelect={handleChannelSelect}
          warningMessage={hasInvalidChannels
            ? `"${invalidChannels.join(', ')}" not configured. Available: ${AVAILABLE_CHANNELS.join(', ')}`
            : undefined}
          warningAction={hasInvalidChannels ? {
            label: 'Go to Integrations',
            onClick: () => onNavigate?.('integrations')
          } : undefined}
        />

        {/* Timing */}
        <WorkflowBlock
          icon={<Clock className="w-4 h-4" />}
          title="Timing"
          status={state.timing ? 'complete' : hasChannel ? 'active' : 'pending'}
          options={timingOptions}
          selectedOption={state.timing}
          onSelect={handleTimingSelect}
        />

        {/* Content */}
        <WorkflowBlock
          icon={<FileText className="w-4 h-4" />}
          title="Content"
          status={hasContent ? 'complete' : state.timing || hasChannel ? 'active' : 'pending'}
          selectedOption={hasContent ? 'Generated' : undefined}
          onCreateNew={() => onNavigate?.('content')}
        />

        {/* Review */}
        <WorkflowBlock
          icon={<CheckCircle2 className="w-4 h-4" />}
          title="Review"
          status={hasGates ? 'complete' : hasContent ? 'active' : 'pending'}
          selectedOption={hasGates ? '3-Gate Passed' : undefined}
        />

        {/* Approve & Launch */}
        <WorkflowBlock
          icon={<Sparkles className="w-4 h-4" />}
          title="Approve & Launch"
          status={hasGates ? 'active' : 'pending'}
        />
      </div>

      {/* Footer Stats */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-slate-900">{completedSteps} of {totalSteps} steps</span>
        </div>
        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
