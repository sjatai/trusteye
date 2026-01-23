import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { WorkflowBlocks } from './components/WorkflowBlocks';
import type { WorkflowState } from './components/WorkflowBlocks';
import { FiltersPanel } from './components/FiltersPanel';
import { CommandBox } from './components/CommandBox';
import { ConversationFeed } from './components/ConversationFeed';
import { InspectorPanel } from './components/InspectorPanel';
import { LoginPage } from './pages/Login';

// Lazy load pages for better initial load performance
const CampaignsPage = lazy(() => import('./pages/Campaigns').then(m => ({ default: m.CampaignsPage })));
const AudiencesPage = lazy(() => import('./pages/Audiences').then(m => ({ default: m.AudiencesPage })));
const ContentLibraryPage = lazy(() => import('./pages/ContentLibrary').then(m => ({ default: m.ContentLibraryPage })));
const AutomationsPage = lazy(() => import('./pages/Automations').then(m => ({ default: m.AutomationsPage })));
const IntegrationsPage = lazy(() => import('./pages/Integrations').then(m => ({ default: m.IntegrationsPage })));
const AnalyticsPage = lazy(() => import('./pages/Analytics').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));

// Page loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E5ECC]"></div>
  </div>
);
import { aiApi, campaignsApi, audiencesApi, rulesApi, analyticsApi, contentApi, imageApi } from './lib/api';
import type { AISuggestion, GeneratedContent, ContentLibraryItem } from './lib/api';
import { ContentPreviewPanel } from './components/ContentPreviewPanel';
import type { ContentItem, ContentChannel, CampaignType, BrandTone } from './types/content';
import { contentLibrary as initialContentLibrary } from './data/contentLibrary';
import { defaultBrandTone } from './data/brandTone';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

// Available channels configured in integrations
const AVAILABLE_CHANNELS = ['email', 'slack', 'sms', 'website'];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Skip login for demo
  const [userName, setUserName] = useState('');
  const [activePage, setActivePage] = useState('studio');
  // Per-page message history - each page has its own conversation
  const [pageMessages, setPageMessages] = useState<Record<string, Message[]>>({
    studio: [],
    campaigns: [],
    audiences: [],
    content: [],
    automations: [],
    integrations: [],
    analytics: [],
    settings: [],
  });
  const [commandPosition, setCommandPosition] = useState<'top' | 'bottom'>('bottom');

  // Helper to get current page's messages
  const messages = pageMessages[activePage] || [];

  // Helper to add message to current page
  const addMessage = (message: Message) => {
    setPageMessages(prev => ({
      ...prev,
      [activePage]: [...(prev[activePage] || []), message]
    }));
  };

  // Helper to set messages for current page (for filtering/replacing)
  const setMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    setPageMessages(prev => ({
      ...prev,
      [activePage]: typeof updater === 'function' ? updater(prev[activePage] || []) : updater
    }));
  };
  const [inspectorData, setInspectorData] = useState<any>(null);
  const [inspectorType, setInspectorType] = useState<'campaign' | 'segment' | 'content' | 'empty'>('empty');
  const [workflowState, setWorkflowState] = useState<WorkflowState>({});
  const [creationMode, setCreationMode] = useState<'none' | 'audience' | 'content' | 'campaign'>('none');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
  const [contentSectionScroll, setContentSectionScroll] = useState<'email' | 'sms' | 'social' | 'banners' | 'brandTone' | null>(null);
  const [dynamicContentLibrary, setDynamicContentLibrary] = useState<ContentItem[]>(initialContentLibrary);
  const [brandTone, setBrandTone] = useState<BrandTone>(defaultBrandTone);

  // Handle workflow state changes from WorkflowBlocks
  const handleWorkflowStateChange = (updates: Partial<WorkflowState>) => {
    setWorkflowState(prev => ({ ...prev, ...updates }));

    // Also update currentCampaign and inspectorData when audience is selected
    if (updates.audience || updates.audienceDescription) {
      const audienceUpdate = {
        audienceDescription: updates.audienceDescription || updates.audience,
        audienceName: updates.audience,
        audienceSize: updates.audienceSize || 500, // Default estimate
      };

      if (currentCampaign) {
        const updatedCampaign = { ...currentCampaign, ...audienceUpdate };
        setCurrentCampaign(updatedCampaign);
        setInspectorData(updatedCampaign);
      }

      // Add confirmation message
      const audienceMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `**Audience Selected:** ${updates.audienceDescription || updates.audience}\n\n${currentCampaign?.content ? 'Ready to submit for review! Click "Submit for 3-Gate Approval" or say "review".' : 'Next: Generate content or say "generate content".'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, audienceMsg]);
    }

    // Also update when channel is selected
    if (updates.channel || updates.channels) {
      if (currentCampaign) {
        const updatedCampaign = {
          ...currentCampaign,
          channel: updates.channel,
          channels: updates.channels || [updates.channel?.toLowerCase()],
        };
        setCurrentCampaign(updatedCampaign);
        setInspectorData(updatedCampaign);
      }
    }
  };

  /**
   * CONTEXT-AWARE WORKFLOW SYSTEM
   * =============================
   * These helpers determine current state and suggest next actions.
   */
  type WorkflowStage =
    | 'no_campaign'        // No campaign started
    | 'campaign_created'   // Campaign exists but no content
    | 'content_ready'      // Content generated, not reviewed
    | 'reviewing'          // Review in progress
    | 'gate_failed'        // Gate 1 or 2 failed
    | 'awaiting_approval'  // Gates 1&2 passed, waiting for human
    | 'approved'           // All gates passed, ready to publish
    | 'published';         // Campaign sent

  const getCurrentWorkflowStage = (): WorkflowStage => {
    if (!currentCampaign) return 'no_campaign';

    const gateResults = currentCampaign.gateResults || [];
    const gate1 = gateResults.find((g: any) => g.gate === 1);
    const gate2 = gateResults.find((g: any) => g.gate === 2);
    const gate3 = gateResults.find((g: any) => g.gate === 3);

    // Check if published
    if (currentCampaign.status === 'completed' || currentCampaign.status === 'running') {
      return 'published';
    }

    // Check gate status
    if (gate1?.passed === false || gate2?.passed === false) {
      return 'gate_failed';
    }

    if (gate1?.passed && gate2?.passed && gate3?.passed) {
      return 'approved';
    }

    if (gate1?.passed && gate2?.passed) {
      return 'awaiting_approval';
    }

    // Check if has content
    if (!currentCampaign.content?.body) {
      return 'campaign_created';
    }

    // Has content but no gate results
    if (gateResults.length === 0) {
      return 'content_ready';
    }

    return 'content_ready';
  };

  const getContextSummary = (): string => {
    const stage = getCurrentWorkflowStage();

    switch (stage) {
      case 'no_campaign':
        return '**No campaign in progress.**\n\nStart by creating a campaign or clicking an AI Suggestion.';

      case 'campaign_created':
        return `**Campaign:** ${currentCampaign.name}\n**Stage:** Content needed\n**Audience:** ${currentCampaign.audienceDescription || 'Set'}\n**Channel:** ${currentCampaign.channel || 'Email'}\n\n→ Say **"generate content"** or **"yes"** to continue.`;

      case 'content_ready':
        return `**Campaign:** ${currentCampaign.name}\n**Stage:** Ready for review\n**Subject:** ${currentCampaign.content?.subject || 'N/A'}\n\n→ Say **"review"** or **"publish"** to submit for approval.`;

      case 'gate_failed': {
        const gateResults = currentCampaign.gateResults || [];
        const failedGate = gateResults.find((g: any) => !g.passed);
        return `**Campaign:** ${currentCampaign.name}\n**Stage:** Gate ${failedGate?.gate || '?'} failed\n**Issue:** Content needs revision\n\n→ Click **"Edit Content & Fix"** or say **"fix it"**.`;
      }

      case 'awaiting_approval':
        return `**Campaign:** ${currentCampaign.name}\n**Stage:** Awaiting human approval\n**Gates 1 & 2:** Passed\n\n→ Click **"Approve"** in the panel or say **"approve"**.`;

      case 'approved':
        return `**Campaign:** ${currentCampaign.name}\n**Stage:** Approved - Ready to publish!\n**All Gates:** Passed\n\n→ Say **"publish"** or **"execute"** to send.`;

      case 'published':
        return `**Campaign:** ${currentCampaign.name}\n**Stage:** Published!\n**Status:** Sent/Running\n\n→ Check your inbox or say **"show receipt"**.`;

      default:
        return 'Unknown state. Try creating a new campaign.';
    }
  };

  const getNextStepHint = (): string => {
    const stage = getCurrentWorkflowStage();

    switch (stage) {
      case 'no_campaign':
        return 'Create a campaign to get started';
      case 'campaign_created':
        return 'Generate content';
      case 'content_ready':
        return 'Submit for review';
      case 'gate_failed':
        return 'Fix the content issues';
      case 'awaiting_approval':
        return 'Approve or reject the campaign';
      case 'approved':
        return 'Publish the campaign';
      case 'published':
        return 'Campaign sent! Create another?';
      default:
        return '';
    }
  };

  // Dynamic placeholder for CommandBox based on workflow stage
  const getCommandPlaceholder = (): string => {
    const stage = getCurrentWorkflowStage();

    switch (stage) {
      case 'no_campaign':
        return 'Create a referral campaign for 5-star reviewers...';
      case 'campaign_created':
        return 'Say "generate content" or "yes" to continue...';
      case 'content_ready':
        return 'Say "review" or "publish" to submit for approval...';
      case 'gate_failed':
        return 'Say "fix it" to auto-correct, or edit manually...';
      case 'awaiting_approval':
        return 'Say "approve" or use the buttons in the panel...';
      case 'approved':
        return 'Say "publish" or "execute" to send the campaign...';
      case 'published':
        return 'Campaign sent! Create another campaign...';
      default:
        return 'What do you want to achieve today?';
    }
  };

  /**
   * CONTEXT-AWARE ROUTING SYSTEM
   * ============================
   * Determines where commands should be routed and what context to preserve.
   */
  type PrimaryIntent = 'campaign' | 'content' | 'audience' | 'automation' | 'analytics' | 'integration' | 'chat';
  type TargetPage = 'studio' | 'campaigns' | 'audiences' | 'content' | 'automations' | 'analytics' | 'integrations';

  interface RoutingDecision {
    primaryIntent: PrimaryIntent;
    targetPage: TargetPage;
    shouldNavigate: boolean;
    preservedContext: {
      audience?: string;
      content?: string;
      campaignType?: string;
      channels?: string[];
    };
    nextActionSuggestion: string;
  }

  // Detect primary intent from command
  const detectPrimaryIntent = (query: string): PrimaryIntent => {
    const lowerQuery = query.toLowerCase();
    const hasCreate = lowerQuery.includes('create') || lowerQuery.includes('make') || lowerQuery.includes('generate') || lowerQuery.includes('build');

    // Explicit keywords take priority
    if (lowerQuery.includes('campaign')) return 'campaign';
    if (lowerQuery.includes('audience') || lowerQuery.includes('segment')) return 'audience';
    if (lowerQuery.includes('automation') || lowerQuery.includes('rule') || lowerQuery.includes('when ')) return 'automation';
    if (lowerQuery.includes('analytics') || lowerQuery.includes('performance') || lowerQuery.includes('metrics')) return 'analytics';
    if (lowerQuery.includes('integration') || lowerQuery.includes('connect')) return 'integration';

    // Content signals (without campaign)
    if (hasCreate && (lowerQuery.includes('template') || lowerQuery.includes('content') ||
        lowerQuery.includes('post') || lowerQuery.includes('instagram') ||
        lowerQuery.includes('linkedin') || lowerQuery.includes('twitter') ||
        lowerQuery.includes('social') || lowerQuery.includes('email') || lowerQuery.includes('sms'))) {
      return 'content';
    }

    // If just "create" without clear context, return 'ambiguous' to trigger follow-up
    if (hasCreate && !lowerQuery.includes('campaign') && !lowerQuery.includes('audience') &&
        !lowerQuery.includes('content') && !lowerQuery.includes('template')) {
      return 'chat'; // Will handle with follow-up question
    }

    return 'chat';
  };

  // Check if command needs clarification
  const needsClarification = (query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const hasCreate = lowerQuery.includes('create') || lowerQuery.includes('make') || lowerQuery.includes('build');

    // "create" without clear target needs clarification
    if (hasCreate) {
      const hasTarget = lowerQuery.includes('campaign') || lowerQuery.includes('audience') ||
                        lowerQuery.includes('content') || lowerQuery.includes('template') ||
                        lowerQuery.includes('post') || lowerQuery.includes('email') ||
                        lowerQuery.includes('sms') || lowerQuery.includes('automation') ||
                        lowerQuery.includes('rule') || lowerQuery.includes('instagram') ||
                        lowerQuery.includes('social');
      return !hasTarget;
    }
    return false;
  };

  // Map intent to target page
  const getTargetPage = (intent: PrimaryIntent): TargetPage => {
    switch (intent) {
      case 'campaign': return 'studio';
      case 'content': return 'content';
      case 'audience': return 'audiences';
      case 'automation': return 'automations';
      case 'analytics': return 'analytics';
      case 'integration': return 'integrations';
      default: return activePage as TargetPage; // Stay on current page for chat
    }
  };

  // Determine routing decision
  const getRoutingDecision = (query: string): RoutingDecision => {
    const lowerQuery = query.toLowerCase();
    const primaryIntent = detectPrimaryIntent(query);
    const targetPage = getTargetPage(primaryIntent);

    // Extract context from query
    const preservedContext: RoutingDecision['preservedContext'] = {};

    // Extract audience mention
    const audiencePatterns = [
      /(?:for|targeting|to)\s+(.+?)\s+(?:customers?|users?|audience)/i,
      /audience[:\s]+["']?([^"']+)["']?/i,
    ];
    for (const pattern of audiencePatterns) {
      const match = query.match(pattern);
      if (match) {
        preservedContext.audience = match[1].trim();
        break;
      }
    }

    // Extract content/template mention
    if (lowerQuery.includes('with') && (lowerQuery.includes('content') || lowerQuery.includes('template'))) {
      const contentMatch = query.match(/with\s+(?:the\s+)?["']?(.+?)["']?\s+(?:content|template)/i);
      if (contentMatch) {
        preservedContext.content = contentMatch[1].trim();
      }
    }

    // Extract campaign type
    const campaignTypes = ['referral', 'recovery', 'conquest', 'winback', 'win-back', 'loyalty', 'service', 'welcome', 'birthday', 'holiday'];
    for (const type of campaignTypes) {
      if (lowerQuery.includes(type)) {
        preservedContext.campaignType = type.replace('-', '');
        break;
      }
    }

    // Determine if navigation is needed
    // Don't navigate if:
    // 1. Already on the target page
    // 2. Primary intent is campaign and we have a campaign in progress (stay to continue)
    // 3. Primary intent is content but we have a campaign in progress (generate content for campaign)
    // 4. It's a general chat/question
    const shouldNavigate =
      primaryIntent !== 'chat' &&
      activePage !== targetPage &&
      !(primaryIntent === 'campaign' && currentCampaign && activePage === 'studio') &&
      !(primaryIntent === 'content' && currentCampaign && activePage === 'studio');

    // Generate next action suggestion based on intent
    let nextActionSuggestion = '';
    switch (primaryIntent) {
      case 'campaign':
        nextActionSuggestion = 'After creating, say "generate content" to create the message.';
        break;
      case 'content':
        nextActionSuggestion = 'After creating, say "save to library" or "create campaign" to use it.';
        break;
      case 'audience':
        nextActionSuggestion = 'After creating, say "create campaign for this audience" to target them.';
        break;
      case 'automation':
        nextActionSuggestion = 'After creating, the rule will run automatically when triggered.';
        break;
      default:
        nextActionSuggestion = '';
    }

    return {
      primaryIntent,
      targetPage,
      shouldNavigate,
      preservedContext,
      nextActionSuggestion,
    };
  };

  // Navigate with context preservation
  const navigateWithContext = (decision: RoutingDecision) => {
    if (decision.shouldNavigate) {
      // Store context before navigating
      if (decision.preservedContext.audience) {
        setWorkflowState(prev => ({ ...prev, audienceDescription: decision.preservedContext.audience }));
      }
      if (decision.preservedContext.campaignType) {
        setWorkflowState(prev => ({ ...prev, campaignType: decision.preservedContext.campaignType }));
      }

      // Navigate to target page
      setActivePage(decision.targetPage);

      // Add navigation message to target page's conversation
      const navMsg: Message = {
        id: `nav-${Date.now()}`,
        type: 'system',
        content: `Navigated to ${decision.targetPage.charAt(0).toUpperCase() + decision.targetPage.slice(1)}${decision.preservedContext.audience ? ` with audience: "${decision.preservedContext.audience}"` : ''}`,
        timestamp: new Date(),
      };
      setPageMessages(prev => ({
        ...prev,
        [decision.targetPage]: [...(prev[decision.targetPage] || []), navMsg]
      }));
    }
  };

  // Get next action based on current state and what was just done
  const getNextActionForContext = (action: string): string => {
    const stage = getCurrentWorkflowStage();

    // Action-specific suggestions
    if (action === 'content_generated') {
      return '\n\n**Next:** Say **"save to library"** to store it, or **"create campaign"** to use it now.';
    }
    if (action === 'content_saved') {
      return '\n\n**Next:** Go to **Content Library** to view it, or say **"create campaign with this content"**.';
    }
    if (action === 'audience_created') {
      return '\n\n**Next:** Say **"create campaign for this audience"** to target them.';
    }
    if (action === 'campaign_created') {
      return '\n\n**Next:** Say **"generate content"** or **"yes"** to create the message.';
    }
    if (action === 'campaign_content_ready') {
      return '\n\n**Next:** Say **"review"** or **"publish"** to submit for approval.';
    }
    if (action === 'campaign_approved') {
      return '\n\n**Next:** Say **"publish"** or **"execute"** to send the campaign.';
    }
    if (action === 'campaign_published') {
      return '\n\n**Done!** Check your inbox. Say **"show receipt"** for compliance proof, or **"create new campaign"** to start another.';
    }

    // Stage-based fallback
    switch (stage) {
      case 'campaign_created':
        return '\n\n**Next:** Say **"generate content"** to continue.';
      case 'content_ready':
        return '\n\n**Next:** Say **"review"** to submit for approval.';
      case 'awaiting_approval':
        return '\n\n**Next:** Check Slack for approval notification.';
      case 'approved':
        return '\n\n**Next:** Say **"publish"** to send.';
      default:
        return '';
    }
  };

  // Navigate to a different page
  const handleNavigate = (page: string) => {
    setActivePage(page);
  };

  // Handle sidebar page change - special logic for AI Studio
  const handlePageChange = (page: string) => {
    // Always clear selectedContentItem when navigating away from Content page
    if (activePage === 'content' && page !== 'content') {
      setSelectedContentItem(null);
    }

    if (page === 'studio') {
      // Check if there's a draft campaign (not published/executed)
      const hasDraftCampaign = currentCampaign &&
        currentCampaign.status !== 'published' &&
        currentCampaign.status !== 'executed' &&
        currentCampaign.status !== 'completed';

      if (hasDraftCampaign) {
        // Restore campaign inspector when returning to studio with draft campaign
        setInspectorType('campaign');
        setInspectorData({
          id: currentCampaign.id,
          name: currentCampaign.name,
          type: currentCampaign.type,
          status: currentCampaign.status,
          content: currentCampaign.content,
          channels: currentCampaign.channels,
          gateResults: currentCampaign.gate_results,
          metrics: currentCampaign.metrics,
        });
        setActivePage('studio');
      } else {
        // Reset to initial state with AI suggestions
        setCurrentCampaign(null);
        setInspectorData(null);
        setInspectorType('empty');
        setWorkflowState({});
        setGeneratedContent(null);
        // Clear studio messages to show fresh suggestions
        setPageMessages(prev => ({ ...prev, studio: [] }));
        setActivePage('studio');
      }
    } else {
      setActivePage(page);
    }
  };

  // Fetch AI suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Handle URL-based campaign loading (for Slack preview links)
  useEffect(() => {
    const loadCampaignFromURL = async () => {
      const path = window.location.pathname;
      const campaignMatch = path.match(/\/campaigns\/([a-f0-9-]+)/i);

      if (campaignMatch) {
        const campaignId = campaignMatch[1];
        try {
          const response = await campaignsApi.get(campaignId);
          if (response.success && response.data) {
            const campaign = response.data;
            setCurrentCampaign(campaign);
            setActivePage('studio');

            // Set up inspector with campaign details
            setInspectorType('campaign');
            setInspectorData({
              id: campaign.id,
              name: campaign.name,
              type: campaign.type,
              status: campaign.status,
              content: campaign.content,
              channels: campaign.channels,
              gateResults: campaign.gate_results,
              metrics: campaign.metrics,
            });

            // Update workflow state
            setWorkflowState({
              campaignType: campaign.type,
              campaignName: campaign.name,
              channel: campaign.channels?.[0] || 'email',
              channels: campaign.channels,
              hasContent: !!campaign.content?.body,
              gateResults: campaign.gate_results,
            });

            // Add a message showing the campaign preview
            const previewMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**Campaign Preview: ${campaign.name}**\n\n**Type:** ${campaign.type}\n**Status:** ${campaign.status}\n**Channels:** ${campaign.channels?.join(', ') || 'Email'}\n\n${campaign.content?.subject ? `**Subject:** ${campaign.content.subject}\n\n` : ''}${campaign.content?.body ? `**Content:**\n${campaign.content.body}` : 'No content generated yet.'}`,
              timestamp: new Date(),
              data: {
                type: 'campaign-preview',
                campaignId: campaign.id,
                content: campaign.content,
                gateResults: campaign.gate_results,
              }
            };
            setMessages([previewMsg]);
          }
        } catch (error) {
          console.error('Failed to load campaign from URL:', error);
        }
      }
    };

    loadCampaignFromURL();
  }, []);

  // Handle content library navigation to studio with template context
  useEffect(() => {
    const handleOpenStudioWithTemplate = (event: CustomEvent<{
      content: any;
      templateContext: {
        templateName: string;
        templateType: string;
        channel: string;
        subject?: string;
        body?: string;
        brandScore: number;
      };
      suggestedCommand: string;
    }>) => {
      const { content, templateContext, suggestedCommand } = event.detail;

      // Navigate to studio
      setActivePage('studio');

      // Set up workflow with template context
      setWorkflowState({
        campaignType: templateContext.templateType,
        campaignName: templateContext.templateName,
        audienceDescription: '',
        channel: templateContext.channel === 'email' ? 'Email' : templateContext.channel === 'sms' ? 'SMS' : 'Multi-channel',
        content: templateContext.subject || templateContext.body ? {
          subject: templateContext.subject || '',
          body: templateContext.body || '',
          cta: ''
        } : undefined
      });

      // Add message to conversation suggesting to use the template
      const templateMsg: Message = {
        id: `template-${Date.now()}`,
        type: 'assistant',
        content: `I've loaded the "${templateContext.templateName}" template (${templateContext.brandScore}% brand match). This ${templateContext.templateType} template is optimized for ${templateContext.channel}.\n\nYou can:\n- Type "create campaign" to start building\n- Customize the content by describing what you need\n- Ask me to suggest an audience for this campaign`,
        timestamp: new Date(),
        data: { type: 'template_loaded', templateContext }
      };
      setMessages(prev => [...prev, templateMsg]);
    };

    window.addEventListener('openStudioWithTemplate', handleOpenStudioWithTemplate as EventListener);
    return () => {
      window.removeEventListener('openStudioWithTemplate', handleOpenStudioWithTemplate as EventListener);
    };
  }, []);

  // Handle audience navigation to studio with audience context
  useEffect(() => {
    const handleNavigateToStudio = (event: CustomEvent<{
      audience: string;
      audienceId: string;
      audienceCount: number;
    }>) => {
      const { audience, audienceId, audienceCount } = event.detail;

      // Navigate to studio
      setActivePage('studio');

      // Set up workflow with audience context
      setWorkflowState(prev => ({
        ...prev,
        audience: audience,
        audienceDescription: `${audience} (${audienceCount.toLocaleString()} customers)`,
      }));

      // Add message to conversation
      const audienceMsg: Message = {
        id: `audience-${Date.now()}`,
        type: 'assistant',
        content: `I've selected the "${audience}" audience with ${audienceCount.toLocaleString()} customers.\n\nWhat kind of campaign would you like to create for this audience?\n- Type "referral campaign" for happy customers\n- Type "recovery campaign" for at-risk customers\n- Or describe the campaign you want to create`,
        timestamp: new Date(),
        data: { type: 'audience_selected', audience, audienceId, audienceCount }
      };
      setMessages(prev => [...prev, audienceMsg]);
    };

    window.addEventListener('navigate-to-studio', handleNavigateToStudio as EventListener);
    return () => {
      window.removeEventListener('navigate-to-studio', handleNavigateToStudio as EventListener);
    };
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await aiApi.suggestions();
      if (response.success && response.data) {
        setSuggestions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Win back inactive users',
    'Launch new product campaign',
    'Build loyalty journey for repeat buyers'
  ]);

  // Session ID for maintaining conversation context with RAG
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  /**
   * PAGE-SPECIFIC COMMAND HANDLER
   * Uses full RAG intelligence with page, status, and data awareness
   */
  const handlePageSpecificCommand = async (query: string, page: string): Promise<boolean> => {
    const lowerQuery = query.toLowerCase();

    // SKIP AI processing for content generation commands - let main handler process these
    // This ensures handleMultiChannelContentGeneration is called with proper logic
    if (page === 'content' &&
        (lowerQuery.includes('create') || lowerQuery.includes('generate') || lowerQuery.includes('make') || lowerQuery.includes('write')) &&
        (lowerQuery.includes('instagram') || lowerQuery.includes('linkedin') || lowerQuery.includes('twitter') ||
         lowerQuery.includes('social') || lowerQuery.includes('post') || lowerQuery.includes('template') ||
         lowerQuery.includes('sms') || lowerQuery.includes('email'))) {
      console.log('[handlePageSpecificCommand] Skipping AI - content generation command detected');
      return false; // Fall through to main handler
    }

    // Build comprehensive context including page, workflow state, and available data
    const stage = getCurrentWorkflowStage();

    // Build full context for RAG-powered intelligence
    const fullContext = {
      // Page context
      currentPage: page,
      pageCapabilities: getPageCapabilities(page),

      // Workflow context
      workflowStage: stage,
      currentCampaign: currentCampaign ? {
        name: currentCampaign.name,
        type: currentCampaign.campaignType,
        audience: currentCampaign.audienceDescription,
        channel: currentCampaign.channel,
        hasContent: !!currentCampaign.content,
        contentSubject: currentCampaign.content?.subject,
        gateStatus: currentCampaign.gateResults?.map((g: any) => `Gate ${g.gate}: ${g.passed ? 'PASSED' : 'FAILED'}`).join(', '),
        brandScore: currentCampaign.brandScore,
      } : null,

      // Available data sources
      dataSources: {
        birdeye: 'Reviews, ratings, sentiment, reputation score',
        crm: 'Customer profiles, purchase history, lifetime value',
        slack: 'Team notifications, approvals',
        email: 'Campaign delivery, opens, clicks',
      },

      // Session for memory
      sessionId,
    };

    // Use the full intelligence API with RAG
    try {
      const result = await aiApi.processCommand({
        message: `[Page: ${page.toUpperCase()}] ${query}`,
        sessionId,
        brandId: 'premier-nissan',
        userId: 'demo-user',
      });

      if (result.success && result.data) {
        const { intent, response, actions, suggestions: aiSuggestions } = result.data;

        // Handle the intent with page-specific logic
        const handled = await executePageAction(page, intent, response, actions, query);
        if (handled) return true;

        // Fallback to showing AI response
        if (response) {
          const msg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: response,
            timestamp: new Date(),
            data: { type: 'ai_response', intent, page },
          };
          setMessages(prev => [...prev, msg]);
          return true;
        }
      }
    } catch (e) {
      console.error('Intelligence API error:', e);
    }

    // Fallback to page-specific keyword handling
    return await handlePageFallback(page, query);
  };

  // Get capabilities description for each page
  const getPageCapabilities = (page: string): string => {
    const capabilities: Record<string, string> = {
      campaigns: 'List/filter campaigns by status, show metrics, pause/resume, create new',
      audiences: 'Create segments, list audiences, estimate sizes, query customer data',
      content: 'Generate email/SMS/social content, list templates, check brand compliance',
      automations: 'Create rules (when X then Y), list active rules, enable/disable',
      integrations: 'Show connected services, explain data available from each',
      analytics: 'Show performance metrics, running/paused campaigns, open/click rates',
    };
    return capabilities[page] || '';
  };

  // Execute action based on intent and page
  const executePageAction = async (page: string, intent: any, response: string, actions: any[], query: string): Promise<boolean> => {
    // Route to page-specific handlers
    switch (page) {
      case 'campaigns':
        return await handleCampaignsPageCommand(intent?.type || 'CHAT', intent?.action || '', response, intent?.data || {}, query);
      case 'audiences':
        return await handleAudiencesPageCommand(intent?.type || 'CHAT', intent?.action || '', response, intent?.data || {}, query);
      case 'content':
        return await handleContentPageCommand(intent?.type || 'CHAT', intent?.action || '', response, intent?.data || {}, query);
      case 'automations':
        return await handleAutomationsPageCommand(intent?.type || 'CHAT', intent?.action || '', response, intent?.data || {}, query);
      case 'integrations':
        return await handleIntegrationsPageCommand(intent?.type || 'CHAT', intent?.action || '', response, intent?.data || {}, query);
      case 'analytics':
        return await handleAnalyticsPageCommand(intent?.type || 'CHAT', intent?.action || '', response, intent?.data || {}, query);
      default:
        return false;
    }
  };

  // Fallback handler using keyword matching when AI doesn't respond
  const handlePageFallback = async (page: string, query: string): Promise<boolean> => {
    const lowerQuery = query.toLowerCase();

    // Determine intent from keywords
    let intent = 'CHAT';
    let data: any = {};

    if (lowerQuery.includes('list') || lowerQuery.includes('show') || lowerQuery.includes('what')) {
      intent = 'LIST';
    } else if (lowerQuery.includes('create') || lowerQuery.includes('new') || lowerQuery.includes('add')) {
      intent = 'CREATE';
    } else if (lowerQuery.includes('running') || lowerQuery.includes('active')) {
      intent = 'FILTER';
      data = { status: 'running' };
    } else if (lowerQuery.includes('paused')) {
      intent = 'FILTER';
      data = { status: 'paused' };
    }

    // Route to page handler
    switch (page) {
      case 'campaigns':
        return await handleCampaignsPageCommand(intent, '', '', data, query);
      case 'audiences':
        return await handleAudiencesPageCommand(intent, '', '', data, query);
      case 'content':
        return await handleContentPageCommand(intent, '', '', data, query);
      case 'automations':
        return await handleAutomationsPageCommand(intent, '', '', data, query);
      case 'integrations':
        return await handleIntegrationsPageCommand(intent, '', '', data, query);
      case 'analytics':
        return await handleAnalyticsPageCommand(intent, '', '', data, query);
      default:
        return false;
    }
  };

  // CAMPAIGNS PAGE HANDLER
  const handleCampaignsPageCommand = async (intent: string, action: string, response: string, data: any, query: string): Promise<boolean> => {
    try {
      const campaignsResult = await campaignsApi.list(data?.status ? { status: data.status } : {});
      const campaigns = campaignsResult.data || [];

      let content = response + '\n\n';

      if (intent === 'LIST' || intent === 'FILTER') {
        const filtered = data?.status
          ? campaigns.filter((c: any) => c.status === data.status)
          : campaigns;

        if (filtered.length === 0) {
          content += `No campaigns found${data?.status ? ` with status "${data.status}"` : ''}.`;
        } else {
          filtered.slice(0, 10).forEach((c: any) => {
            const statusEmoji = c.status === 'running' ? '🟢' : c.status === 'paused' ? '⏸️' : c.status === 'completed' ? '✅' : '📝';
            content += `${statusEmoji} **${c.name}**\n   Status: ${c.status} | Type: ${c.type} | Sent: ${c.metrics?.sent || 0}\n\n`;
          });
        }
      } else if (intent === 'CREATE') {
        content = `**Let's create a new campaign!**\n\nDescribe your campaign and I'll help you build it:\n• "Create a referral campaign for 5-star reviewers"\n• "Build a win-back campaign for inactive customers"\n• "Send a thank you email to recent buyers"\n\nOr click the **New Campaign** button above to start with a template.`;
      } else {
        content = response;
      }

      const msg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content,
        timestamp: new Date(),
        data: { type: 'campaigns_list', campaigns: campaigns.slice(0, 10) },
      };
      setMessages(prev => [...prev, msg]);
      return true;
    } catch (e) {
      return false;
    }
  };

  // AUDIENCES PAGE HANDLER
  const handleAudiencesPageCommand = async (intent: string, action: string, response: string, data: any, query: string): Promise<boolean> => {
    try {
      const audiencesResult = await audiencesApi.list();
      const audiences = audiencesResult.data || [];

      let content = response + '\n\n';

      if (intent === 'LIST') {
        if (audiences.length === 0) {
          content += `No audiences created yet. Say "create audience for 5-star reviewers" to get started.`;
        } else {
          audiences.forEach((a: any) => {
            content += `👥 **${a.name}**\n   Size: ${a.estimated_size?.toLocaleString() || '?'} customers\n   ${a.description || ''}\n\n`;
          });
        }
      } else if (intent === 'CREATE') {
        // Extract audience criteria from query
        const audienceName = data?.name || query.replace(/create\s+(new\s+)?audience\s*(for|of|with)?/i, '').trim() || 'New Audience';

        content = `**Creating audience: "${audienceName}"**\n\nDefine the criteria:\n• "Customers who left 5-star reviews"\n• "Inactive for 90+ days"\n• "Purchased in last 30 days"\n\nOr I can estimate the size for you.`;
      } else {
        content = response;
      }

      const msg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content,
        timestamp: new Date(),
        data: { type: 'audiences_list', audiences },
      };
      setMessages(prev => [...prev, msg]);
      return true;
    } catch (e) {
      return false;
    }
  };

  // CONTENT PAGE HANDLER
  const handleContentPageCommand = async (intent: string, action: string, response: string, data: any, query: string): Promise<boolean> => {
    let content = response + '\n\n';
    const lowerQuery = query.toLowerCase();

    if (intent === 'CREATE') {
      // Check if this is a multi-channel or social template request
      // If so, let it fall through to handleMultiChannelContentGeneration
      if (lowerQuery.includes('instagram') || lowerQuery.includes('linkedin') ||
          lowerQuery.includes('twitter') || lowerQuery.includes('social') ||
          lowerQuery.includes('sms') || lowerQuery.includes('text message') ||
          lowerQuery.includes('post')) {
        return false; // Fall through to main handler for proper multi-channel generation
      }

      // Generate content based on request
      const tone = lowerQuery.includes('fun') ? 'fun and playful' :
                   lowerQuery.includes('professional') ? 'professional' :
                   lowerQuery.includes('urgent') ? 'urgent and compelling' : 'friendly';

      content = `**Generating ${tone} content...**\n\n`;

      try {
        const contentResult = await aiApi.generateContent({
          campaignType: 'promotional',
          audience: 'target customers',
          channels: ['email'],
          goal: query,
          customInstructions: `Tone: ${tone}`,
        });

        if (contentResult.success && contentResult.data) {
          const generated = contentResult.data;
          content += `**Subject:** ${generated.email?.subject || 'N/A'}\n\n`;
          content += `**Body:**\n${generated.email?.body || 'N/A'}\n\n`;
          content += `**CTA:** ${generated.email?.cta || 'N/A'}\n\n`;
          content += `**Brand Score:** ${generated.brandScore}%`;
        }
      } catch (e) {
        content += `I can generate:\n• Email templates\n• SMS messages\n• Social posts\n\nTry: "Create a fun email for holiday sale"`;
      }
    } else if (intent === 'LIST') {
      content += `**Your Content Library:**\n\n`;
      content += `📧 **Email Templates:** 5 saved\n`;
      content += `📱 **SMS Templates:** 3 saved\n`;
      content += `📣 **Social Posts:** 2 saved\n\n`;
      content += `Say "create new email" to generate content.`;
    } else {
      content = response;
    }

    const msg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    return true;
  };

  // AUTOMATIONS PAGE HANDLER
  const handleAutomationsPageCommand = async (intent: string, action: string, response: string, data: any, query: string): Promise<boolean> => {
    try {
      const rulesResult = await rulesApi.list();
      const rules = rulesResult.data || [];

      let content = response + '\n\n';

      if (intent === 'LIST') {
        if (rules.length === 0) {
          content += `No automation rules yet.\n\n**Create one:**\n• "When customer leaves 5-star review, send thank you email"\n• "When customer inactive 90 days, send winback offer"`;
        } else {
          rules.forEach((r: any) => {
            const statusEmoji = r.is_active ? '🟢' : '⭕';
            content += `${statusEmoji} **${r.name}**\n   Trigger: ${r.trigger_type} | Active: ${r.is_active ? 'Yes' : 'No'}\n\n`;
          });
        }
      } else if (intent === 'CREATE') {
        content = `**Creating new automation rule**\n\nDescribe the rule in natural language:\n\n• "When [trigger], then [action]"\n\n**Triggers:** review received, purchase made, signup, inactivity\n**Actions:** send email, send SMS, notify Slack, update CRM`;
      } else {
        content = response;
      }

      const msg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content,
        timestamp: new Date(),
        data: { type: 'rules_list', rules },
      };
      setMessages(prev => [...prev, msg]);
      return true;
    } catch (e) {
      return false;
    }
  };

  // INTEGRATIONS PAGE HANDLER
  const handleIntegrationsPageCommand = async (intent: string, action: string, response: string, data: any, query: string): Promise<boolean> => {
    let content = response + '\n\n';

    const integrations = [
      {
        name: 'Birdeye',
        status: 'connected',
        data: ['Customer reviews', 'Star ratings', 'Sentiment analysis', 'Review responses', 'Reputation score'],
      },
      {
        name: 'Slack',
        status: 'connected',
        data: ['Team notifications', 'Campaign approvals', 'Alert channels'],
      },
      {
        name: 'Resend (Email)',
        status: 'connected',
        data: ['Email delivery', 'Open tracking', 'Click tracking', 'Bounce handling'],
      },
      {
        name: 'CRM',
        status: 'connected',
        data: ['Customer profiles', 'Purchase history', 'Contact information', 'Lifetime value'],
      },
      {
        name: 'Pinecone',
        status: 'connected',
        data: ['Brand memory', 'Content history', 'Learning patterns'],
      },
    ];

    if (intent === 'LIST' || query.toLowerCase().includes('what') || query.toLowerCase().includes('integrations')) {
      content = `**Connected Integrations:**\n\n`;
      integrations.forEach(i => {
        content += `✅ **${i.name}**\n`;
        content += `   Data: ${i.data.join(', ')}\n\n`;
      });
      content += `\n**Ask me:**\n• "What data does Birdeye provide?"\n• "Show me recent reviews"\n• "What's our reputation score?"`;
    } else if (query.toLowerCase().includes('birdeye') || query.toLowerCase().includes('review')) {
      content = `**Birdeye Integration**\n\n`;
      content += `📊 **Available Data:**\n`;
      content += `• Customer reviews (5★ to 1★)\n`;
      content += `• Review sentiment (positive/neutral/negative)\n`;
      content += `• Review responses\n`;
      content += `• Reputation score\n`;
      content += `• Review trends over time\n\n`;
      content += `**Use this data for:**\n`;
      content += `• Referral campaigns (target 5★ reviewers)\n`;
      content += `• Recovery campaigns (reach out to unhappy customers)\n`;
      content += `• Competitive analysis`;
    } else {
      content = response;
    }

    const msg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content,
      timestamp: new Date(),
      data: { type: 'integrations_list', integrations },
    };
    setMessages(prev => [...prev, msg]);
    return true;
  };

  // ANALYTICS PAGE HANDLER
  const handleAnalyticsPageCommand = async (intent: string, action: string, response: string, data: any, query: string): Promise<boolean> => {
    try {
      const [overviewResult, campaignsResult] = await Promise.all([
        analyticsApi.overview(),
        campaignsApi.list(),
      ]);

      const overview = overviewResult.data;
      const campaigns = campaignsResult.data || [];

      let content = response + '\n\n';

      if (query.toLowerCase().includes('running') || query.toLowerCase().includes('active')) {
        const running = campaigns.filter((c: any) => c.status === 'running');
        content = `**Running Campaigns (${running.length}):**\n\n`;
        if (running.length === 0) {
          content += `No campaigns currently running.`;
        } else {
          running.forEach((c: any) => {
            content += `🟢 **${c.name}**\n`;
            content += `   Sent: ${c.metrics?.sent || 0} | Opened: ${c.metrics?.opened || 0} | Clicked: ${c.metrics?.clicked || 0}\n\n`;
          });
        }
      } else if (query.toLowerCase().includes('paused')) {
        const paused = campaigns.filter((c: any) => c.status === 'paused');
        content = `**Paused Campaigns (${paused.length}):**\n\n`;
        if (paused.length === 0) {
          content += `No paused campaigns.`;
        } else {
          paused.forEach((c: any) => {
            content += `⏸️ **${c.name}**\n   Type: ${c.type}\n\n`;
          });
        }
      } else if (query.toLowerCase().includes('performance') || query.toLowerCase().includes('metrics') || query.toLowerCase().includes('stats')) {
        content = `**Overall Performance:**\n\n`;
        content += `📊 **Total Campaigns:** ${overview?.total_campaigns || 0}\n`;
        content += `🟢 **Active:** ${overview?.active_campaigns || 0}\n`;
        content += `📧 **Total Sent:** ${overview?.total_sent?.toLocaleString() || 0}\n`;
        content += `👁️ **Total Opened:** ${overview?.total_opened?.toLocaleString() || 0}\n`;
        content += `🖱️ **Total Clicked:** ${overview?.total_clicked?.toLocaleString() || 0}\n\n`;
        content += `**Rates:**\n`;
        content += `• Open Rate: ${overview?.average_open_rate?.toFixed(1) || 0}%\n`;
        content += `• Click Rate: ${overview?.average_click_rate?.toFixed(1) || 0}%`;
      } else {
        content = `**Analytics Overview:**\n\n`;
        content += `📊 Total Campaigns: ${overview?.total_campaigns || 0}\n`;
        content += `📧 Avg Open Rate: ${overview?.average_open_rate?.toFixed(1) || 0}%\n`;
        content += `🖱️ Avg Click Rate: ${overview?.average_click_rate?.toFixed(1) || 0}%\n\n`;
        content += `**Ask me:**\n`;
        content += `• "Show running campaigns"\n`;
        content += `• "What are our metrics?"\n`;
        content += `• "Which campaigns are paused?"`;
      }

      const msg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content,
        timestamp: new Date(),
        data: { type: 'analytics', overview, campaigns },
      };
      setMessages(prev => [...prev, msg]);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleCommandSubmit = async (query: string) => {
    // Check if clarification is needed
    if (needsClarification(query)) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      const clarifyMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `**What would you like to create?**\n\n• **Campaign** - Marketing outreach (referral, recovery, winback)\n• **Content** - Email, SMS, or social post template\n• **Audience** - Customer segment for targeting\n• **Automation** - Rule (when X happens, do Y)\n\nTry: "Create a referral campaign" or "Create Instagram post for car launch"`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, clarifyMsg]);
      return;
    }

    // CONTEXT-AWARE ROUTING: Determine where this command should be handled
    const routingDecision = getRoutingDecision(query);
    console.log('[Routing]', { query, decision: routingDecision, currentPage: activePage });

    // If navigation is needed, navigate first
    if (routingDecision.shouldNavigate) {
      navigateWithContext(routingDecision);
      // Small delay to let navigation complete, then re-process command
      setTimeout(() => {
        // Re-run command on new page (it will be added to that page's messages)
        handleCommandSubmit(query);
      }, 100);
      return;
    }

    // Add user message to current page
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add processing message
    const processingMsg: Message = {
      id: `system-${Date.now()}`,
      type: 'system',
      content: 'TrustEye is analyzing your request...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, processingMsg]);

    try {
      const lowerQuery = query.toLowerCase();

      // PAGE-AWARE COMMAND ROUTING
      // Route to page-specific handlers based on activePage
      if (activePage !== 'studio') {
        const handled = await handlePageSpecificCommand(query, activePage);
        if (handled) {
          setIsLoading(false);
          setMessages(prev => prev.filter(m => m.content !== 'TrustEye is analyzing your request...'));
          return;
        }
      }

      // MARKETING ENGINE: DISABLED - Enable after demo
      // const engineHandled = await tryMarketingEngine(query);
      // if (engineHandled) {
      //   setIsLoading(false);
      //   setMessages(prev => prev.filter(m => m.content !== 'TrustEye is analyzing your request...'));
      //   return;
      // }

      // PRIORITY 1: Any "create" or "new" + "campaign" command -> smart campaign creation
      if ((lowerQuery.includes('create') || lowerQuery.includes('new') || lowerQuery.includes('build') || lowerQuery.includes('start')) &&
          (lowerQuery.includes('campaign') || lowerQuery.includes('outreach') || lowerQuery.includes('email'))) {
        await handleSmartCampaignCreate(query);
      }
      // PRIORITY 2: Specific campaign type triggers
      else if (lowerQuery.includes('referral') || (lowerQuery.includes('5') && lowerQuery.includes('star'))) {
        await handleReferralCampaign(query);
      } else if (lowerQuery.includes('recovery') || lowerQuery.includes('negative') || lowerQuery.includes('bad review') || lowerQuery.includes('unhappy') || lowerQuery.includes('2 star') || lowerQuery.includes('1 star')) {
        await handleRecoveryCampaign(query);
      } else if (lowerQuery.includes('conquest') || lowerQuery.includes('competitor') || lowerQuery.includes('valley honda')) {
        await handleConquestCampaign(query);
      } else if (lowerQuery.includes('winback') || lowerQuery.includes('win back') || lowerQuery.includes('win-back') || lowerQuery.includes('inactive') || lowerQuery.includes('lapsed')) {
        await handleWinbackCampaign(query);
      }
      // CONTENT GENERATION - Multi-channel content creation
      else if (
        // Direct content generation commands
        (lowerQuery.includes('generate') && (lowerQuery.includes('content') || lowerQuery.includes('template') || lowerQuery.includes('post'))) ||
        (lowerQuery.includes('create') && (lowerQuery.includes('template') || lowerQuery.includes('sms') || lowerQuery.includes('instagram') || lowerQuery.includes('social') || lowerQuery.includes('post') || lowerQuery.includes('linkedin') || lowerQuery.includes('twitter'))) ||
        (lowerQuery.includes('make') && (lowerQuery.includes('template') || lowerQuery.includes('sms') || lowerQuery.includes('instagram') || lowerQuery.includes('post') || lowerQuery.includes('social'))) ||
        // Channel-specific content commands without campaign context
        ((lowerQuery.includes('write') || lowerQuery.includes('draft')) && (lowerQuery.includes('email') || lowerQuery.includes('sms') || lowerQuery.includes('message') || lowerQuery.includes('post')))
      ) {
        console.log('[handleCommandSubmit] Matched CONTENT GENERATION pattern, calling handleMultiChannelContentGeneration');
        await handleMultiChannelContentGeneration(query);
      } else if (lowerQuery.includes('generate') && lowerQuery.includes('content')) {
        await handleContentGeneration();
      }
      // PRIORITY: Edit content commands (specific field edits)
      else if ((lowerQuery.includes('edit') || lowerQuery.includes('change') || lowerQuery.includes('update') || lowerQuery.includes('set')) &&
               (lowerQuery.includes('subject') || lowerQuery.includes('body') || lowerQuery.includes('cta') || lowerQuery.includes('button'))) {
        await handleCommandContentEdit(query);
      }
      // "Edit content and fix" or "fix content" - auto-fix when gate failed
      else if ((lowerQuery.includes('edit content') && lowerQuery.includes('fix')) ||
               lowerQuery === 'fix content' ||
               lowerQuery === 'fix the content' ||
               lowerQuery.includes('fix content')) {
        const stage = getCurrentWorkflowStage();
        if (stage === 'gate_failed' && currentCampaign) {
          await handleAutoFixContent();
        } else if (currentCampaign?.content) {
          const msg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Content looks good!** No issues to fix.\n\nCurrent stage: ${stage}\n\nSay "review" to submit for approval.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, msg]);
        } else {
          const msg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**No content yet.** Let me generate it first...`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, msg]);
          await handleContentGeneration();
        }
      }
      // Generic "edit content" - show guidance
      else if (lowerQuery === 'edit content' && currentCampaign?.content) {
        const helpMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `**Edit Your Content**\n\nYou can edit the content by:\n\n1. **Click directly** on any field (subject, body, CTA) in the message above\n2. **Use commands:**\n   • "Edit subject to [new subject]"\n   • "Change body to [new text]"\n   • "Update CTA to [new button text]"\n\n**Current content:**\n• Subject: "${currentCampaign.content.subject || 'N/A'}"\n• Body: "${(currentCampaign.content.body || '').substring(0, 100)}..."`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, helpMsg]);
      }
      // Edit/Change audience with specific target
      else if ((lowerQuery.includes('audience') || lowerQuery.includes('target')) &&
               (lowerQuery.includes('change') || lowerQuery.includes('edit') || lowerQuery.includes('to ') || lowerQuery.includes('focus')) &&
               currentCampaign) {
        // Extract new audience from command
        let newAudience = query.replace(/^(change|edit|update|set)\s*(audience|target)\s*(to)?\s*/i, '').trim();
        if (!newAudience || newAudience === query) {
          // Just "edit audience" - show help
          const helpMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Edit Audience for "${currentCampaign.name}"**\n\nDescribe the new audience:\n• "Change audience to 5-star reviewers"\n• "Target inactive customers"\n• "Focus on high-value buyers"\n\n**Current:** ${currentCampaign.audienceDescription || 'Not set'}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, helpMsg]);
        } else {
          // Actually change the audience
          const updatedCampaign = {
            ...currentCampaign,
            audienceDescription: newAudience,
          };
          setCurrentCampaign(updatedCampaign);
          setInspectorData((prev: any) => ({ ...prev, audienceDescription: newAudience, audienceName: newAudience }));
          setWorkflowState(prev => ({ ...prev, audience: newAudience, audienceDescription: newAudience }));

          const confirmMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Audience Updated**\n\n**Campaign:** ${currentCampaign.name}\n**New audience:** ${newAudience}\n\nContent may need to be regenerated for this audience. Say "generate content" to update.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, confirmMsg]);
        }
      }
      // Change channels with specific channels
      else if ((lowerQuery.includes('channel') || lowerQuery.includes('via ') || lowerQuery.includes('use ')) &&
               (lowerQuery.includes('email') || lowerQuery.includes('sms') || lowerQuery.includes('slack')) &&
               currentCampaign) {
        // Extract channels from command
        const newChannels: string[] = [];
        if (lowerQuery.includes('email')) newChannels.push('email');
        if (lowerQuery.includes('sms') || lowerQuery.includes('text')) newChannels.push('sms');
        if (lowerQuery.includes('slack')) newChannels.push('slack');

        if (newChannels.length > 0) {
          const channelDisplay = newChannels.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' + ');
          const updatedCampaign = {
            ...currentCampaign,
            channels: newChannels,
            channel: channelDisplay,
          };
          setCurrentCampaign(updatedCampaign);
          setInspectorData((prev: any) => ({ ...prev, channels: newChannels, channel: channelDisplay }));
          setWorkflowState(prev => ({ ...prev, channels: newChannels, channel: channelDisplay }));

          const confirmMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Channels Updated**\n\n**Campaign:** ${currentCampaign.name}\n**Channels:** ${channelDisplay}\n\nReady to continue.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, confirmMsg]);
        }
      }
      // Just "change channels" - show help
      else if ((lowerQuery === 'change channels' || lowerQuery === 'edit channels') && currentCampaign) {
        const helpMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `**Change Channels for "${currentCampaign.name}"**\n\n**Available:** ${AVAILABLE_CHANNELS.join(', ')}\n\nTry:\n• "Use email and sms"\n• "Send via slack"\n• "Use email only"\n\n**Current:** ${currentCampaign.channel || 'Email'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, helpMsg]);
      }
      // SAVE TO LIBRARY - Save generated content to content library
      else if ((lowerQuery.includes('save') && lowerQuery.includes('library')) ||
               (lowerQuery.includes('add') && lowerQuery.includes('library')) ||
               lowerQuery === 'save' || lowerQuery === 'save content') {
        if (generatedContent) {
          // Determine channels from generated content
          const channels: string[] = [];
          if (generatedContent.email) channels.push('email');
          if (generatedContent.sms) channels.push('sms');
          if (generatedContent.social) channels.push('instagram');

          // Determine campaign type from workflow state or default
          const campaignTypes: string[] = [];
          const goal = workflowState.goal?.toLowerCase() || '';
          if (goal.includes('referral')) campaignTypes.push('referral');
          else if (goal.includes('recovery')) campaignTypes.push('recovery');
          else if (goal.includes('winback') || goal.includes('win-back')) campaignTypes.push('winback');
          else if (goal.includes('conquest')) campaignTypes.push('conquest');
          else if (goal.includes('welcome')) campaignTypes.push('welcome');
          else if (goal.includes('loyalty')) campaignTypes.push('loyalty');
          else if (goal.includes('service')) campaignTypes.push('service');
          else if (goal.includes('birthday')) campaignTypes.push('birthday');
          else if (goal.includes('seasonal') || goal.includes('holiday')) campaignTypes.push('promotional');
          else campaignTypes.push('promotional'); // Default

          // Generate a descriptive name
          const contentName = workflowState.goal
            ? `AI Generated - ${workflowState.goal.substring(0, 50)}`
            : `AI Generated - ${channels.join('/')} Content`;

          // Show saving message
          const savingMsg: Message = {
            id: `saving-${Date.now()}`,
            type: 'system',
            content: 'Saving to Content Library...',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, savingMsg]);

          try {
            // Save to backend API
            const saveResult = await contentApi.create({
              name: contentName,
              type: 'template',
              channels,
              campaignTypes,
              content: {
                subject: generatedContent.email?.subject || '',
                body: generatedContent.email?.body || '',
                cta: generatedContent.email?.cta || 'Learn More',
                post: generatedContent.social?.post || '',
                hashtags: generatedContent.social?.hashtags || [],
                message: generatedContent.sms?.message || '',
              },
              brandScore: generatedContent.brandScore || 85,
            });

            if (saveResult.success && saveResult.data) {
              // Also add to local state for immediate display
              const newContentItem: ContentItem = {
                id: saveResult.data.id,
                name: saveResult.data.name,
                type: 'template',
                channels: channels as ContentChannel[],
                campaignTypes: campaignTypes as CampaignType[],
                content: {
                  subject: generatedContent.email?.subject || '',
                  body: generatedContent.email?.body || generatedContent.sms?.message || generatedContent.social?.post || '',
                  cta: generatedContent.email?.cta || 'Learn More',
                },
                brandScore: generatedContent.brandScore || 85,
                performance: {
                  timesUsed: 0,
                  avgOpenRate: 0,
                  avgClickRate: 0,
                  bestPerformingIn: campaignTypes[0] || 'promotional',
                  isMock: false,
                },
                createdAt: new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0],
              };
              setDynamicContentLibrary(prev => [newContentItem, ...prev]);

              const saveMsg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `**Content Saved to Library!**\n\n**Name:** ${saveResult.data.name}\n**ID:** ${saveResult.data.id}\n**Channels:** ${channels.join(', ')}\n**Brand Score:** ${generatedContent.brandScore || 85}%\n**Type:** ${campaignTypes.join(', ')}\n\nYou can find it in the **Content Library** tab, or say **"create campaign"** to use it now.`,
                timestamp: new Date(),
              };
              setMessages(prev => prev.filter(m => m.id !== savingMsg.id).concat(saveMsg));
            } else {
              throw new Error(saveResult.error || 'Failed to save');
            }
          } catch (error: any) {
            console.error('Save to library error:', error);
            const errorMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**Save Failed**\n\nError: ${error?.message || 'Unknown error'}. Please try again.`,
              timestamp: new Date(),
            };
            setMessages(prev => prev.filter(m => m.id !== savingMsg.id).concat(errorMsg));
          }
        } else {
          const noContentMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**No content to save yet.**\n\nGenerate content first by saying:\n• "Create a referral email for 5-star reviewers"\n• "Generate Instagram post for car launch"\n• "Write a winback SMS campaign"`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, noContentMsg]);
        }
      }
      // Show preview
      else if (lowerQuery === 'show preview' && currentCampaign?.content) {
        const previewMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `**Email Preview**\n\n**Subject:** ${currentCampaign.content.subject}\n\n---\n\n${currentCampaign.content.body}\n\n---\n\n**[${currentCampaign.content.cta || 'Learn More'}]**`,
          timestamp: new Date(),
          data: { type: 'preview', content: currentCampaign.content },
        };
        setMessages(prev => [...prev, previewMsg]);
      }
      // Show receipt
      else if (lowerQuery === 'show receipt' && currentCampaign?.gateResults) {
        const receiptMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `**Compliance Receipt**\n\n**Receipt ID:** ${Date.now().toString(36).toUpperCase()}\n**Campaign:** ${currentCampaign.name}\n**Brand Score:** ${currentCampaign.brandScore || 85}%\n\n**Gate Results:**\n• Gate 1 (Rules): PASSED\n• Gate 2 (AI Review): PASSED\n• Gate 3 (Human): PASSED\n\n**Approved by:** sumitjain@gmail.com\n**Timestamp:** ${new Date().toISOString()}`,
          timestamp: new Date(),
          data: { type: 'receipt', gateResults: currentCampaign.gateResults },
        };
        setMessages(prev => [...prev, receiptMsg]);
      }
      // Go to campaigns page (Track Performance)
      else if (lowerQuery === 'go to campaigns' || lowerQuery === 'track performance' || lowerQuery === 'view campaigns') {
        setActivePage('campaigns');
      }
      // Start new campaign - reset state
      else if (lowerQuery === 'start new' || lowerQuery === 'new campaign' || lowerQuery === 'start over' || lowerQuery === 'reset') {
        handleStartNew();
        const welcomeMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `**Ready for your next campaign!**\n\nWhat would you like to create?\n\n• Click an **AI Suggestion** on the left\n• Or describe your campaign: "Create a referral campaign for 5-star reviewers"`,
          timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
      }
      // IMAGE GENERATION COMMANDS
      else if (
        (lowerQuery.includes('generate') && lowerQuery.includes('image')) ||
        (lowerQuery.includes('create') && lowerQuery.includes('image')) ||
        (lowerQuery.includes('make') && lowerQuery.includes('image')) ||
        (lowerQuery.includes('design') && (lowerQuery.includes('banner') || lowerQuery.includes('graphic')))
      ) {
        // Extract image prompt from command
        let imagePrompt = query
          .replace(/generate\s*(an?)?\s*image\s*(of|for|showing)?/i, '')
          .replace(/create\s*(an?)?\s*image\s*(of|for|showing)?/i, '')
          .replace(/make\s*(an?)?\s*image\s*(of|for|showing)?/i, '')
          .replace(/design\s*(a)?\s*(banner|graphic)\s*(of|for|showing)?/i, '')
          .trim();

        // Default prompt if none provided
        if (!imagePrompt || imagePrompt.length < 5) {
          imagePrompt = workflowState.goal || 'A professional automotive dealership marketing image';
        }

        // Determine channel from context
        let channel = 'default';
        if (lowerQuery.includes('instagram')) channel = 'instagram';
        else if (lowerQuery.includes('facebook')) channel = 'facebook';
        else if (lowerQuery.includes('banner') || lowerQuery.includes('hero')) channel = 'web-banner-hero';
        else if (lowerQuery.includes('email')) channel = 'email-header';

        // Show generating message
        const generatingMsg: Message = {
          id: `generating-${Date.now()}`,
          type: 'assistant',
          content: `**Generating image...**\n\nPrompt: "${imagePrompt}"\nChannel: ${channel}\n\nThis may take a few seconds...`,
          timestamp: new Date(),
        };
        addMessage(generatingMsg);

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:3009'}'}/api/ai/image/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: imagePrompt,
              channel,
              count: 2,
              brandContext: {
                primaryColor: '#1e40af',
                style: 'professional, modern, automotive',
                industry: 'automotive dealership',
              },
            }),
          });
          const result = await response.json();

          if (result.success && result.data?.images?.length > 0) {
            const images = result.data.images;
            const imageMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**Images Generated!**\n\n**Prompt:** ${result.data.prompt}\n**Enhanced:** ${result.data.enhancedPrompt}\n\n${images.map((img: any, i: number) => `**Variation ${i + 1}:** [View Image](${img.url})`).join('\n')}\n\nSay **"use image 1"** or **"use image 2"** to select for your campaign.`,
              timestamp: new Date(),
              data: {
                type: 'image_generation',
                images: images,
              },
            };
            setPageMessages(prev => ({
              ...prev,
              [activePage]: prev[activePage].filter(m => m.id !== generatingMsg.id).concat(imageMsg),
            }));
          } else {
            const errorMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**Image Generation**\n\nDemo images generated for: "${imagePrompt}"\n\n[Image generation requires OpenAI API key for production images]\n\nFor now, here's a placeholder:\n![Placeholder](https://placehold.co/1024x1024/1e40af/ffffff?text=Generated+Image)`,
              timestamp: new Date(),
            };
            setPageMessages(prev => ({
              ...prev,
              [activePage]: prev[activePage].filter(m => m.id !== generatingMsg.id).concat(errorMsg),
            }));
          }
        } catch (error) {
          console.error('Image generation error:', error);
          const errorMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Image Generation Failed**\n\nUnable to generate image. Please try again or check if the backend is running.`,
            timestamp: new Date(),
          };
          setPageMessages(prev => ({
            ...prev,
            [activePage]: prev[activePage].filter(m => m.id !== generatingMsg.id).concat(errorMsg),
          }));
        }
      }
      // BRAND TONE COMMANDS - Update brand tone settings
      else if (
        (lowerQuery.includes('brand') && lowerQuery.includes('tone')) ||
        (lowerQuery.includes('update') && lowerQuery.includes('voice')) ||
        (lowerQuery.includes('make') && (lowerQuery.includes('casual') || lowerQuery.includes('professional') || lowerQuery.includes('friendly'))) ||
        (lowerQuery.includes('allow') && lowerQuery.includes('emoji')) ||
        (lowerQuery.includes('emoji') && (lowerQuery.includes('enable') || lowerQuery.includes('disable') || lowerQuery.includes('allow') || lowerQuery.includes('no')))
      ) {
        let updateMsg = '';
        const updatedTone = { ...brandTone };

        // Handle voice updates
        if (lowerQuery.includes('casual') || lowerQuery.includes('relaxed')) {
          updatedTone.voice = 'Casual & Friendly';
          updatedTone.attributes = ['Relaxed', 'Approachable', 'Warm', 'Conversational'];
          updateMsg = 'Brand voice updated to **Casual & Friendly**';
        } else if (lowerQuery.includes('professional') || lowerQuery.includes('formal')) {
          updatedTone.voice = 'Professional & Polished';
          updatedTone.attributes = ['Professional', 'Trustworthy', 'Clear', 'Authoritative'];
          updateMsg = 'Brand voice updated to **Professional & Polished**';
        } else if (lowerQuery.includes('friendly') || lowerQuery.includes('warm')) {
          updatedTone.voice = 'Warm & Friendly';
          updatedTone.attributes = ['Friendly', 'Welcoming', 'Helpful', 'Caring'];
          updateMsg = 'Brand voice updated to **Warm & Friendly**';
        }

        // Handle emoji updates
        if (lowerQuery.includes('allow') && lowerQuery.includes('emoji')) {
          if (lowerQuery.includes('instagram') || lowerQuery.includes('social')) {
            updatedTone.channelOverrides = {
              ...updatedTone.channelOverrides,
              instagram: {
                ...(updatedTone.channelOverrides.instagram || {}),
                emojiUsage: 'encouraged',
              },
            };
            updateMsg = updateMsg ? `${updateMsg}\n\nEmojis **enabled** for Instagram posts` : 'Emojis **enabled** for Instagram posts';
          } else if (lowerQuery.includes('email')) {
            updatedTone.channelOverrides = {
              ...updatedTone.channelOverrides,
              email: {
                ...(updatedTone.channelOverrides.email || {}),
                emojiUsage: 'sparingly',
              },
            };
            updateMsg = updateMsg ? `${updateMsg}\n\nEmojis **allowed sparingly** in emails` : 'Emojis **allowed sparingly** in emails';
          } else {
            updatedTone.emojiUsage = 'sparingly';
            updateMsg = updateMsg ? `${updateMsg}\n\nEmojis **allowed** across all channels` : 'Emojis **allowed** across all channels';
          }
        } else if ((lowerQuery.includes('no') || lowerQuery.includes('disable')) && lowerQuery.includes('emoji')) {
          updatedTone.emojiUsage = 'never';
          updateMsg = updateMsg ? `${updateMsg}\n\nEmojis **disabled** across all channels` : 'Emojis **disabled** across all channels';
        }

        // If no specific update matched, show current brand tone
        if (!updateMsg) {
          const toneMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Current Brand Tone**\n\n**Voice:** ${brandTone.voice}\n**Attributes:** ${brandTone.attributes.join(', ')}\n**Emoji Policy:** ${brandTone.emojiUsage}\n\n**Update commands:**\n• "Make brand tone more casual"\n• "Update voice to be more professional"\n• "Allow emojis in Instagram posts"\n• "No emojis in emails"\n\nOr go to the **Content Library** tab to edit all settings.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, toneMsg]);
        } else {
          // Apply updates
          setBrandTone(updatedTone);
          const confirmMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Brand Tone Updated!**\n\n${updateMsg}\n\n**New settings:**\n• Voice: ${updatedTone.voice}\n• Attributes: ${updatedTone.attributes.join(', ')}\n• Emoji: ${updatedTone.emojiUsage}\n\nThese changes will apply to all future content generation.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, confirmMsg]);
        }
      }
      // In-app approval (workaround for Slack interactive buttons)
      else if ((lowerQuery === 'approve' || lowerQuery === 'approved' || lowerQuery === 'i approve') && currentCampaign?.id) {
        try {
          const approvalResponse = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:3009'}/api/campaigns/slack/approval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'approve',
              campaign_id: currentCampaign.id,
              user: 'demo@trusteye.com'
            })
          });
          const approvalData = await approvalResponse.json();

          if (approvalData.success) {
            // Update campaign status
            const updatedCampaign = { ...currentCampaign, status: 'scheduled' };
            setCurrentCampaign(updatedCampaign);
            setInspectorData(updatedCampaign);

            // Update workflow state
            setWorkflowState(prev => ({
              ...prev,
              gateResults: [...(prev.gateResults || []), { gate: 3, passed: true }],
            }));

            const approvedMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**Campaign Approved!** ✅\n\n**Approved by:** demo@trusteye.com\n**Time:** ${new Date().toLocaleTimeString()}\n\nAll 3 gates have passed. Say **"execute"** to send the campaign now.`,
              timestamp: new Date(),
              data: { type: 'approved', campaignId: currentCampaign.id },
            };
            setMessages(prev => [...prev, approvedMsg]);
          } else {
            throw new Error(approvalData.error || 'Approval failed');
          }
        } catch (error: any) {
          const errorMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `Failed to approve campaign: ${error.message}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      }
      // Check approval status
      else if (lowerQuery.includes('check') && (lowerQuery.includes('approval') || lowerQuery.includes('slack') || lowerQuery.includes('status'))) {
        const statusMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `**Approval Status**\n\nA notification was sent to Slack channel **#marketing-approvals**.\n\nOnce approved, say **"execute"** to send the campaign.\n\n**Tip:** You can also check Slack directly for the approval buttons.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, statusMsg]);
      }
      // Show gate details
      else if (lowerQuery.includes('gate') && lowerQuery.includes('detail') && currentCampaign) {
        const gate1 = currentCampaign.gateResults?.find((g: any) => g.gate === 1);
        const gate2 = currentCampaign.gateResults?.find((g: any) => g.gate === 2);
        const gate3 = currentCampaign.gateResults?.find((g: any) => g.gate === 3);

        const detailsMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `**3-Gate Details**\n\n**Gate 1 - Rules Validation:**\n• Status: ${gate1?.passed ? 'PASSED' : 'PENDING'}\n• Checks: Compliance rules, system rules\n\n**Gate 2 - AI Review:**\n• Status: ${gate2?.passed ? 'PASSED' : 'PENDING'}\n• Brand Score: ${gate2?.details?.brandScore || currentCampaign.brandScore || '—'}%\n\n**Gate 3 - Human Approval:**\n• Status: ${gate3?.passed ? 'APPROVED' : 'PENDING'}\n• Channel: Slack #marketing-approvals`,
          timestamp: new Date(),
          data: { type: 'gate_details', gateResults: currentCampaign.gateResults },
        };
        setMessages(prev => [...prev, detailsMsg]);
      } else if ((lowerQuery.includes('schedule') || lowerQuery.includes('send today') || lowerQuery.includes('send it') || lowerQuery.includes('launch it')) && currentCampaign) {
        // Handle scheduling - default to immediate
        const isImmediate = lowerQuery.includes('now') || lowerQuery.includes('today') || lowerQuery.includes('immediate') || lowerQuery.includes('asap') || !lowerQuery.match(/tomorrow|next|later|\d+\s*(day|hour|week)/i);

        // Update campaign schedule
        const scheduleTime = isImmediate ? 'immediate' : 'scheduled';

        // Update workflow state
        setWorkflowState(prev => ({ ...prev, timing: scheduleTime }));

        // If campaign has content, proceed to review
        if (currentCampaign.content) {
          const scheduleMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Schedule: ${isImmediate ? 'Immediate' : 'Scheduled'}**\n\nCampaign will be sent ${isImmediate ? 'immediately after approval' : 'at the scheduled time'}.\n\nSubmitting for 3-Gate Approval...`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, scheduleMsg]);
          await handleCampaignReview();
        } else {
          // Need content first
          const needContentMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Schedule set to ${isImmediate ? 'Immediate' : 'Scheduled'}**\n\nBefore we can schedule, I need to generate the content.\n\nGenerating content now...`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, needContentMsg]);
          await handleContentGeneration();
        }
      } else if ((lowerQuery.includes('review') || lowerQuery.includes('approve') || lowerQuery.includes('submit')) && currentCampaign) {
        await handleCampaignReview();
      } else if ((lowerQuery.includes('execute') || lowerQuery.includes('send now') || lowerQuery.includes('launch now')) && currentCampaign) {
        await handleCampaignExecute();
      } else if (lowerQuery === 'yes' || lowerQuery === 'ok' || lowerQuery === 'sure' || lowerQuery === 'do it' || lowerQuery === 'go ahead' || lowerQuery === 'proceed' || lowerQuery === 'next' || lowerQuery === 'continue') {
        // SMART AFFIRMATIVE - respond based on current workflow stage
        const stage = getCurrentWorkflowStage();

        switch (stage) {
          case 'no_campaign': {
            const noCampaignMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**No campaign in progress.**\n\nCreate one first:\n• "Create a referral campaign for 5-star reviewers"\n• "Create a win-back campaign for inactive customers"\n• Or click an **AI Suggestion** in the sidebar.`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, noCampaignMsg]);
            break;
          }
          case 'campaign_created':
            await handleContentGeneration();
            break;
          case 'content_ready':
            await handleCampaignReview();
            break;
          case 'gate_failed': {
            // Auto-fix content
            const fixMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**Fixing content issues...**`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, fixMsg]);
            // Trigger the edit content handler
            await handleAutoFixContent();
            break;
          }
          case 'awaiting_approval': {
            // Approve the campaign
            if (currentCampaign?.id) {
              const result = await campaignsApi.approve(currentCampaign.id);
              if (result.success) {
                const updated = await campaignsApi.get(currentCampaign.id);
                if (updated.success && updated.data) {
                  setInspectorData((prev: any) => ({
                    ...prev,
                    gateResults: updated.data?.gate_results,
                    status: updated.data?.status,
                  }));
                  setCurrentCampaign(updated.data);
                }
                setWorkflowState(prev => ({ ...prev, gate3Approved: true }));
                const approveMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `**Campaign Approved!**\n\nAll 3 gates passed. Say **"publish"** to send.`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, approveMsg]);
              }
            }
            break;
          }
          case 'approved':
            await handleCampaignExecute();
            break;
          case 'published': {
            const doneMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**Campaign already published!**\n\nWant to create another campaign?`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, doneMsg]);
            break;
          }
        }
      }
      // STATUS COMMAND - shows current context
      else if (lowerQuery === 'status' || lowerQuery === 'where am i' || lowerQuery === "what's next" || lowerQuery === 'whats next' || lowerQuery === 'help me' || lowerQuery === 'what now') {
        const statusMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: getContextSummary(),
          timestamp: new Date(),
          data: { type: 'status', stage: getCurrentWorkflowStage() },
        };
        setMessages(prev => [...prev, statusMsg]);
      }
      // CONTEXTUAL COMMANDS - require current campaign
      // Matches: "fix it", "fix this", "fix the issue", "edit this", "edit it", "fix", "edit", "correct it", "make it compliant"
      else if ((lowerQuery.includes('edit this') || lowerQuery.includes('edit it') ||
                lowerQuery.includes('fix this') || lowerQuery.includes('fix it') ||
                lowerQuery.includes('fix the') || lowerQuery.includes('correct') ||
                lowerQuery.includes('make it compliant') || lowerQuery.includes('remove the') ||
                lowerQuery === 'fix' || lowerQuery === 'edit') && currentCampaign) {
        const stage = getCurrentWorkflowStage();

        // If gate failed, auto-fix
        if (stage === 'gate_failed') {
          await handleAutoFixContent();
        }
        // If has content, show edit options
        else if (currentCampaign.content) {
          const editMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Editing: ${currentCampaign.name}**\n\nWhat would you like to change?\n\n• "Change subject to [new subject]"\n• "Update body to [new text]"\n• "Make it more friendly"\n• "Remove [word]"\n\n**Current:**\n• Subject: "${currentCampaign.content.subject || 'N/A'}"\n• Body: "${(currentCampaign.content.body || '').substring(0, 80)}..."`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, editMsg]);
        } else {
          const noContentMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**No content to edit yet.**\n\nGenerating content for "${currentCampaign.name}"...`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, noContentMsg]);
          await handleContentGeneration();
        }
      }
      // REMOVE WORD command - "remove sex", "delete the word X"
      else if ((lowerQuery.includes('remove') || lowerQuery.includes('delete')) && currentCampaign?.content) {
        // Extract word to remove
        const wordMatch = query.match(/(?:remove|delete)\s+(?:the\s+)?(?:word\s+)?["']?(\w+)["']?/i);
        if (wordMatch) {
          const wordToRemove = wordMatch[1].toLowerCase();
          const currentContent = currentCampaign.content;

          const cleanText = (text: string): string => {
            if (!text) return text;
            const regex = new RegExp(`\\b${wordToRemove}\\w*\\b`, 'gi');
            return text.replace(regex, '').replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
          };

          const fixedContent = {
            subject: cleanText(currentContent.subject || ''),
            body: cleanText(currentContent.body || ''),
            cta: cleanText(currentContent.cta || ''),
          };

          const updatedCampaign = { ...currentCampaign, content: fixedContent };
          setCurrentCampaign(updatedCampaign);
          setInspectorData((prev: any) => ({ ...prev, content: fixedContent, gateResults: [] }));

          const fixedMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Removed "${wordToRemove}" from content.**\n\n---\n\n**Updated Draft:**`,
            timestamp: new Date(),
            data: {
              type: 'content_fixed',
              content: fixedContent,
              brandScore: inspectorData?.brandScore || 85,
              removedWords: [wordToRemove],
              canResubmit: true,
            },
          };
          setMessages(prev => [...prev, fixedMsg]);
        }
      }
      else if ((lowerQuery.includes('publish') || lowerQuery.includes('go live') || lowerQuery.includes('send it') || lowerQuery.includes('launch')) && currentCampaign) {
        // Publish = review + execute
        if (!currentCampaign.content) {
          const needContentMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Publishing "${currentCampaign.name}"**\n\nFirst, let me generate the content...`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, needContentMsg]);
          await handleContentGeneration();
        } else if (!currentCampaign.gateResults || currentCampaign.gateResults.length === 0) {
          const reviewMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: `**Publishing "${currentCampaign.name}"**\n\nSubmitting for 3-Gate approval first...`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, reviewMsg]);
          await handleCampaignReview();
        } else {
          await handleCampaignExecute();
        }
      }
      // NO CAMPAIGN CONTEXT - guide user
      else if (!currentCampaign && (
        lowerQuery.includes('edit') ||
        lowerQuery.includes('publish') ||
        lowerQuery.includes('schedule') ||
        lowerQuery.includes('review') ||
        lowerQuery.includes('execute') ||
        lowerQuery.includes('send') ||
        lowerQuery.includes('launch') ||
        lowerQuery.includes('change') ||
        lowerQuery.includes('fix')
      )) {
        const noCampaignMsg: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `**No campaign in progress.**\n\nI need a campaign to work with. Try:\n\n• "Create a referral campaign for 5-star reviewers"\n• "Create a win-back campaign for inactive customers"\n• "Create a recovery campaign for negative reviews"\n\nOr click one of the **AI Suggestions** in the sidebar.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, noCampaignMsg]);
      }
      else {
        // Default: use AI to understand and respond
        await handleGenericCommand(query);
      }
    } catch (error: any) {
      console.error('Command processing error:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error message:', error?.message);
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `I encountered an error: ${error?.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.filter(m => m.id !== processingMsg.id), errorMsg]);
    } finally {
      setIsLoading(false);
      // Remove processing message
      setMessages(prev => prev.filter(m => m.content !== 'TrustEye is analyzing your request...'));
    }
  };

  // ============================================
  // MARKETING ENGINE INTEGRATION
  // Handles: Patch mode (modify active campaign), Create mode (new assets)
  // DISABLED FOR NOW - Enable after demo testing is complete
  // ============================================
  const tryMarketingEngine = async (query: string): Promise<boolean> => {
    // DISABLED: Return false to let all commands go through existing handlers
    // The engine backend is ready at /api/ai/engine when we want to enable it
    return false;

    /* ENABLE LATER:
    const lowerQuery = query.toLowerCase();

    // VERY CONSERVATIVE: Only use engine for specific patch commands
    const isPatchCommand = currentCampaign && activePage === 'studio' && (
      (lowerQuery.includes('add') && (lowerQuery.includes('sms') || lowerQuery.includes('slack') || lowerQuery.includes('website'))) ||
      (lowerQuery.includes('remove') && (lowerQuery.includes('sms') || lowerQuery.includes('slack') || lowerQuery.includes('email')))
    );

    if (!isPatchCommand) {
      return false;
    }
    */

    try {
      // Build context for the engine
      const activeDraft = currentCampaign ? {
        type: 'campaign' as const,
        fields: {
          name: currentCampaign.name,
          type: currentCampaign.campaignType || currentCampaign.type,
          channels: currentCampaign.channels || [currentCampaign.channel],
          audience: currentCampaign.audienceDescription,
          schedule: currentCampaign.schedule,
          content: currentCampaign.content ? 'has content' : undefined
        }
      } : undefined;

      console.log('[MarketingEngine] Calling engine with:', { query, activeDraft });

      const response = await fetch(`${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:3009'}'}/api/ai/engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          activeDraft,
          brandId: 'premier-nissan'
        })
      });

      if (!response.ok) {
        console.warn('[MarketingEngine] API error, falling back to existing handlers');
        return false;
      }

      const result = await response.json();
      console.log('[MarketingEngine] Response:', result);

      if (!result.success) {
        return false;
      }

      // Handle different modes
      switch (result.mode) {
        case 'patch':
          await handleEnginePatch(result.data, result.message);
          return true;

        case 'create':
          await handleEngineCreate(result.data, result.message);
          return true;

        case 'match':
          await handleEngineMatch(result.data, result.message);
          return true;

        case 'rag':
          // Show RAG answer as a message
          const ragMsg: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: result.message,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, ragMsg]);
          return true;

        case 'clarify':
        default:
          // Fall through to existing handlers
          return false;
      }
    } catch (error) {
      console.error('[MarketingEngine] Error:', error);
      return false; // Fall through to existing handlers
    }
  };

  // Handle patch mode from engine
  const handleEnginePatch = async (patch: any, message: string) => {
    if (!currentCampaign) return;

    // Show confirmation with action buttons
    const patchMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `**Suggested Change**\n\n${message}\n\n*Click Apply to confirm, or type a different command.*`,
      timestamp: new Date(),
      data: {
        type: 'patch_confirmation',
        patch,
        actions: [
          { label: 'Apply', action: 'apply_patch', primary: true },
          { label: 'Cancel', action: 'cancel_patch' }
        ]
      }
    };
    setMessages(prev => [...prev, patchMsg]);

    // Auto-apply high confidence patches (> 0.9)
    if (patch.confidence >= 0.9) {
      await applyPatch(patch);
    }
  };

  // Apply a patch to the current campaign
  const applyPatch = async (patch: any) => {
    if (!currentCampaign) return;

    const updated = { ...currentCampaign };

    switch (patch.action) {
      case 'set':
        (updated as any)[patch.field] = patch.value;
        break;
      case 'add':
        if (Array.isArray((updated as any)[patch.field])) {
          (updated as any)[patch.field] = [...(updated as any)[patch.field], patch.value];
        } else {
          (updated as any)[patch.field] = [patch.value];
        }
        break;
      case 'remove':
        if (Array.isArray((updated as any)[patch.field])) {
          (updated as any)[patch.field] = (updated as any)[patch.field].filter(
            (v: any) => v !== patch.value
          );
        }
        break;
    }

    // Update state
    setCurrentCampaign(updated);

    // Update inspector
    if (patch.field === 'channels') {
      const channelDisplay = (updated.channels || []).map((c: string) =>
        c.charAt(0).toUpperCase() + c.slice(1)
      ).join(' + ');
      setInspectorData((prev: any) => ({ ...prev, channels: updated.channels, channel: channelDisplay }));
      setWorkflowState(prev => ({ ...prev, channels: updated.channels, channel: channelDisplay }));
    } else if (patch.field === 'audience') {
      setInspectorData((prev: any) => ({ ...prev, audienceDescription: patch.value }));
      setWorkflowState(prev => ({ ...prev, audience: patch.value }));
    }

    // Confirm
    const confirmMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `✅ **Applied:** ${patch.field} updated to ${JSON.stringify(patch.value)}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  // Handle create mode from engine
  const handleEngineCreate = async (asset: any, message: string) => {
    const createMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `🎉 **${message}**\n\n**Type:** ${asset.type}\n**Name:** ${asset.name}\n${asset.description ? `**Description:** ${asset.description}\n` : ''}${asset.tags?.length ? `**Tags:** ${asset.tags.join(', ')}\n` : ''}\n\n*This pattern is now saved. Next time you ask for something similar, I'll find it instantly!*`,
      timestamp: new Date(),
      data: {
        type: 'created_asset',
        asset
      }
    };
    setMessages(prev => [...prev, createMsg]);

    // If it's an audience, offer to use it
    if (asset.type === 'audience' && currentCampaign) {
      const useMsg: Message = {
        id: `assistant-${Date.now() + 1}`,
        type: 'assistant',
        content: `Would you like to use "${asset.name}" as the audience for your current campaign?`,
        timestamp: new Date(),
        data: {
          type: 'action_prompt',
          actions: [
            { label: 'Use This Audience', action: 'use_audience', data: asset },
            { label: 'Keep Current', action: 'dismiss' }
          ]
        }
      };
      setMessages(prev => [...prev, useMsg]);
    }
  };

  // Handle match mode from engine
  const handleEngineMatch = async (asset: any, message: string) => {
    const matchMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `🔍 **${message}**\n\n**Name:** ${asset.name}\n${asset.description ? `**Description:** ${asset.description}\n` : ''}${asset.criteria ? `**Criteria:** ${typeof asset.criteria === 'string' ? asset.criteria : JSON.stringify(asset.criteria)}\n` : ''}\n\n*This is a learned pattern from previous usage.*`,
      timestamp: new Date(),
      data: {
        type: 'matched_asset',
        asset,
        actions: [
          { label: 'Use This', action: 'use_match', primary: true },
          { label: 'Create New Instead', action: 'create_new' }
        ]
      }
    };
    setMessages(prev => [...prev, matchMsg]);
  };

  // Smart Campaign Creation - parses any create command and builds campaign
  const handleSmartCampaignCreate = async (query: string) => {
    const lowerQuery = query.toLowerCase();

    // Parse campaign type from query
    let campaignType = 'custom'; // Default to custom, will be overridden if known type detected
    let campaignLabel = ''; // AI-derived friendly label for display
    let audienceDescription = 'target customers';
    let channels: string[] = ['email'];
    let requestedChannels: string[] = ['email']; // Track what user asked for
    let isCustomType = true; // Track if this is a custom/unknown type

    // Detect campaign type - known types
    if (lowerQuery.includes('winback') || lowerQuery.includes('win back') || lowerQuery.includes('win-back') || lowerQuery.includes('inactive') || lowerQuery.includes('lapsed')) {
      campaignType = 'win-back';
      campaignLabel = 'Win-Back';
      audienceDescription = 'Inactive customers (90+ days)';
      isCustomType = false;
    } else if (lowerQuery.includes('recovery') || lowerQuery.includes('bad review') || lowerQuery.includes('negative') || lowerQuery.includes('unhappy')) {
      campaignType = 'recovery';
      campaignLabel = 'Recovery';
      audienceDescription = 'Customers with negative reviews';
      isCustomType = false;
    } else if (lowerQuery.includes('referral') || lowerQuery.includes('5 star') || lowerQuery.includes('happy')) {
      campaignType = 'referral';
      campaignLabel = 'Referral';
      audienceDescription = '5-star reviewers';
      isCustomType = false;
    } else if (lowerQuery.includes('conquest') || lowerQuery.includes('competitor')) {
      campaignType = 'conquest';
      campaignLabel = 'Conquest';
      audienceDescription = 'Competitor customers';
      isCustomType = false;
    } else if (lowerQuery.includes('birthday')) {
      campaignType = 'birthday';
      campaignLabel = 'Birthday';
      audienceDescription = 'Customers with birthdays this month';
      isCustomType = false;
    } else if (lowerQuery.includes('welcome') || lowerQuery.includes('new customer')) {
      campaignType = 'welcome';
      campaignLabel = 'Welcome';
      audienceDescription = 'New customers';
      isCustomType = false;
    } else if (lowerQuery.includes('holiday') || lowerQuery.includes('christmas') || lowerQuery.includes('thanksgiving') || lowerQuery.includes('new year') || lowerQuery.includes('seasonal')) {
      campaignType = 'holiday';
      // Extract the holiday type from query
      if (lowerQuery.includes('december') || lowerQuery.includes('christmas')) {
        campaignLabel = 'December Holiday';
      } else if (lowerQuery.includes('thanksgiving')) {
        campaignLabel = 'Thanksgiving';
      } else if (lowerQuery.includes('new year')) {
        campaignLabel = 'New Year';
      } else {
        campaignLabel = 'Holiday';
      }
      isCustomType = false;
    } else if (lowerQuery.includes('service') || lowerQuery.includes('maintenance') || lowerQuery.includes('reminder')) {
      campaignType = 'service';
      campaignLabel = 'Service Reminder';
      audienceDescription = 'Customers due for service';
      isCustomType = false;
    } else if (lowerQuery.includes('loyalty') || lowerQuery.includes('vip') || lowerQuery.includes('reward') || lowerQuery.includes('points')) {
      campaignType = 'loyalty';
      campaignLabel = 'Loyalty';
      isCustomType = false;
      // Detect event-based audience from query
      if (lowerQuery.includes('booking') || lowerQuery.includes('appointment')) {
        audienceDescription = 'Appointment Bookers';
      } else if (lowerQuery.includes('website') || lowerQuery.includes('visitor')) {
        audienceDescription = 'Website Visitors';
      } else if (lowerQuery.includes('purchase') || lowerQuery.includes('buy')) {
        audienceDescription = 'Purchase Events';
      } else if (lowerQuery.includes('service') || lowerQuery.includes('complete')) {
        audienceDescription = 'Service Completers';
      } else {
        audienceDescription = 'Loyalty Program Members';
      }
    }

    // If custom type, derive a smart label from the query
    if (isCustomType) {
      campaignType = 'custom';
      // Extract key phrases to create a meaningful label
      const cleanQuery = query
        .replace(/^(create|make|build|start|launch)\s+(a\s+)?/i, '')
        .replace(/\s+campaign.*$/i, '')
        .replace(/\s+for\s+.*$/i, '')
        .trim();
      // Capitalize first letter of each word
      campaignLabel = cleanQuery
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .substring(0, 30) || 'Custom Campaign';
      // Try to extract audience from "for X" pattern
      const forMatch = query.match(/for\s+(.+?)(?:\s+campaign|\s*$)/i);
      if (forMatch) {
        audienceDescription = forMatch[1].trim();
      }
    }

    // Detect channels from query
    requestedChannels = ['email']; // Always start with email
    if (lowerQuery.includes('slack')) requestedChannels.push('slack');
    if (lowerQuery.includes('sms') || lowerQuery.includes('text')) requestedChannels.push('sms');
    if (lowerQuery.includes('site') || lowerQuery.includes('website') || lowerQuery.includes('banner')) requestedChannels.push('website');
    if (lowerQuery.includes('push')) requestedChannels.push('push');

    // Validate channels against available integrations
    const validChannels = requestedChannels.filter(c => AVAILABLE_CHANNELS.includes(c.toLowerCase()));
    const invalidChannels = requestedChannels.filter(c => !AVAILABLE_CHANNELS.includes(c.toLowerCase()));
    channels = validChannels.length > 0 ? validChannels : ['email'];

    // Extract custom content instructions from query
    let customInstructions: string[] = [];

    // Detect discount/offer mentions
    const discountMatch = query.match(/(\d+)%?\s*(off|discount|percent)/i);
    if (discountMatch) {
      customInstructions.push(`Include a ${discountMatch[1]}% discount offer`);
    }

    // Detect specific dollar amounts
    const dollarMatch = query.match(/\$(\d+)/);
    if (dollarMatch) {
      customInstructions.push(`Include a $${dollarMatch[1]} offer or credit`);
    }

    // Detect urgency keywords
    if (lowerQuery.includes('urgent') || lowerQuery.includes('limited time') || lowerQuery.includes('expires')) {
      customInstructions.push('Add urgency messaging (limited time offer)');
    }

    // Detect tone preferences
    if (lowerQuery.includes('friendly') || lowerQuery.includes('warm')) {
      customInstructions.push('Use a warm, friendly tone');
    } else if (lowerQuery.includes('professional') || lowerQuery.includes('formal')) {
      customInstructions.push('Use a professional, formal tone');
    } else if (lowerQuery.includes('casual') || lowerQuery.includes('fun')) {
      customInstructions.push('Use a casual, fun tone');
    }

    // Detect specific CTA requests
    const ctaMatch = query.match(/(?:cta|call to action|button)\s*[:\s]+["']?([^"']+)["']?/i);
    if (ctaMatch) {
      customInstructions.push(`Use CTA: "${ctaMatch[1].trim()}"`);
    }

    // Combine custom instructions for content generation
    const customContentInstructions = customInstructions.length > 0
      ? customInstructions.join('. ')
      : null;

    // Detect audience from query - create dynamic audience description
    const audienceKeywords = {
      'bad review': 'Customers who left negative reviews',
      'negative review': 'Customers who left negative reviews',
      '1 star': 'Customers who left 1-star reviews',
      '2 star': 'Customers who left 2-star reviews',
      'good review': 'Customers who left positive reviews',
      'positive review': 'Customers who left positive reviews',
      '5 star': 'Customers who left 5-star reviews',
      'inactive': 'Customers inactive for 90+ days',
      'haven\'t visited': 'Customers who haven\'t visited recently',
      '90 day': 'Customers inactive for 90+ days',
      'churned': 'Churned customers',
      'at risk': 'At-risk customers',
      'high value': 'High-value customers',
      'vip': 'VIP customers',
      'new': 'New customers',
    };

    // Find matching audience description
    for (const [keyword, desc] of Object.entries(audienceKeywords)) {
      if (lowerQuery.includes(keyword)) {
        audienceDescription = desc;
        break;
      }
    }

    // Get audience data based on type
    let audienceSize = 0;
    let reviewData: any[] = [];
    let audienceId: string | null = null;
    let audienceName = '';
    let audienceConditions: Record<string, any> = {};
    let isNewAudience = false;

    if (campaignType === 'recovery' || audienceDescription.includes('negative')) {
      const reviewsResponse = await aiApi.getReviews(undefined, { maxRating: 2 });
      reviewData = reviewsResponse.data || [];
      audienceSize = reviewData.length;
      audienceName = 'Negative Review Customers';
      audienceDescription = `${audienceSize} customers with negative reviews`;
      audienceConditions = { reviewRating: { max: 2 }, source: 'birdeye' };
    } else if (campaignType === 'referral' || audienceDescription.includes('5-star') || audienceDescription.includes('positive')) {
      const reviewsResponse = await aiApi.getReviews(undefined, { minRating: 5 });
      reviewData = reviewsResponse.data || [];
      audienceSize = reviewData.length;
      audienceName = '5-Star Reviewers';
      audienceDescription = `${audienceSize} 5-star reviewers`;
      audienceConditions = { reviewRating: { min: 5 }, source: 'birdeye' };
    } else if (campaignType === 'win-back') {
      audienceSize = 847; // From CRM data
      audienceName = 'Inactive 90+ Days';
      audienceDescription = `847 customers inactive 90+ days`;
      audienceConditions = { inactiveDays: { min: 90 }, source: 'crm' };
    } else if (campaignType === 'conquest') {
      audienceSize = 500;
      audienceName = 'Competitor Customers';
      audienceDescription = 'Customers from competitor dealerships';
      audienceConditions = { source: 'conquest_list', competitor: true };
    } else if (isCustomType) {
      // For custom campaigns, derive audience name from description
      audienceSize = Math.floor(Math.random() * 500) + 100; // Simulated
      audienceName = audienceDescription || 'Custom Audience';
      // Extract conditions from user query if possible
      const timeMatch = query.match(/(\d+)\s*(day|week|month)s?\s*(ago|inactive)?/i);
      if (timeMatch) {
        const days = parseInt(timeMatch[1]) * (timeMatch[2].toLowerCase() === 'week' ? 7 : timeMatch[2].toLowerCase() === 'month' ? 30 : 1);
        audienceConditions = { inactiveDays: { min: days }, source: 'dynamic' };
      } else {
        audienceConditions = { source: 'dynamic', query: query };
      }
    } else {
      audienceSize = 500; // Default estimate
      audienceName = 'General Audience';
      audienceConditions = { source: 'default' };
    }

    // Dynamically create or find audience in database
    try {
      const audienceResult = await audiencesApi.findOrCreate(
        audienceName,
        audienceDescription,
        audienceConditions,
        audienceSize
      );
      if (audienceResult.success && audienceResult.data) {
        audienceId = audienceResult.data.id;
        isNewAudience = audienceResult.created || false;
        // Update size from database if existing
        if (!isNewAudience && audienceResult.data.estimated_size) {
          audienceSize = audienceResult.data.estimated_size;
        }
      }
    } catch (e) {
      console.error('Failed to create/find audience:', e);
    }

    // Create campaign draft - use AI-derived label for display
    const displayLabel = campaignLabel || campaignType.charAt(0).toUpperCase() + campaignType.slice(1).replace('-', ' ');
    const campaignName = `${displayLabel} Campaign - ${new Date().toLocaleDateString()}`;

    // Format channel display string
    const channelDisplay = channels.length > 1 ? channels.join(' + ') : channels[0] || 'Email';

    // Fetch "What Changed" - THE DIFFERENTIATOR
    // For custom types, use 'promotional' learnings as fallback
    let whatChangedData = null;
    try {
      const feedbackType = isCustomType ? 'promotional' : campaignType;
      const feedbackResponse = await aiApi.getWhatChanged(feedbackType);
      if (feedbackResponse.success && feedbackResponse.data) {
        whatChangedData = feedbackResponse.data;
      }
    } catch (e) {
      console.error('Failed to fetch what changed:', e);
    }

    // Check if this is an event-based campaign (loyalty, etc.)
    const isEventBased = campaignType === 'loyalty';

    const campaignData = {
      type: 'campaign_created',
      name: campaignName,
      campaignType: campaignType, // For backend (could be 'custom')
      campaignLabel: displayLabel, // AI-derived label for display
      isCustomType: isCustomType, // Flag to indicate custom campaign
      isEventBased: isEventBased, // Flag for event-triggered campaigns
      audienceId: audienceId, // Database audience ID
      audienceName: audienceName, // Audience name
      audienceSize: isEventBased ? 0 : audienceSize,
      audienceDescription: audienceDescription,
      isNewAudience: isNewAudience, // Flag to indicate dynamically created audience
      channel: channelDisplay,
      channels: channels,
      requestedChannels: requestedChannels, // Track original request
      status: 'draft',
      reviews: reviewData.slice(0, 3).map((r: any) => ({
        ...r,
        customerName: `${r.reviewer?.firstName || 'Customer'} ${r.reviewer?.lastName || ''}`.trim(),
        review: r.comments || r.review || '',
      })),
      content: null, // Content not generated yet
      brandScore: null,
      missingSteps: ['content'], // Track what's missing
      whatChanged: whatChangedData, // Feedback loop data
      customContentInstructions: customContentInstructions, // AI-extracted content instructions
      originalQuery: query, // Preserve full user query for AI content generation
    };

    setCurrentCampaign(campaignData);
    setInspectorData(campaignData);
    setInspectorType('campaign');

    // Update workflow state with all parsed info
    setWorkflowState({
      campaignType: campaignType,
      campaignName: campaignName,
      audience: audienceDescription,
      audienceDescription: audienceDescription,
      audienceSize: isEventBased ? 0 : audienceSize, // Event-based has no fixed size
      isEventBased: isEventBased,
      messaging: campaignType,
      channel: channelDisplay,
      channels: requestedChannels, // Include requested channels for validation display
      timing: isEventBased ? 'Ongoing (Always Active)' : 'immediate', // Default timing
      hasContent: false,
    });

    // Build response message showing what was created and what's needed
    let responseContent = `**Campaign Created: ${campaignName}**\n\n`;
    responseContent += `**What I understood:**\n`;
    responseContent += `• Type: ${displayLabel}${isCustomType ? ' (AI-derived)' : ''}${isEventBased ? ' (Event-based)' : ''}\n`;
    if (isEventBased) {
      responseContent += `• Trigger: ${audienceDescription} (event-triggered)\n`;
      responseContent += `• Schedule: Ongoing - activates when event occurs\n`;
    } else {
      responseContent += `• Audience: ${audienceName} (${audienceSize.toLocaleString()} customers)${isNewAudience ? ' ✨ NEW' : ''}\n`;
    }
    responseContent += `• Channels: ${channels.join(', ')}\n`;

    // Show extracted content instructions
    if (customInstructions.length > 0) {
      responseContent += `\n**Content instructions detected:**\n`;
      customInstructions.forEach(instruction => {
        responseContent += `• ${instruction}\n`;
      });
    }

    // Warn about invalid channels
    if (invalidChannels.length > 0) {
      responseContent += `\n**Channel Notice:**\n`;
      responseContent += `"${invalidChannels.join(', ')}" is not configured yet. Only these channels are available: **${AVAILABLE_CHANNELS.join(', ')}**.\n`;
      responseContent += `Go to Integrations to add more channels.\n`;
    }

    responseContent += '\n';

    if (reviewData.length > 0) {
      responseContent += `**Real customer data from Birdeye:**\n`;
      reviewData.slice(0, 3).forEach((r: any) => {
        const name = `${r.reviewer?.firstName || 'Customer'} ${r.reviewer?.lastName || ''}`.trim();
        const review = (r.comments || r.review || '').substring(0, 60);
        responseContent += `• ${name} (${r.rating}★) - "${review}..."\n`;
      });
      responseContent += '\n';
    }

    responseContent += `**Next steps:**\n`;
    responseContent += `1. Generate content → say "generate content" or "create email"\n`;
    responseContent += `2. Review & publish → say "review" or "submit for approval"\n\n`;
    responseContent += `Or I can generate content now - just say **"yes"** or **"generate content"**`;

    const responseMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      data: campaignData,
    };
    setMessages(prev => [...prev, responseMsg]);
  };

  // Handle Referral Campaign from 5-star reviews
  const handleReferralCampaign = async (query: string) => {
    // Get 5-star reviews from Birdeye
    const reviewsResponse = await aiApi.getReviews(undefined, { minRating: 5 });
    const fiveStarReviews = reviewsResponse.data || [];

    // Generate content
    const contentResponse = await aiApi.generateContent({
      campaignType: 'referral',
      audience: `5-star reviewers (${fiveStarReviews.length} customers)`,
      channels: ['email'],
      goal: 'Ask happy customers for referrals',
      brandId: 'premier-nissan',
    });

    const content = contentResponse.data;
    setGeneratedContent(content || null);

    // Update workflow state
    setWorkflowState({
      goal: 'Referral from 5-star reviews',
      audience: `${fiveStarReviews.length} 5-star reviewers`,
      channel: 'Email',
      messaging: 'Referral request',
    });

    // Map reviews to include customerName for display
    const mappedReviews = fiveStarReviews.map((r: any) => ({
      ...r,
      customerName: `${r.reviewer?.firstName || 'Customer'} ${r.reviewer?.lastName || ''}`.trim(),
      review: r.comments || r.review || '',
    }));

    // Create campaign
    const campaignData = {
      type: 'campaign_created',
      name: 'Referral Campaign - Happy Customers',
      campaignType: 'referral',
      audienceSize: fiveStarReviews.length,
      channel: 'Email',
      status: 'draft',
      reviews: mappedReviews.slice(0, 3),
      content: content?.email,
      brandScore: content?.brandScore || 85,
      brandScoreDetails: content?.brandScoreDetails,
    };

    setCurrentCampaign(campaignData);
    setInspectorData(campaignData);
    setInspectorType('campaign');

    // Add messages
    const responseMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `I found **${fiveStarReviews.length} customers** who left 5-star reviews. These happy customers are perfect for referral outreach!\n\n**Real customers from Birdeye:**\n${mappedReviews.slice(0, 3).map((r: any) => `• ${r.customerName} - "${(r.review || '').substring(0, 50)}..."`).join('\n')}\n\nI've generated referral email content with a **${content?.brandScore || 85}% brand alignment score**.`,
      timestamp: new Date(),
      data: campaignData,
    };
    setMessages(prev => [...prev, responseMsg]);
  };

  // Handle Recovery Campaign from negative reviews
  const handleRecoveryCampaign = async (query: string) => {
    // Get 1-2 star reviews from Birdeye
    const reviewsResponse = await aiApi.getReviews(undefined, { maxRating: 2 });
    const negativeReviews = reviewsResponse.data || [];

    // Generate recovery content
    const contentResponse = await aiApi.generateContent({
      campaignType: 'recovery',
      audience: `Negative reviewers (${negativeReviews.length} customers)`,
      channels: ['email'],
      goal: 'Recovery outreach to turn detractors into promoters',
      brandId: 'premier-nissan',
    });

    const content = contentResponse.data;
    setGeneratedContent(content || null);

    // Map reviews to include customerName for display
    const mappedReviews = negativeReviews.map((r: any) => ({
      ...r,
      customerName: `${r.reviewer?.firstName || 'Customer'} ${r.reviewer?.lastName || ''}`.trim(),
      review: r.comments || r.review || '',
    }));

    setWorkflowState({
      goal: 'Recovery from negative reviews',
      audience: `${negativeReviews.length} negative reviewers`,
      channel: 'Email',
      messaging: 'Service recovery',
    });

    const campaignData = {
      type: 'campaign_created',
      name: 'Recovery Campaign - Win Back Unhappy Customers',
      campaignType: 'recovery',
      audienceSize: negativeReviews.length,
      channel: 'Email',
      status: 'draft',
      reviews: mappedReviews.slice(0, 3),
      content: content?.email,
      brandScore: content?.brandScore || 85,
      brandScoreDetails: content?.brandScoreDetails,
    };

    setCurrentCampaign(campaignData);
    setInspectorData(campaignData);
    setInspectorType('campaign');

    const responseMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `I found **${negativeReviews.length} customers** who need recovery outreach.\n\n**Customers from Birdeye:**\n${mappedReviews.slice(0, 3).map((r: any) => `• ${r.customerName} (${r.rating}★) - "${(r.review || '').substring(0, 50)}..."`).join('\n')}\n\n70% of complaining customers will return if you resolve their issue. I've created a recovery email with a **${content?.brandScore || 85}% brand score**.`,
      timestamp: new Date(),
      data: campaignData,
    };
    setMessages(prev => [...prev, responseMsg]);
  };

  // Handle Conquest Campaign targeting competitor customers
  const handleConquestCampaign = async (query: string) => {
    const contentResponse = await aiApi.generateContent({
      campaignType: 'conquest',
      audience: 'Customers frustrated with competitor wait times',
      channels: ['email'],
      goal: 'Highlight Premier Nissan speed advantage: 1.8hr vs Valley Honda 2.5hr',
      brandId: 'premier-nissan',
    });

    const content = contentResponse.data;
    setGeneratedContent(content || null);

    setWorkflowState({
      goal: 'Conquest - Beat Valley Honda',
      audience: 'Valley Honda customers',
      channel: 'Email',
      messaging: 'Speed advantage highlight',
    });

    const campaignData = {
      type: 'campaign_created',
      name: 'Conquest Campaign - Speed Advantage',
      campaignType: 'conquest',
      audienceSize: 1230,
      channel: 'Email',
      status: 'draft',
      competitorData: {
        name: 'Valley Honda',
        waitTime: '2.5hr',
        ourWaitTime: '1.8hr',
        reviews: 1230,
      },
      content: content?.email,
      brandScore: content?.brandScore || 85,
      brandScoreDetails: content?.brandScoreDetails,
    };

    setCurrentCampaign(campaignData);
    setInspectorData(campaignData);
    setInspectorType('campaign');

    const responseMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `**Conquest Opportunity Identified!**\n\nValley Honda customers are frustrated with their **2.5 hour** average wait time. Premier Nissan's advantage: **1.8 hours** average.\n\n**Competitor Intel:**\n• Valley Honda: 1,230 reviews\n• Avg wait: 2.5 hours vs our 1.8 hours\n• Labor rate: $145/hr vs our $125/hr\n\nI've created conquest content highlighting your speed advantage with a **${content?.brandScore || 85}% brand score**.`,
      timestamp: new Date(),
      data: campaignData,
    };
    setMessages(prev => [...prev, responseMsg]);
  };

  // Handle Win-back Campaign for inactive customers
  const handleWinbackCampaign = async (query: string) => {
    const contentResponse = await aiApi.generateContent({
      campaignType: 'win-back',
      audience: { name: 'Inactive 90+ Days', count: 847 },
      channels: ['email', 'sms'],
      goal: 'Re-engage inactive customers with service discount',
      brandId: 'premier-nissan',
    });

    const content = contentResponse.data;
    setGeneratedContent(content || null);

    setWorkflowState({
      goal: 'Win back inactive customers',
      audience: '847 inactive (90+ days)',
      channel: 'Email + SMS',
      messaging: 'Service discount offer',
    });

    const campaignData = {
      type: 'campaign_created',
      name: 'Win-Back Campaign - Inactive Customers',
      campaignType: 'win-back',
      audienceSize: 847,
      channel: 'Email + SMS',
      status: 'draft',
      content: content?.email,
      brandScore: content?.brandScore || 85,
      brandScoreDetails: content?.brandScoreDetails,
    };

    setCurrentCampaign(campaignData);
    setInspectorData(campaignData);
    setInspectorType('campaign');

    const responseMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `I've identified **847 customers** who haven't visited in 90+ days.\n\nBased on Q3 data, win-back campaigns achieve:\n• 28.5% open rate\n• 6.1% conversion rate\n• $23,250 potential revenue\n\nI've generated multi-channel content (email + SMS) with a **${content?.brandScore || 85}% brand score**.`,
      timestamp: new Date(),
      data: campaignData,
    };
    setMessages(prev => [...prev, responseMsg]);
  };

  // Handle Auto-Fix Content - removes blocked words and resubmits
  const handleAutoFixContent = async () => {
    const gateResults = currentCampaign?.gateResults || inspectorData?.gateResults || [];
    const failedGate = gateResults.find((g: any) => g.passed === false);
    const currentContent = currentCampaign?.content || inspectorData?.content;

    // Build list of blocked words
    const profanityList = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'hell', 'bastard', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut', 'asshole', 'bullshit', 'goddamn', 'sex', 'sexual', 'explicit', 'porn', 'xxx', 'nude', 'erotic', 'kill', 'hurt', 'attack', 'destroy', 'violence', 'threat'];
    const problemWords: string[] = [];

    // Find words from failure reasons
    const allReasons = [
      failedGate?.details?.error || '',
      ...(failedGate?.details?.guardrailBlockers || [])
    ].join(' ').toLowerCase();
    profanityList.forEach(word => {
      if (allReasons.includes(word)) problemWords.push(word);
    });

    // Also check content
    if (currentContent) {
      const contentText = `${currentContent.subject || ''} ${currentContent.body || ''} ${currentContent.cta || ''}`.toLowerCase();
      profanityList.forEach(word => {
        if (contentText.includes(word) && !problemWords.includes(word)) {
          problemWords.push(word);
        }
      });
    }

    // Clean function
    const cleanText = (text: string): string => {
      if (!text) return text;
      let cleaned = text;
      problemWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
        cleaned = cleaned.replace(regex, '').replace(/\s+/g, ' ').trim();
      });
      return cleaned.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
    };

    if (currentContent && currentCampaign) {
      const fixedContent = {
        subject: cleanText(currentContent.subject || ''),
        body: cleanText(currentContent.body || ''),
        cta: cleanText(currentContent.cta || ''),
      };

      // Update state
      const updatedCampaign = { ...currentCampaign, content: fixedContent };
      setCurrentCampaign(updatedCampaign);
      setInspectorData((prev: any) => ({ ...prev, content: fixedContent, gateResults: [] }));

      // Update in database
      if (currentCampaign.id) {
        try {
          await campaignsApi.update(currentCampaign.id, { content: fixedContent });
        } catch (e) {
          console.error('Failed to update campaign:', e);
        }
      }

      // Show fixed message
      const fixedMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `**Content Fixed!**\n\nRemoved: ${problemWords.length > 0 ? `"${problemWords.join('", "')}"` : 'problematic content'}\n\n---\n\n**Corrected Draft:**`,
        timestamp: new Date(),
        data: {
          type: 'content_fixed',
          content: fixedContent,
          brandScore: inspectorData?.brandScore || 85,
          removedWords: problemWords,
          canResubmit: true,
        },
      };
      setMessages(prev => [...prev, fixedMsg]);
    } else {
      // No content - regenerate
      await handleContentGeneration();
    }
  };

  // Handle Multi-Channel Content Generation (from command)
  const handleMultiChannelContentGeneration = async (query: string) => {
    console.log('[handleMultiChannelContentGeneration] Starting with query:', query);
    const lowerQuery = query.toLowerCase();

    // PRIORITY: If we have a current campaign, use handleContentGeneration instead
    // This preserves campaign context (type, audience, etc.)
    if (currentCampaign && (lowerQuery === 'generate content' || lowerQuery === 'create content' || lowerQuery === 'yes')) {
      console.log('[handleMultiChannelContentGeneration] Delegating to handleContentGeneration');
      await handleContentGeneration();
      return;
    }

    // Extract channel(s) from query
    const channels: string[] = [];
    if (lowerQuery.includes('email')) channels.push('email');
    if (lowerQuery.includes('sms') || lowerQuery.includes('text message')) channels.push('sms');
    if (lowerQuery.includes('instagram') || lowerQuery.includes('social') || lowerQuery.includes('post')) channels.push('social');
    console.log('[handleMultiChannelContentGeneration] Detected channels:', channels);

    // Default to current campaign channels or all channels
    if (channels.length === 0) {
      if (currentCampaign?.channels) {
        channels.push(...currentCampaign.channels);
      } else {
        channels.push('email', 'sms', 'social');
      }
    }

    // Extract campaign type from query, fall back to current campaign type
    let campaignType = currentCampaign?.campaignType || 'promotional';
    if (lowerQuery.includes('referral')) campaignType = 'referral';
    else if (lowerQuery.includes('recovery') || lowerQuery.includes('negative')) campaignType = 'recovery';
    else if (lowerQuery.includes('win-back') || lowerQuery.includes('winback') || lowerQuery.includes('inactive')) campaignType = 'win-back';
    else if (lowerQuery.includes('conquest') || lowerQuery.includes('competitor')) campaignType = 'conquest';
    else if (lowerQuery.includes('welcome')) campaignType = 'welcome';
    else if (lowerQuery.includes('loyalty') || lowerQuery.includes('vip')) campaignType = 'loyalty';
    else if (lowerQuery.includes('service') || lowerQuery.includes('maintenance')) campaignType = 'service';
    else if (lowerQuery.includes('birthday')) campaignType = 'birthday';
    else if (lowerQuery.includes('holiday') || lowerQuery.includes('seasonal')) campaignType = 'promotional';

    // Extract custom instructions (anything after "about", "for", "with")
    let customInstructions = currentCampaign?.customContentInstructions || '';
    const instructionPatterns = [
      /(?:about|for|with|regarding)\s+(.+?)(?:\s+for\s+|\s+to\s+|$)/i,
      /(?:holiday|seasonal|special)\s+(.+?)(?:\s+for\s+|\s+to\s+|$)/i,
    ];
    for (const pattern of instructionPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        customInstructions = match[1].trim();
        break;
      }
    }

    // Extract audience hint, fall back to current campaign audience
    let audience = currentCampaign?.audienceDescription || currentCampaign?.audience || 'target customers';
    const audiencePatterns = [
      /for\s+(.+?)\s+(?:customers?|users?|audience)/i,
      /(?:targeting|to)\s+(.+?)\s+(?:customers?|users?)/i,
    ];
    for (const pattern of audiencePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        audience = match[1].trim() + ' customers';
        break;
      }
    }

    // Show generating message
    const generatingMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `**Generating ${channels.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')} content...**\n\nCampaign type: ${campaignType}\nApplying brand voice and tone guidelines...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, generatingMsg]);

    try {
      // Use original query from campaign for full context
      const campaignGoal = currentCampaign?.originalQuery || query;
      console.log('[handleMultiChannelContentGeneration] API params:', { campaignType, audience, channels, goal: campaignGoal });

      const contentResponse = await aiApi.generateContent({
        campaignType,
        audience,
        channels,
        goal: campaignGoal,
        brandId: 'premier-nissan',
        customInstructions: customInstructions || undefined,
      });

      console.log('[handleMultiChannelContentGeneration] API response:', contentResponse);
      let content = contentResponse.data;
      setGeneratedContent(content || null);

      // Generate image for social posts
      if (content?.social && channels.includes('social')) {
        console.log('[handleMultiChannelContentGeneration] Generating image for social post...');
        try {
          const imagePrompt = `Marketing image for ${campaignType} campaign: ${content.social.post.substring(0, 100)}`;
          const imageResponse = await imageApi.generate({
            prompt: imagePrompt,
            channel: 'instagram',
            brandContext: {
              primaryColor: '#1e40af',
              style: 'professional, modern, automotive',
              industry: 'automotive dealership',
            },
            count: 1,
          });
          if (imageResponse.success && imageResponse.data?.images?.[0]?.url) {
            console.log('[handleMultiChannelContentGeneration] Image generated:', imageResponse.data.images[0].url);
            content = {
              ...content,
              social: {
                ...content.social,
                imageUrl: imageResponse.data.images[0].url,
              },
            };
            setGeneratedContent(content);
          }
        } catch (imgError) {
          console.warn('[handleMultiChannelContentGeneration] Image generation failed, continuing without image:', imgError);
        }
      }

      // Build response showing all channels
      let responseContent = `**Content Generated!** Brand Score: **${content?.brandScore || 85}%**\n\n`;

      if (content?.email) {
        responseContent += `### Email\n`;
        responseContent += `**Subject:** ${content.email.subject}\n`;
        responseContent += `**Preview:** ${(content.email.body || '').substring(0, 150)}...\n\n`;
      }

      if (content?.sms) {
        responseContent += `### SMS (${content.sms.message.length}/160 chars)\n`;
        responseContent += `${content.sms.message}\n\n`;
      }

      if (content?.social) {
        responseContent += `### Social${content.social.imageUrl ? ' (with image)' : ''}\n`;
        responseContent += `${content.social.post}\n`;
        responseContent += `${content.social.hashtags?.map(h => h.startsWith('#') ? h : `#${h}`).join(' ') || ''}\n`;
        if (content.social.imageUrl) {
          responseContent += `\n📸 *Image generated - see preview panel →*\n`;
        }
        responseContent += '\n';
      }

      // Website Banner - uses email content for banner
      if (channels.includes('website')) {
        responseContent += `### 🌐 Website Banner\n`;
        responseContent += `**Headline:** ${content?.email?.subject || content?.social?.post?.substring(0, 50) || 'New Promotion'}\n`;
        responseContent += `**Text:** ${(content?.email?.body || content?.social?.post || '').substring(0, 80)}...\n`;
        responseContent += `**CTA:** ${content?.email?.cta || 'Learn More'}\n`;
        responseContent += `\n*Banner will update on demo site when published →*\n\n`;
      }

      responseContent += `**Brand Score Breakdown:**\n`;
      responseContent += `• Tone: ${content?.brandScoreDetails?.toneAlignment || 85}%\n`;
      responseContent += `• Voice: ${content?.brandScoreDetails?.voiceConsistency || 85}%\n`;
      responseContent += `• Clarity: ${content?.brandScoreDetails?.messageClarity || 90}%\n`;
      responseContent += `• Relevance: ${content?.brandScoreDetails?.audienceRelevance || 88}%\n\n`;

      if (content?.suggestions && content.suggestions.length > 0) {
        responseContent += `**AI Suggestions:**\n`;
        content.suggestions.forEach(s => {
          responseContent += `• ${s}\n`;
        });
        responseContent += '\n';
      }

      responseContent += `Say **"save to library"** to add this content, or **"create campaign"** to use it now.`;

      // Generate "What Changed" adjustments for content
      const contentAdjustments = [];

      // Add channel-specific adjustments
      if (channels.includes('email')) {
        contentAdjustments.push({
          icon: '📧',
          text: 'Applied email best practices',
          reason: 'Subject under 50 chars, body under 150 words, clear CTA'
        });
      }
      if (channels.includes('sms')) {
        contentAdjustments.push({
          icon: '📱',
          text: 'Optimized for SMS delivery',
          reason: `Message ${content?.sms?.message.length || 0}/160 chars, no special characters`
        });
      }
      if (channels.includes('social')) {
        contentAdjustments.push({
          icon: '📸',
          text: content?.social?.imageUrl ? 'Generated visual + engagement elements' : 'Added engagement elements',
          reason: content?.social?.imageUrl
            ? `AI-generated image, ${content?.social?.hashtags?.length || 2} hashtags`
            : `${content?.social?.hashtags?.length || 2} relevant hashtags, under 280 chars`
        });
      }
      if (channels.includes('website')) {
        contentAdjustments.push({
          icon: '🌐',
          text: 'Website banner optimized',
          reason: 'Concise headline + clear CTA for banner display'
        });
      }

      // Add brand-specific adjustments (only for email/SMS, not social-only)
      if (channels.includes('email') || channels.includes('sms')) {
        contentAdjustments.push({
          icon: '🎯',
          text: 'Personalization placeholders added',
          reason: 'Using [First Name] and [Vehicle] for 23% higher engagement'
        });
      }

      // Add campaign-type specific adjustments
      if (campaignType === 'referral') {
        contentAdjustments.push({
          icon: '🤝',
          text: 'Referral-optimized messaging',
          reason: 'Focus on relationship value over discounts (+2.3x response)'
        });
      } else if (campaignType === 'recovery') {
        contentAdjustments.push({
          icon: '💬',
          text: 'Recovery tone applied',
          reason: 'Lead with empathy and resolution (+40% response rate)'
        });
      } else if (campaignType === 'win-back') {
        contentAdjustments.push({
          icon: '👋',
          text: 'Win-back sequence optimized',
          reason: '"We miss you" messaging (+34% reactivation)'
        });
      } else if (campaignType === 'loyalty') {
        contentAdjustments.push({
          icon: '🎁',
          text: 'Loyalty reward messaging',
          reason: 'Instant gratification language (+45% engagement)'
        });
        contentAdjustments.push({
          icon: '⚡',
          text: 'Event-triggered delivery',
          reason: 'Sends immediately when action occurs (+67% open rate)'
        });
      }

      const responseMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        data: {
          type: 'multi_channel_content',
          content,
          whatChanged: {
            adjustments: contentAdjustments
          },
          campaignType,
          audience,
          channels,
        },
      };
      setMessages(prev => prev.filter(m => m.id !== generatingMsg.id).concat(responseMsg));

      // Show content preview in the inspector panel
      if (channels.includes('social') || channels.includes('instagram')) {
        setInspectorType('content');
        setInspectorData({
          content,
          brandScore: content?.brandScore || 85,
          channel: 'instagram',
          campaignType,
        });
      } else if (channels.includes('email')) {
        setInspectorType('content');
        setInspectorData({
          content,
          brandScore: content?.brandScore || 85,
          channel: 'email',
          campaignType,
        });
      } else if (channels.includes('sms')) {
        setInspectorType('content');
        setInspectorData({
          content,
          brandScore: content?.brandScore || 85,
          channel: 'sms',
          campaignType,
        });
      }
    } catch (error: any) {
      console.error('[handleMultiChannelContentGeneration] Error:', error);
      console.error('[handleMultiChannelContentGeneration] Error stack:', error?.stack);
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `**Generation Failed**\n\nError: ${error?.message || 'Unknown error'}. Please check browser console.`,
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(m => m.id !== generatingMsg.id).concat(errorMsg));
    }
  };

  // Handle Content Generation
  const handleContentGeneration = async () => {
    if (!currentCampaign) {
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: 'Please create a campaign first. Try: "Create a winback campaign for inactive customers"',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    // Use original query as context for AI - this preserves all the user's intent
    const campaignContext = currentCampaign.originalQuery || currentCampaign.name;

    const contentResponse = await aiApi.generateContent({
      campaignType: currentCampaign.campaignType || 'promotional',
      audience: currentCampaign.audienceDescription || currentCampaign.audience || 'target customers',
      channels: currentCampaign.channels || ['email'],
      goal: campaignContext, // Use full original query for AI context
      brandId: 'premier-nissan',
      customInstructions: currentCampaign.customContentInstructions || undefined,
    });

    const content = contentResponse.data;
    setGeneratedContent(content || null);

    // For website channel, use email content as banner content
    const campaignContent = currentCampaign.channels?.includes('website')
      ? {
          ...content?.email,
          headline: content?.email?.subject,
          // Ensure we have content for banner display
        }
      : content?.email;

    const updatedCampaign = {
      ...currentCampaign,
      content: campaignContent,
      brandScore: content?.brandScore,
      brandScoreDetails: content?.brandScoreDetails,
      missingSteps: [], // Content is now generated
      // Ensure channels are preserved for preview
      channels: currentCampaign.channels,
      channel: currentCampaign.channel,
    };

    setCurrentCampaign(updatedCampaign);
    setInspectorData(updatedCampaign);

    // Update workflow state with content info
    setWorkflowState(prev => ({
      ...prev,
      content: content?.email?.subject || 'Generated',
      hasContent: true,
    }));

    let responseContent = `**Content Generated!** Brand Score: **${content?.brandScore || 85}%**\n\n`;

    // Show appropriate preview based on channel
    if (currentCampaign.channels?.includes('website')) {
      responseContent += `### 🌐 Website Banner\n`;
      responseContent += `**Headline:** ${content?.email?.subject || 'New Promotion'}\n`;
      responseContent += `**Text:** ${(content?.email?.body || '').substring(0, 100)}...\n`;
      responseContent += `**CTA:** ${content?.email?.cta || 'Learn More'}\n\n`;
      responseContent += `*See banner preview in right panel →*\n\n`;
    } else {
      responseContent += `**Subject:** ${content?.email?.subject || 'N/A'}\n\n`;
      responseContent += `**Preview:**\n${(content?.email?.body || '').substring(0, 200)}...\n\n`;
    }

    responseContent += `**Brand Score Breakdown:**\n`;
    responseContent += `• Tone: ${content?.brandScoreDetails?.toneAlignment || 85}%\n`;
    responseContent += `• Voice: ${content?.brandScoreDetails?.voiceConsistency || 85}%\n`;
    responseContent += `• Clarity: ${content?.brandScoreDetails?.messageClarity || 90}%\n`;
    responseContent += `• Relevance: ${content?.brandScoreDetails?.audienceRelevance || 88}%\n\n`;
    responseContent += `**Ready for review!** Say "review" or "submit for approval" to start 3-gate review.`;

    const responseMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      data: {
        type: 'content_generated',
        content: content?.email,  // Store email content directly for editing
        brandScore: content?.brandScore,
        brandScoreDetails: content?.brandScoreDetails,
        campaignType: currentCampaign.campaignType,
        audienceSize: currentCampaign.audienceSize,
        channel: currentCampaign.channel,
      },
    };
    setMessages(prev => [...prev, responseMsg]);
  };

  // Handle Campaign Review (3-Gate Approval)
  const handleCampaignReview = async () => {
    if (!currentCampaign) {
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: 'Please create a campaign first before submitting for review.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    // Create campaign in backend first
    const createResponse = await campaignsApi.create({
      name: currentCampaign.name,
      type: currentCampaign.campaignType,
      channels: [currentCampaign.channel?.toLowerCase().split(' + ')[0] || 'email'],
      content: currentCampaign.content,
    });

    if (!createResponse.success || !createResponse.data) {
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: 'Failed to create campaign. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const campaignId = createResponse.data.id;

    // Submit for 3-gate review
    const reviewResponse = await campaignsApi.review(campaignId);
    const gateResults = reviewResponse.data?.gates || [];

    const gate1 = gateResults.find((g: any) => g.gate === 1);
    const gate2 = gateResults.find((g: any) => g.gate === 2);
    const gate3 = gateResults.find((g: any) => g.gate === 3);

    // Derive status from gate results
    const allPassed = gate1?.passed && gate2?.passed;
    const status = allPassed ? (gate3?.passed ? 'approved' : 'pending_approval') : 'rejected';

    // Update campaign with gate results
    setCurrentCampaign({ ...currentCampaign, id: campaignId, gateResults });
    setInspectorData({
      ...currentCampaign,
      id: campaignId,
      gateResults,
      status
    });

    // Update workflow state with gate results
    setWorkflowState(prev => ({
      ...prev,
      gateResults,
    }));

    // Build appropriate response message based on gate results
    let responseContent = `**3-Gate Approval Process**\n\n`;
    const anyGateFailed = !gate1?.passed || (gate1?.passed && !gate2?.passed);
    const failureReasons: string[] = [];

    // Gate 1 result
    if (gate1?.passed) {
      responseContent += `✅ **Gate 1 (Rules):** PASSED\n   All validation rules satisfied\n\n`;
    } else {
      responseContent += `❌ **Gate 1 (Rules):** FAILED\n`;
      // Only add ONE failure reason - prefer specific blockers over general error
      if (gate1?.details?.guardrailBlockers?.length > 0) {
        responseContent += `   **Content Violations:**\n`;
        // Dedupe blockers and only show unique ones
        const uniqueBlockers = [...new Set(gate1.details.guardrailBlockers as string[])];
        uniqueBlockers.forEach((b: string) => {
          responseContent += `   • ${b}\n`;
        });
        // Only add ONE combined reason for the UI
        failureReasons.push(`Content blocked: ${uniqueBlockers.join(', ')}`);
      } else if (gate1?.details?.error) {
        responseContent += `   **Reason:** ${gate1.details.error}\n`;
        failureReasons.push(gate1.details.error);
      }
      responseContent += `\n`;
    }

    // Gate 2 result (only if Gate 1 passed)
    if (gate1?.passed) {
      if (gate2?.passed) {
        responseContent += `✅ **Gate 2 (AI Review):** PASSED\n   Brand Score: ${gate2?.details?.brandScore || 85}%\n\n`;
      } else {
        responseContent += `❌ **Gate 2 (AI Review):** FAILED\n   ${gate2?.details?.error || 'Content did not pass AI review'}\n\n`;
        failureReasons.push(gate2?.details?.error || 'AI review failed');
      }
    } else {
      responseContent += `⏳ **Gate 2 (AI Review):** Skipped (Gate 1 must pass first)\n\n`;
    }

    // Gate 3 result (only if Gates 1 & 2 passed)
    if (gate1?.passed && gate2?.passed) {
      responseContent += `✅ **Gate 3 (Human Approval):** Ready for approval\n   Use the **Approve** or **Reject** buttons in the panel to the right.\n   Once approved, say **"execute"** to send the campaign.`;
    } else {
      responseContent += `⏳ **Gate 3 (Human):** Awaiting previous gates`;
    }

    // If any gate failed, show content that needs editing
    if (anyGateFailed && currentCampaign?.content) {
      responseContent += `\n\n---\n\n**Content That Needs Revision:**`;
    }

    const responseMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      data: {
        type: 'gate_results',
        gateResults,
        passed: gate1?.passed && gate2?.passed,
        failed: anyGateFailed,
        failureReasons,
        // Include content for redline display if failed
        failedContent: anyGateFailed ? currentCampaign?.content : undefined,
      },
    };
    setMessages(prev => [...prev, responseMsg]);
  };

  // Handle Content Edit (from inline editing)
  const handleContentEdit = (edit: { field: 'subject' | 'body' | 'cta'; value: string }) => {
    if (!currentCampaign?.content) return;

    // Update the content in currentCampaign
    const updatedContent = {
      ...currentCampaign.content,
      [edit.field]: edit.value,
    };

    const updatedCampaign = {
      ...currentCampaign,
      content: updatedContent,
    };

    setCurrentCampaign(updatedCampaign);
    setInspectorData(updatedCampaign);

    // Also update the message that contains the content
    setMessages(prev => prev.map(msg => {
      if (msg.data?.content) {
        return {
          ...msg,
          data: {
            ...msg.data,
            content: {
              ...msg.data.content,
              [edit.field]: edit.value,
            },
          },
        };
      }
      return msg;
    }));

    // Add confirmation message
    const fieldNames: Record<string, string> = {
      subject: 'Subject line',
      body: 'Email body',
      cta: 'Call to action',
    };

    const confirmMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: `**${fieldNames[edit.field]} updated!**\n\nNew value: "${edit.value.substring(0, 100)}${edit.value.length > 100 ? '...' : ''}"`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  // Handle Command-Based Content Edit
  const handleCommandContentEdit = async (query: string) => {
    if (!currentCampaign?.content) {
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: 'No content to edit yet. Generate content first by saying "generate content".',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    let field: 'subject' | 'body' | 'cta' | null = null;
    let newValue: string = '';

    // Detect which field to edit and extract new value
    // Patterns: "edit subject to X", "change subject to X", "set subject to X"
    // "make the subject X", "update subject to X"
    const subjectMatch = query.match(/(?:edit|change|set|make|update)\s+(?:the\s+)?subject\s+(?:to|line to|as)?\s*[:\-]?\s*(.+)/i);
    const bodyMatch = query.match(/(?:edit|change|set|make|update)\s+(?:the\s+)?(?:body|email|content|message)\s+(?:to|as)?\s*[:\-]?\s*(.+)/i);
    const ctaMatch = query.match(/(?:edit|change|set|make|update)\s+(?:the\s+)?(?:cta|call to action|button)\s+(?:to|as)?\s*[:\-]?\s*(.+)/i);

    if (subjectMatch) {
      field = 'subject';
      newValue = subjectMatch[1].trim();
    } else if (bodyMatch) {
      field = 'body';
      newValue = bodyMatch[1].trim();
    } else if (ctaMatch) {
      field = 'cta';
      newValue = ctaMatch[1].trim();
    }

    if (field && newValue) {
      handleContentEdit({ field, value: newValue });
    } else {
      // Couldn't parse - ask for clarification
      const helpMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `I can help you edit the content. Try:\n\n• "Edit subject to [new subject]"\n• "Change body to [new body text]"\n• "Update CTA to [new button text]"\n\n**Current content:**\n• Subject: "${currentCampaign.content.subject || 'N/A'}"\n• Body: "${(currentCampaign.content.body || '').substring(0, 100)}..."\n• CTA: "${currentCampaign.content.cta || 'N/A'}"`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, helpMsg]);
    }
  };

  // Handle Campaign Execution
  const handleCampaignExecute = async () => {
    if (!currentCampaign?.id) {
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: 'Please submit the campaign for review and get approval first.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const executeResponse = await campaignsApi.execute(currentCampaign.id);

    if (executeResponse.success) {
      // Generate receipt data
      const receiptId = `TR-${Date.now().toString(36).toUpperCase()}`;
      const receiptData = {
        id: receiptId,
        campaignName: currentCampaign.name,
        campaignType: currentCampaign.campaignType,
        audience: currentCampaign.audienceDescription,
        audienceSize: currentCampaign.audienceSize || 1,
        channel: currentCampaign.channel,
        brandScore: currentCampaign.brandScore || 85,
        gateResults: [
          { gate: 1, name: 'Rules Validation', passed: true },
          { gate: 2, name: 'AI Review', passed: true },
          { gate: 3, name: 'Human Approval', passed: true },
        ],
        approvedBy: 'sumitjain@gmail.com',
        executedAt: new Date().toISOString(),
        content: currentCampaign.content,
      };

      // Update campaign status to completed
      const completedCampaign = {
        ...currentCampaign,
        status: 'completed',
        executedAt: new Date().toISOString(),
        receipt: receiptData,
      };
      setCurrentCampaign(completedCampaign);

      // If website channel, update demo site banner
      console.log('[Campaign Execute] Checking website channel:', {
        channels: currentCampaign.channels,
        channel: currentCampaign.channel
      });
      if (currentCampaign.channels?.includes('website') || currentCampaign.channel?.toLowerCase().includes('website')) {
        try {
          const bannerContent = currentCampaign.content;
          console.log('[Campaign Execute] Posting to demo site:', bannerContent);
          const response = await fetch('http://localhost:3001/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              displayAd: {
                headline: bannerContent?.subject || bannerContent?.headline || currentCampaign.name,
                body: bannerContent?.body?.substring(0, 100) || 'Check out our latest offers!',
                ctaText: bannerContent?.cta || 'Learn More',
                ctaUrl: '/inventory',
              }
            })
          });
          const result = await response.json();
          console.log('[Campaign Execute] Demo site banner updated:', result);
        } catch (e) {
          console.error('[Campaign Execute] Failed to update demo site banner:', e);
        }
      } else {
        console.log('[Campaign Execute] No website channel, skipping banner update');
      }

      // Update inspector to show receipt
      setInspectorData({
        ...completedCampaign,
        type: 'receipt',
        receipt: receiptData,
      });
      setInspectorType('campaign');

      // Update workflow state
      setWorkflowState(prev => ({ ...prev, completed: true, receipt: receiptData }));

      // Show completion message with actions
      const responseMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `🎉 **Campaign Published Successfully!**\n\n**Receipt ID:** ${receiptId}\n**Campaign:** ${currentCampaign.name}\n**Audience:** ${currentCampaign.audienceDescription}\n**Emails Sent:** ${currentCampaign.audienceSize || 1}\n**Brand Score:** ${currentCampaign.brandScore || 85}%\n\n✅ Gate 1 (Rules): Passed\n✅ Gate 2 (AI Review): Passed\n✅ Gate 3 (Human): Approved\n\n---\n\n**What's next?**`,
        timestamp: new Date(),
        data: {
          type: 'campaign_completed',
          receipt: receiptData,
          campaignId: currentCampaign.id,
        },
      };
      setMessages(prev => [...prev, responseMsg]);
    } else {
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `Execution failed: ${executeResponse.error || 'Unknown error'}. Make sure the campaign has passed all 3 gates.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // Reset to starting state (new campaign)
  const handleStartNew = () => {
    setCurrentCampaign(null);
    setInspectorData(null);
    setInspectorType('empty');
    setWorkflowState({});
    setMessages([]);
    // Refresh suggestions
    fetchSuggestions();
  };

  // Handle Generic Command
  const handleGenericCommand = async (query: string) => {
    // Build full context for AI intent detection
    const stage = getCurrentWorkflowStage();
    const gateResults = currentCampaign?.gateResults || [];
    const failedGate = gateResults.find((g: any) => !g.passed);

    const contextPrompt = `
You are an AI assistant for TrustEye, a marketing campaign platform. Analyze the user's message and determine the intent.

CURRENT CONTEXT:
- Workflow Stage: ${stage}
- Campaign: ${currentCampaign ? currentCampaign.name : 'None'}
- Campaign Type: ${currentCampaign?.campaignType || 'N/A'}
- Audience: ${currentCampaign?.audienceDescription || 'N/A'}
- Channel: ${currentCampaign?.channel || 'N/A'}
- Has Content: ${currentCampaign?.content ? 'Yes' : 'No'}
- Content Subject: ${currentCampaign?.content?.subject || 'N/A'}
- Gate Status: ${failedGate ? `Gate ${failedGate.gate} FAILED - ${failedGate.details?.error || 'validation failed'}` : gateResults.length > 0 ? 'All passed' : 'Not reviewed yet'}
- Brand Score: ${currentCampaign?.brandScore || 'N/A'}

AVAILABLE ACTIONS (return ONE of these exact strings):
- CREATE_CAMPAIGN: User wants to create a new campaign
- GENERATE_CONTENT: User wants to generate/create content for current campaign
- EDIT_CONTENT: User wants to edit/modify the content
- FIX_CONTENT: User wants to fix compliance issues/blocked words
- REVIEW: User wants to submit for 3-gate approval
- APPROVE: User wants to approve the campaign
- PUBLISH: User wants to publish/execute/send the campaign
- SHOW_STATUS: User wants to see current status
- CHANGE_AUDIENCE: User wants to change the target audience
- CHANGE_CHANNEL: User wants to change the channel (email/sms/slack)
- HELP: User needs help or guidance
- CHAT: General conversation, no specific action needed

USER MESSAGE: "${query}"

Respond with JSON only: {"intent": "ACTION_NAME", "details": "extracted details if any", "response": "friendly response to show user"}`;

    try {
      const aiResponse = await aiApi.chat(contextPrompt);

      if (aiResponse.success && aiResponse.data?.response) {
        // Parse the AI response
        let parsed;
        try {
          // Extract JSON from response (might be wrapped in markdown)
          const jsonMatch = aiResponse.data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // Fallback: treat as chat response
          parsed = { intent: 'CHAT', response: aiResponse.data.response };
        }

        const intent = parsed?.intent || 'CHAT';
        const details = parsed?.details || '';
        const friendlyResponse = parsed?.response || '';

        // Execute action based on intent
        switch (intent) {
          case 'CREATE_CAMPAIGN':
            // Extract campaign details and create
            if (details) {
              await handleSmartCampaignCreate(details || query);
            } else {
              await handleSmartCampaignCreate(query);
            }
            return;

          case 'GENERATE_CONTENT':
            if (currentCampaign) {
              await handleContentGeneration();
            } else {
              const msg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `**No campaign yet.** Create one first:\n\n"Create a referral campaign for 5-star reviewers"`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, msg]);
            }
            return;

          case 'EDIT_CONTENT':
            if (currentCampaign?.content) {
              const editMsg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: friendlyResponse || `**Editing: ${currentCampaign.name}**\n\nWhat would you like to change?\n• Subject\n• Body\n• CTA button`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, editMsg]);
            }
            return;

          case 'FIX_CONTENT':
            if (stage === 'gate_failed') {
              await handleAutoFixContent();
            } else if (currentCampaign?.content) {
              const msg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: friendlyResponse || `Content looks good! No issues to fix. Say "review" to submit for approval.`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, msg]);
            }
            return;

          case 'REVIEW':
            if (currentCampaign) {
              await handleCampaignReview();
            }
            return;

          case 'APPROVE':
            if (currentCampaign?.id && stage === 'awaiting_approval') {
              const result = await campaignsApi.approve(currentCampaign.id);
              if (result.success) {
                const updated = await campaignsApi.get(currentCampaign.id);
                if (updated.success && updated.data) {
                  setInspectorData((prev: any) => ({ ...prev, gateResults: updated.data?.gate_results }));
                  setCurrentCampaign(updated.data);
                }
                const msg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `**Campaign Approved!** All 3 gates passed. Say "publish" to send.`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, msg]);
              }
            } else {
              const msg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: friendlyResponse || `Campaign isn't ready for approval yet. Current stage: ${stage}`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, msg]);
            }
            return;

          case 'PUBLISH':
            if (stage === 'approved') {
              await handleCampaignExecute();
            } else if (currentCampaign) {
              // Guide through the process
              const msg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: friendlyResponse || `Before publishing, we need to complete the review process. Current stage: ${stage}`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, msg]);
            }
            return;

          case 'SHOW_STATUS':
            const statusMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: getContextSummary(),
              timestamp: new Date(),
              data: { type: 'status', stage },
            };
            setMessages(prev => [...prev, statusMsg]);
            return;

          case 'CHANGE_AUDIENCE':
            if (currentCampaign && details) {
              const updatedCampaign = { ...currentCampaign, audienceDescription: details };
              setCurrentCampaign(updatedCampaign);
              setInspectorData((prev: any) => ({ ...prev, audienceDescription: details }));
              const msg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `**Audience updated to:** ${details}\n\nContent may need regeneration. Say "generate content" to update.`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, msg]);
            }
            return;

          case 'CHANGE_CHANNEL':
            if (currentCampaign && details) {
              const updatedCampaign = { ...currentCampaign, channel: details };
              setCurrentCampaign(updatedCampaign);
              setInspectorData((prev: any) => ({ ...prev, channel: details }));
              const msg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `**Channel updated to:** ${details}`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, msg]);
            }
            return;

          case 'HELP':
            let helpContent = `**I can help you with:**\n\n`;
            helpContent += `• Create campaigns: "Create a referral campaign for 5-star reviewers"\n`;
            helpContent += `• Generate content: "Generate the email content"\n`;
            helpContent += `• Review & publish: "Submit for review", "Publish"\n`;
            helpContent += `• Edit: "Change the subject", "Make it friendlier"\n`;
            helpContent += `• Status: "What's the status?", "Where am I?"\n\n`;
            if (currentCampaign) {
              helpContent += `**Current campaign:** ${currentCampaign.name}\n`;
              helpContent += `**Stage:** ${stage}\n`;
              helpContent += `**Next step:** ${getNextStepHint()}`;
            }
            const helpMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: helpContent,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, helpMsg]);
            return;

          case 'CHAT':
          default:
            // Show AI's conversational response
            const chatMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: friendlyResponse || aiResponse.data.response,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, chatMsg]);
            return;
        }
      }
    } catch (e) {
      console.error('AI intent detection error:', e);
    }

    // Fallback if AI fails
    const fallbackMsg: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: currentCampaign
        ? `**Working on:** ${currentCampaign.name}\n**Stage:** ${stage}\n**Next:** ${getNextStepHint()}\n\nTry: "yes" to continue, "status" for details, or describe what you want to do.`
        : `**Ready to help!** Try:\n• "Create a referral campaign for 5-star reviewers"\n• "Create a winback campaign for inactive customers"`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, fallbackMsg]);
  };

  // Handle login
  const handleLogin = (name: string) => {
    setUserName(name);
    setIsAuthenticated(true);
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // AI Studio page (with workflow blocks)
  if (activePage === 'studio') {
    return (
      <div className="h-screen flex bg-slate-50">
        <Sidebar activeTool={activePage} onToolChange={handlePageChange} />

        {/* Left: Workflow Blocks */}
        <div className="ml-[64px] flex-shrink-0 h-full overflow-hidden">
          <WorkflowBlocks
            state={workflowState}
            onStateChange={handleWorkflowStateChange}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Middle: Unified Canvas + Command Box */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white border-l border-r border-slate-200">
          {/* Scrollable Conversation */}
          <div className="flex-1 overflow-y-auto bg-white">
            <ConversationFeed
              messages={messages}
              onTemplateClick={handleCommandSubmit}
              onContentEdit={handleContentEdit}
              suggestions={suggestions}
              isLoading={isLoading}
            />
          </div>

          {/* Fixed Command Box at Bottom - No separation */}
          <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-slate-200 sticky bottom-0 z-20">
            <CommandBox
              onSubmit={handleCommandSubmit}
              placeholder={getCommandPlaceholder()}
              position={commandPosition}
              onPositionChange={setCommandPosition}
            />
          </div>
        </div>

        {/* Right: Inspector */}
        <InspectorPanel
          type={inspectorType}
          data={inspectorData}
          workflowState={workflowState}
          onSubmitReview={() => handleCommandSubmit('review')}
          onApprove={async (campaignId: string) => {
            try {
              const result = await campaignsApi.approve(campaignId);
              if (result.success) {
                // Refresh campaign data to show updated gate status
                const updated = await campaignsApi.get(campaignId);
                if (updated.success && updated.data) {
                  setInspectorData((prev: any) => ({
                    ...prev,
                    gateResults: updated.data?.gate_results,
                    status: updated.data?.status,
                  }));
                  setCurrentCampaign(updated.data);
                }
                // Update workflow state
                setWorkflowState(prev => ({ ...prev, gate3Approved: true }));
                // Add success message
                const approveMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `**Campaign Approved!**\n\nGate 3 passed. The campaign is now ready to execute.\n\nSay **"execute"** or click **"Publish"** to send the campaign.`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, approveMsg]);
              } else {
                // Show error message
                const errorMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `**Approval Failed**\n\n${result.error || 'Unable to approve campaign. Please try again.'}`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMsg]);
              }
            } catch (e) {
              console.error('Approval error:', e);
              const errorMsg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `**Approval Error**\n\nUnable to process approval. Please check your connection and try again.`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, errorMsg]);
            }
          }}
          onReject={async (campaignId: string) => {
            try {
              const result = await campaignsApi.reject(campaignId);
              if (result.success) {
                // Refresh campaign data
                const updated = await campaignsApi.get(campaignId);
                if (updated.success && updated.data) {
                  setInspectorData((prev: any) => ({
                    ...prev,
                    gateResults: updated.data?.gate_results,
                    status: updated.data?.status,
                  }));
                }
                // Add rejection message
                const rejectMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `**Campaign Rejected**\n\nGate 3 failed. Please edit the content and resubmit for review.`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, rejectMsg]);
              }
            } catch (e) {
              console.error('Reject error:', e);
            }
          }}
          onEditContent={async () => {
            // Get failure context from gate results
            const gateResults = inspectorData?.gateResults || [];
            const failedGate = gateResults.find((g: any) => g.passed === false);
            const currentContent = inspectorData?.content;

            let failureReason = 'Content validation failed';
            let failureDetails: string[] = [];

            if (failedGate) {
              if (failedGate.details?.error) {
                failureReason = failedGate.details.error;
              }
              if (failedGate.details?.guardrailBlockers) {
                failureDetails = failedGate.details.guardrailBlockers;
              }
              if (failedGate.details?.checks) {
                const checks = failedGate.details.checks;
                failureDetails = Object.entries(checks)
                  .filter(([, passed]) => !passed)
                  .map(([name]) => name);
              }
            }

            // Extract problem words from failure reasons
            const profanityList = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'hell', 'bastard', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut', 'asshole', 'bullshit', 'goddamn', 'sex', 'sexual', 'explicit', 'porn', 'xxx', 'nude', 'erotic', 'kill', 'hurt', 'attack', 'destroy', 'violence', 'threat'];
            const problemWords: string[] = [];

            // Find which words caused the issue
            const allReasons = [failureReason, ...failureDetails].join(' ').toLowerCase();
            profanityList.forEach(word => {
              if (allReasons.includes(word)) problemWords.push(word);
            });

            // Also check the content itself for blocked words
            if (currentContent) {
              const contentText = `${currentContent.subject || ''} ${currentContent.body || ''} ${currentContent.cta || ''}`.toLowerCase();
              profanityList.forEach(word => {
                if (contentText.includes(word) && !problemWords.includes(word)) {
                  problemWords.push(word);
                }
              });
            }

            // Auto-fix: directly remove problem words from content
            if (currentContent && currentCampaign) {
              // Function to clean text by removing problem words
              const cleanText = (text: string): string => {
                if (!text) return text;
                let cleaned = text;
                problemWords.forEach(word => {
                  // Replace word with asterisks or remove it contextually
                  const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
                  cleaned = cleaned.replace(regex, '').replace(/\s+/g, ' ').trim();
                });
                // Clean up any double spaces or awkward punctuation
                cleaned = cleaned.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
                return cleaned;
              };

              const fixedContent = {
                subject: cleanText(currentContent.subject || ''),
                body: cleanText(currentContent.body || ''),
                cta: cleanText(currentContent.cta || ''),
              };

              // Update current campaign with fixed content
              const updatedCampaign = {
                ...currentCampaign,
                content: fixedContent,
              };
              setCurrentCampaign(updatedCampaign);

              // Update inspector data
              setInspectorData((prev: any) => ({
                ...prev,
                content: fixedContent,
                gateResults: [], // Reset gates for re-review
              }));

              // Update in database if we have an ID
              if (currentCampaign.id) {
                try {
                  await campaignsApi.update(currentCampaign.id, { content: fixedContent });
                } catch (e) {
                  console.error('Failed to update campaign:', e);
                }
              }

              // Show corrected draft
              const fixedMsg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `**Content Fixed!**\n\nRemoved: ${problemWords.length > 0 ? `"${problemWords.join('", "')}"` : 'problematic content'}\n\n---\n\n**Corrected Draft:**`,
                timestamp: new Date(),
                data: {
                  type: 'content_fixed',
                  content: fixedContent,
                  brandScore: inspectorData?.brandScore || 85,
                  removedWords: problemWords,
                  canResubmit: true,
                },
              };
              setMessages(prev => [...prev, fixedMsg]);
              return;
            }

            // Fallback if no content to fix
            if (!currentContent && currentCampaign) {
              setIsLoading(true);
              const fixingMsg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `**Regenerating Content**\n\nNo existing content to fix. Generating new compliant content...`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, fixingMsg]);

              try {
                const fixInstructions = `Create compliant content. Avoid: ${problemWords.join(', ')}. Ensure brand voice and compliance.`;

                const contentResult = await aiApi.generateContent({
                  campaignType: currentCampaign.type || 'promotional',
                  audience: inspectorData?.audienceName || 'customers',
                  channels: currentCampaign.channels || ['email'],
                  goal: 'Re-engage customers',
                  customInstructions: fixInstructions,
                });

                if (contentResult.success && contentResult.data) {
                  const newContent = contentResult.data;
                  setGeneratedContent(newContent);

                  // Update campaign with fixed content
                  if (currentCampaign.id) {
                    await campaignsApi.update(currentCampaign.id, {
                      content: newContent.email,
                    });
                  }

                  // Update inspector
                  setInspectorData((prev: any) => ({
                    ...prev,
                    content: newContent.email,
                    brandScore: newContent.brandScore,
                    // Reset gate results for re-review
                    gateResults: [],
                  }));

                  // Show fixed content
                  const fixedMsg: Message = {
                    id: `assistant-${Date.now()}`,
                    type: 'assistant',
                    content: `**Content Fixed!**\n\n**Subject:** ${newContent.email?.subject || ''}\n\n**Body:**\n${newContent.email?.body || ''}\n\n**Brand Score:** ${newContent.brandScore}%\n\nClick **"Submit for 3-Gate Approval"** to re-run validation.`,
                    timestamp: new Date(),
                    data: {
                      type: 'content',
                      content: newContent.email,
                      brandScore: newContent.brandScore,
                    },
                  };
                  setMessages(prev => [...prev, fixedMsg]);
                }
              } catch (e) {
                console.error('Content fix error:', e);
                const errorMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `**Error fixing content.** Please describe what changes you'd like to make manually.`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMsg]);
              } finally {
                setIsLoading(false);
              }
            } else {
              // No content to fix - prompt for manual input
              const editMsg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `**Edit Mode**\n\n**Issue:** ${failureReason}${failureDetails.length > 0 ? `\n**Details:** ${failureDetails.join(', ')}` : ''}\n\nPlease describe what changes you'd like to make, or say "fix it" to auto-regenerate.`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, editMsg]);
            }
          }}
          onPublish={async () => {
            await handleCampaignExecute();
          }}
          onStartNew={handleStartNew}
          onContentUpdate={(updatedContent) => {
            // Update campaign content when edited
            if (currentCampaign) {
              const updated = { ...currentCampaign, content: updatedContent };
              setCurrentCampaign(updated);
              setInspectorData(updated);
              const msg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `✅ **Content updated!** Your changes have been saved.\n\nReady to submit for review? Say "review" or click "Submit for 3-Gate Approval".`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, msg]);
            }
          }}
          onRegenerateImage={async () => {
            // Regenerate image for social content
            if (currentCampaign?.content) {
              const msg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `🎨 **Generating new image...**`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, msg]);

              try {
                const imagePrompt = `Marketing image for ${currentCampaign.campaignType} campaign: ${currentCampaign.content.body?.substring(0, 100) || 'promotional content'}`;
                const imageResponse = await imageApi.generate({
                  prompt: imagePrompt,
                  channel: 'instagram',
                  brandContext: {
                    primaryColor: '#1e40af',
                    style: 'professional, modern, automotive',
                    industry: 'automotive dealership',
                  },
                  count: 1,
                });

                if (imageResponse.success && imageResponse.data?.images?.[0]?.url) {
                  const newImageUrl = imageResponse.data.images[0].url;
                  const updatedContent = { ...currentCampaign.content, imageUrl: newImageUrl };
                  const updated = { ...currentCampaign, content: updatedContent };
                  setCurrentCampaign(updated);
                  setInspectorData(updated);

                  const successMsg: Message = {
                    id: `assistant-${Date.now()}`,
                    type: 'assistant',
                    content: `✅ **New image generated!** Preview updated.`,
                    timestamp: new Date(),
                  };
                  setMessages(prev => prev.filter(m => m.content !== '🎨 **Generating new image...**').concat(successMsg));
                }
              } catch (error) {
                console.error('Image regeneration failed:', error);
                const errorMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `❌ Failed to generate new image. Please try again.`,
                  timestamp: new Date(),
                };
                setMessages(prev => prev.filter(m => m.content !== '🎨 **Generating new image...**').concat(errorMsg));
              }
            }
          }}
          onSaveToLibrary={async () => {
            // Direct save for content type in studio
            const content = inspectorData?.content;
            if (!content) return;
            try {
              const channel = content.social ? 'social' : content.email ? 'email' : 'sms';
              await contentApi.create({
                name: `Generated ${channel} content`,
                channel,
                campaignType: inspectorData?.campaignType || 'promotional',
                content: content.social?.post || content.email?.body || content.sms?.message || '',
                subject: content.email?.subject,
                hashtags: content.social?.hashtags,
                imageUrl: content.social?.imageUrl,
              });
              const successMsg: Message = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: `✅ **Content saved to library!**`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, successMsg]);
              setInspectorType('empty');
              setInspectorData(null);
            } catch (error) {
              console.error('Save failed:', error);
            }
          }}
          onCreateCampaign={() => {
            // Start campaign creation with the preloaded content
            const contentForCampaign = inspectorData?.content;
            const channel = contentForCampaign?.social ? 'Instagram' : contentForCampaign?.email ? 'Email' : 'SMS';
            const channelLower = channel.toLowerCase() === 'instagram' ? 'social' : channel.toLowerCase();
            const campaignType = inspectorData?.campaignType || 'promotional';
            const campaignName = `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Campaign - ${new Date().toLocaleDateString()}`;

            // Create campaign object with content but missing audience
            const campaignData = {
              type: 'campaign_created',
              name: campaignName,
              campaignType: campaignType,
              campaignLabel: campaignType.charAt(0).toUpperCase() + campaignType.slice(1),
              status: 'draft',
              channels: [channelLower],
              channel: channel,
              content: contentForCampaign?.social ? {
                body: contentForCampaign.social.post,
                hashtags: contentForCampaign.social.hashtags,
                imageUrl: contentForCampaign.social.imageUrl,
              } : contentForCampaign?.email ? {
                subject: contentForCampaign.email.subject,
                body: contentForCampaign.email.body,
                cta: contentForCampaign.email.cta,
              } : {
                body: contentForCampaign?.sms?.message,
              },
              brandScore: inspectorData?.brandScore || 85,
              audienceId: null,
              audienceName: null,
              audienceSize: 0,
              audienceDescription: null,
              missingSteps: ['audience'],
            };

            setCurrentCampaign(campaignData);
            setGeneratedContent(contentForCampaign);
            setWorkflowState({
              campaignType: campaignType,
              campaignName: campaignName,
              channel: channel,
              channels: [channelLower],
              hasContent: true,
            });
            setInspectorType('campaign');
            setInspectorData(campaignData);

            // Prompt for audience selection
            const promptMsg: Message = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: `**Campaign Created: ${campaignName}**\n\n**Ready:**\n• Content: ${channel} ✓\n• Channel: ${channel} ✓\n\n**Next: Select an audience**\n\nTry: "Target 5-star reviewers" or "Send to inactive customers"`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, promptMsg]);
          }}
        />
      </div>
    );
  }

  // Campaigns page
  if (activePage === 'campaigns') {
    const pageHasMessages = (pageMessages['campaigns'] || []).length > 0;
    return (
      <div className="h-screen flex bg-slate-50 overflow-hidden">
        <Sidebar activeTool={activePage} onToolChange={handlePageChange} />

        {/* Left: Filters */}
        <div className="ml-[64px]">
          <FiltersPanel page="campaigns" />
        </div>

        {/* Middle: Unified Canvas + Command Box */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white border-l border-r border-slate-200">
          {/* Scrollable Content - Show conversation if there are messages, otherwise show page */}
          <div className="flex-1 overflow-y-auto bg-white">
            {pageHasMessages ? (
              <ConversationFeed
                messages={messages}
                onTemplateClick={handleCommandSubmit}
                onContentEdit={handleContentEdit}
                suggestions={[]}
                isLoading={isLoading}
              />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <CampaignsPage />
              </Suspense>
            )}
          </div>

          {/* Fixed Command Box at Bottom */}
          <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-slate-200 sticky bottom-0 z-20">
            <CommandBox
              onSubmit={handleCommandSubmit}
              placeholder="Show running campaigns, create campaign, show metrics..."
              position={commandPosition}
              onPositionChange={setCommandPosition}
            />
          </div>
        </div>

        {/* Right: Inspector */}
        <InspectorPanel type="empty" />
      </div>
    );
  }

  // Audiences page
  if (activePage === 'audiences') {
    const pageHasMessages = (pageMessages['audiences'] || []).length > 0;
    return (
      <div className="h-screen flex bg-slate-50 overflow-hidden">
        <Sidebar activeTool={activePage} onToolChange={handlePageChange} />

        {/* Left: Filters */}
        <div className="ml-[64px]">
          <FiltersPanel page="audiences" />
        </div>

        {/* Middle: Unified Canvas + Command Box */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white border-l border-r border-slate-200">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            {pageHasMessages ? (
              <ConversationFeed
                messages={messages}
                onTemplateClick={handleCommandSubmit}
                onContentEdit={handleContentEdit}
                suggestions={[]}
                isLoading={isLoading}
              />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <AudiencesPage />
              </Suspense>
            )}
          </div>

          {/* Fixed Command Box at Bottom */}
          <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-slate-200 sticky bottom-0 z-20">
            <CommandBox
              onSubmit={handleCommandSubmit}
              placeholder="Create audience of 5-star reviewers, show inactive customers..."
              position={commandPosition}
              onPositionChange={setCommandPosition}
            />
          </div>
        </div>

        {/* Right: Inspector */}
        <InspectorPanel type="empty" />
      </div>
    );
  }

  // Content Library page
  if (activePage === 'content') {
    const pageHasMessages = (pageMessages['content'] || []).length > 0;
    const handleCreateCampaignFromContent = () => {
      if (selectedContentItem) {
        // Navigate to campaigns with content pre-selected
        setActivePage('campaigns');
        // Store content in inspector for campaign creation
        setInspectorData({ contentTemplate: selectedContentItem });
        setInspectorType('content');
      }
    };

    return (
      <div className="h-screen flex bg-slate-50 overflow-hidden">
        <Sidebar activeTool={activePage} onToolChange={handlePageChange} />

        {/* Left: Filters */}
        <div className="ml-[64px]">
          <FiltersPanel
            page="content"
            onContentSectionChange={(section) => {
              setContentSectionScroll(section);
              // Reset after a brief delay so it can be triggered again
              setTimeout(() => setContentSectionScroll(null), 100);
            }}
          />
        </div>

        {/* Middle: Unified Canvas + Command Box */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white border-l border-r border-slate-200">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            {pageHasMessages ? (
              <ConversationFeed
                messages={messages}
                onTemplateClick={handleCommandSubmit}
                onContentEdit={handleContentEdit}
                suggestions={[]}
                isLoading={isLoading}
              />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <ContentLibraryPage
                  onContentSelect={setSelectedContentItem}
                  scrollToSection={contentSectionScroll}
                  contentItems={dynamicContentLibrary}
                  brandTone={brandTone}
                  onBrandToneUpdate={setBrandTone}
                />
              </Suspense>
            )}
          </div>

          {/* Fixed Command Box at Bottom */}
          <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-slate-200 sticky bottom-0 z-20">
            <CommandBox
              onSubmit={handleCommandSubmit}
              placeholder="Create Instagram post for car launch, generate email template..."
              position={commandPosition}
              onPositionChange={setCommandPosition}
            />
          </div>
        </div>

        {/* Right: Content Preview Panel or Inspector */}
        {selectedContentItem ? (
          <div className="w-[340px] border-l border-slate-200 bg-white flex-shrink-0">
            <ContentPreviewPanel
              content={selectedContentItem}
              onClose={() => setSelectedContentItem(null)}
              onCreateCampaign={handleCreateCampaignFromContent}
            />
          </div>
        ) : inspectorType === 'content' && inspectorData ? (
          <InspectorPanel
            type="content"
            data={inspectorData}
            onClose={() => {
              setInspectorType('empty');
              setInspectorData(null);
            }}
            onSaveToLibrary={async () => {
              // Direct save without going through AI chat
              const content = inspectorData?.content;
              if (!content) return;

              try {
                const channel = content.social ? 'social' : content.email ? 'email' : 'sms';
                const saveData = {
                  name: `Generated ${channel} content`,
                  channel,
                  campaignType: inspectorData?.campaignType || 'promotional',
                  content: content.social?.post || content.email?.body || content.sms?.message || '',
                  subject: content.email?.subject,
                  hashtags: content.social?.hashtags,
                  imageUrl: content.social?.imageUrl,
                };

                const result = await contentApi.create(saveData);

                // Add success message to chat
                const successMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `✅ **Content saved to library!**\n\nYour ${channel} content has been saved and is ready to use in future campaigns.`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, successMsg]);

                // Clear inspector
                setInspectorType('empty');
                setInspectorData(null);
              } catch (error) {
                const errorMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: `❌ Failed to save content. Please try again.`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMsg]);
              }
            }}
            onCreateCampaign={() => {
              // Navigate to studio with content pre-loaded as campaign
              const contentForCampaign = inspectorData?.content;
              const channel = contentForCampaign?.social ? 'Instagram' : contentForCampaign?.email ? 'Email' : 'SMS';
              const channelLower = channel.toLowerCase() === 'instagram' ? 'social' : channel.toLowerCase();
              const campaignType = inspectorData?.campaignType || 'promotional';
              const campaignName = `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Campaign - ${new Date().toLocaleDateString()}`;

              // Create campaign object matching the structure from handleSmartCampaignCreate
              const campaignData = {
                type: 'campaign_created',
                name: campaignName,
                campaignType: campaignType,
                campaignLabel: campaignType.charAt(0).toUpperCase() + campaignType.slice(1),
                status: 'draft',
                channels: [channelLower],
                channel: channel,
                // Content IS set (coming from content generation)
                content: contentForCampaign?.social ? {
                  body: contentForCampaign.social.post,
                  hashtags: contentForCampaign.social.hashtags,
                  imageUrl: contentForCampaign.social.imageUrl,
                } : contentForCampaign?.email ? {
                  subject: contentForCampaign.email.subject,
                  body: contentForCampaign.email.body,
                  cta: contentForCampaign.email.cta,
                } : {
                  body: contentForCampaign?.sms?.message,
                },
                brandScore: inspectorData?.brandScore || 85,
                // Audience NOT set yet - this is what's missing
                audienceId: null,
                audienceName: null,
                audienceSize: 0,
                audienceDescription: null,
                missingSteps: ['audience'], // KEY: audience is missing, not content
              };

              // Set current campaign
              setCurrentCampaign(campaignData);
              setGeneratedContent(contentForCampaign);

              // Set workflow state - content yes, audience no
              setWorkflowState({
                campaignType: campaignType,
                campaignName: campaignName,
                channel: channel,
                channels: [channelLower],
                hasContent: true,
                // Audience intentionally NOT set
                audience: undefined,
                audienceDescription: undefined,
                audienceSize: undefined,
              });

              // Set inspector to show campaign preview
              setInspectorType('campaign');
              setInspectorData(campaignData);

              // Clear content page messages, set studio message
              setPageMessages(prev => ({
                ...prev,
                content: [], // Clear content page
                studio: [{
                  id: `assistant-${Date.now()}`,
                  type: 'assistant' as const,
                  content: `**Campaign Created: ${campaignName}**\n\n**What's ready:**\n• Content: ${channel} post ✓\n• Channel: ${channel} ✓\n• Brand Score: ${campaignData.brandScore}% ✓\n\n**Next step: Select an audience**\n\nTry:\n• "Target 5-star reviewers"\n• "Send to inactive customers"\n• "Reach customers from last 30 days"\n\nOr select an audience from the left panel.`,
                  timestamp: new Date(),
                  data: { type: 'campaign_from_content', campaign: campaignData },
                }]
              }));

              // Navigate to studio
              setActivePage('studio');
            }}
          />
        ) : (
          <InspectorPanel type="empty" />
        )}
      </div>
    );
  }

  // Automations page
  if (activePage === 'automations') {
    const pageHasMessages = (pageMessages['automations'] || []).length > 0;
    return (
      <div className="h-screen flex bg-slate-50 overflow-hidden">
        <Sidebar activeTool={activePage} onToolChange={handlePageChange} />

        {/* Left: Filters */}
        <div className="ml-[64px]">
          <FiltersPanel page="automations" />
        </div>

        {/* Middle: Unified Canvas + Command Box */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white border-l border-r border-slate-200">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            {pageHasMessages ? (
              <ConversationFeed
                messages={messages}
                onTemplateClick={handleCommandSubmit}
                onContentEdit={handleContentEdit}
                suggestions={[]}
                isLoading={isLoading}
              />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <AutomationsPage />
              </Suspense>
            )}
          </div>

          {/* Fixed Command Box at Bottom */}
          <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-slate-200 sticky bottom-0 z-20">
            <CommandBox
              onSubmit={handleCommandSubmit}
              placeholder="When customer leaves 5-star review, send thank you email..."
              position={commandPosition}
              onPositionChange={setCommandPosition}
            />
          </div>
        </div>

        {/* Right: Inspector */}
        <InspectorPanel type="empty" />
      </div>
    );
  }

  // Integrations page
  if (activePage === 'integrations') {
    const pageHasMessages = (pageMessages['integrations'] || []).length > 0;
    return (
      <div className="h-screen flex bg-slate-50 overflow-hidden">
        <Sidebar activeTool={activePage} onToolChange={handlePageChange} />

        {/* Left: Filters */}
        <div className="ml-[64px]">
          <FiltersPanel page="integrations" />
        </div>

        {/* Middle: Unified Canvas + Command Box */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white border-l border-r border-slate-200">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            {pageHasMessages ? (
              <ConversationFeed
                messages={messages}
                onTemplateClick={handleCommandSubmit}
                onContentEdit={handleContentEdit}
                suggestions={[]}
                isLoading={isLoading}
              />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <IntegrationsPage />
              </Suspense>
            )}
          </div>

          {/* Fixed Command Box at Bottom */}
          <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-slate-200 sticky bottom-0 z-20">
            <CommandBox
              onSubmit={handleCommandSubmit}
              placeholder="What integrations do we have? What data does Birdeye provide?"
              position={commandPosition}
              onPositionChange={setCommandPosition}
            />
          </div>
        </div>
      </div>
    );
  }

  // Analytics page - uses its own 3-column layout
  if (activePage === 'analytics') {
    return (
      <div className="h-screen flex bg-slate-50 overflow-hidden">
        <Sidebar activeTool={activePage} onToolChange={handlePageChange} />
        {/* Analytics page has its own left/center/right layout */}
        <div className="ml-[64px] flex-1">
          <Suspense fallback={<PageLoader />}>
            <AnalyticsPage />
          </Suspense>
        </div>
      </div>
    );
  }

  // Settings page
  if (activePage === 'settings') {
    return (
      <div className="h-screen flex bg-slate-50 overflow-hidden">
        <Sidebar activeTool={activePage} onToolChange={handlePageChange} />
        
        {/* Left: Filters */}
        <div className="ml-[64px]">
          <FiltersPanel page="settings" />
        </div>

        {/* Middle: Unified Canvas + Command Box */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white border-l border-r border-slate-200">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          </div>

          {/* Fixed Command Box at Bottom */}
          <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-slate-200 sticky bottom-0 z-20">
            <CommandBox
              onSubmit={handleCommandSubmit}
              placeholder="Configure settings, manage preferences..."
              position={commandPosition}
              onPositionChange={setCommandPosition}
            />
          </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return null;
}