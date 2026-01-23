// TrustEye API Client
// Frontend hooks for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

// Generic API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// CAMPAIGNS API
// ============================================

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  channels: string[];
  audience_id?: string;
  content?: {
    subject?: string;
    body?: string;
    cta?: string;
  };
  schedule?: {
    start_date?: string;
    end_date?: string;
  };
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  gate_results?: any[];
  created_at: string;
  updated_at: string;
}

export const campaignsApi = {
  // List all campaigns
  list: async (params?: { status?: string; type?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', params.limit.toString());

    return apiCall<Campaign[]>(`/api/campaigns?${query.toString()}`);
  },

  // Get single campaign
  get: async (id: string) => {
    return apiCall<Campaign>(`/api/campaigns/${id}`);
  },

  // Create campaign
  create: async (data: Partial<Campaign>) => {
    return apiCall<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update campaign
  update: async (id: string, data: Partial<Campaign>) => {
    return apiCall<Campaign>(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete campaign
  delete: async (id: string) => {
    return apiCall<null>(`/api/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  // Submit for review (3-gate approval)
  review: async (id: string) => {
    return apiCall<any>(`/api/campaigns/${id}/review`, {
      method: 'POST',
    });
  },

  // Execute campaign
  execute: async (id: string) => {
    return apiCall<any>(`/api/campaigns/${id}/execute`, {
      method: 'POST',
    });
  },

  // Pause campaign
  pause: async (id: string) => {
    return apiCall<Campaign>(`/api/campaigns/${id}/pause`, {
      method: 'POST',
    });
  },

  // Resume campaign
  resume: async (id: string) => {
    return apiCall<Campaign>(`/api/campaigns/${id}/resume`, {
      method: 'POST',
    });
  },

  // Approve campaign (Gate 3) - in-app approval
  approve: async (id: string, approver?: string) => {
    return apiCall<Campaign>(`/api/campaigns/slack/approval`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'approve',
        campaign_id: id,
        user: approver || 'UI User',
      }),
    });
  },

  // Reject campaign (Gate 3) - in-app rejection
  reject: async (id: string, approver?: string, reason?: string) => {
    return apiCall<Campaign>(`/api/campaigns/slack/approval`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'reject',
        campaign_id: id,
        user: approver || 'UI User',
        reason: reason,
      }),
    });
  },
};

// ============================================
// AUDIENCES API
// ============================================

export interface Audience {
  id: string;
  name: string;
  description?: string;
  conditions: Record<string, any>;
  estimated_size: number;
  created_at: string;
  updated_at: string;
}

export const audiencesApi = {
  // List all audiences
  list: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return apiCall<Audience[]>(`/api/audiences${query}`);
  },

  // Get single audience
  get: async (id: string) => {
    return apiCall<Audience>(`/api/audiences/${id}`);
  },

  // Create audience
  create: async (data: Partial<Audience>) => {
    return apiCall<Audience>('/api/audiences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update audience
  update: async (id: string, data: Partial<Audience>) => {
    return apiCall<Audience>(`/api/audiences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete audience
  delete: async (id: string) => {
    return apiCall<null>(`/api/audiences/${id}`, {
      method: 'DELETE',
    });
  },

  // Estimate audience size
  estimate: async (id: string) => {
    return apiCall<{ estimated_size: number; calculated_at: string }>(
      `/api/audiences/${id}/estimate`
    );
  },

  // Find audience by name or create new one
  findOrCreate: async (name: string, description: string, conditions: Record<string, any> = {}, estimatedSize: number = 0) => {
    // First try to find existing audience
    const listResponse = await apiCall<Audience[]>('/api/audiences');
    if (listResponse.success && listResponse.data) {
      const existing = listResponse.data.find(
        a => a.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return { success: true, data: existing, created: false };
      }
    }

    // Create new audience
    const createResponse = await apiCall<Audience>('/api/audiences', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        conditions,
        estimated_size: estimatedSize,
      }),
    });

    return { ...createResponse, created: true };
  },
};

// ============================================
// RULES API
// ============================================

export interface Rule {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'review' | 'purchase' | 'signup' | 'inactivity' | 'custom';
  trigger_conditions: Record<string, any>;
  actions: Array<{ type: string; config: Record<string, any> }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const rulesApi = {
  // List all rules
  list: async (params?: { is_active?: boolean; trigger_type?: string }) => {
    const query = new URLSearchParams();
    if (params?.is_active !== undefined) query.set('is_active', params.is_active.toString());
    if (params?.trigger_type) query.set('trigger_type', params.trigger_type);

    return apiCall<Rule[]>(`/api/rules?${query.toString()}`);
  },

  // Get single rule
  get: async (id: string) => {
    return apiCall<Rule>(`/api/rules/${id}`);
  },

  // Create rule
  create: async (data: Partial<Rule>) => {
    return apiCall<Rule>('/api/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update rule
  update: async (id: string, data: Partial<Rule>) => {
    return apiCall<Rule>(`/api/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete rule
  delete: async (id: string) => {
    return apiCall<null>(`/api/rules/${id}`, {
      method: 'DELETE',
    });
  },

  // Toggle rule active status
  toggle: async (id: string) => {
    return apiCall<Rule>(`/api/rules/${id}/toggle`, {
      method: 'POST',
    });
  },

  // Parse natural language to rule
  parse: async (text: string) => {
    return apiCall<Partial<Rule>>('/api/rules/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
};

// ============================================
// AUTOMATIONS API
// ============================================

export interface AutomationTemplate {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    source: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  isActive: boolean;
  executionCount?: number;
  performanceStatus?: 'green' | 'yellow' | 'red';
  metrics?: {
    openRate: number;
    sendCount: number;
    lastRun: string;
  };
}

export const automationsApi = {
  // List all automation templates
  list: async () => {
    return apiCall<AutomationTemplate[]>('/api/automations');
  },

  // Create automation
  create: async (data: Partial<AutomationTemplate>) => {
    return apiCall<AutomationTemplate>('/api/automations/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Toggle automation active status
  toggle: async (id: string) => {
    return apiCall<AutomationTemplate>(`/api/automations/${id}/toggle`, {
      method: 'POST',
    });
  },

  // Test automation
  test: async (id: string) => {
    return apiCall<{ success: boolean; message: string }>('/api/automations/test', {
      method: 'POST',
      body: JSON.stringify({ automationId: id }),
    });
  },

  // Simulate Birdeye webhook
  simulateWebhook: async (data: { rating: number; customerName: string; text: string }) => {
    return apiCall<{ success: boolean; triggered: string[] }>('/api/automations/webhook/birdeye', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// CONTENT LIBRARY API
// ============================================

export interface ContentLibraryItem {
  id: string;
  name: string;
  type: 'template' | 'asset' | 'banner';
  channels: string[];
  campaignTypes: string[];
  content: {
    subject?: string;
    body?: string;
    cta?: string;
    post?: string;
    hashtags?: string[];
    message?: string;
  };
  brandScore: number;
  performance: {
    timesUsed: number;
    avgOpenRate: number;
    avgClickRate: number;
    bestPerformingIn: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const contentApi = {
  // List all content
  list: async (params?: { channel?: string; campaignType?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.channel) query.set('channel', params.channel);
    if (params?.campaignType) query.set('campaignType', params.campaignType);
    if (params?.type) query.set('type', params.type);

    return apiCall<ContentLibraryItem[]>(`/api/content?${query.toString()}`);
  },

  // Get single content item
  get: async (id: string) => {
    return apiCall<ContentLibraryItem>(`/api/content/${id}`);
  },

  // Create content (save to library)
  create: async (data: {
    name: string;
    type: 'template' | 'asset' | 'banner';
    channels: string[];
    campaignTypes?: string[];
    content: Record<string, any>;
    brandScore?: number;
  }) => {
    return apiCall<ContentLibraryItem>('/api/content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update content
  update: async (id: string, data: Partial<ContentLibraryItem>) => {
    return apiCall<ContentLibraryItem>(`/api/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete content
  delete: async (id: string) => {
    return apiCall<null>(`/api/content/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// ANALYTICS API
// ============================================

export interface AnalyticsOverview {
  total_campaigns: number;
  active_campaigns: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  average_open_rate: number;
  average_click_rate: number;
}

export interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    type: string;
    status: string;
    created_at: string;
  };
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
    delivery_rate: number;
  };
  events: any[];
  insights: string[];
}

export interface Insight {
  type: 'opportunity' | 'success' | 'improvement' | 'suggestion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

export const analyticsApi = {
  // Get overview
  overview: async () => {
    return apiCall<AnalyticsOverview>('/api/analytics/overview');
  },

  // Get campaign analytics
  campaign: async (id: string) => {
    return apiCall<CampaignAnalytics>(`/api/analytics/campaigns/${id}`);
  },

  // Get insights
  insights: async () => {
    return apiCall<{ insights: Insight[]; generated_at: string }>('/api/analytics/insights');
  },

  // Get trends
  trends: async (period: '7d' | '30d' | '90d' = '30d') => {
    return apiCall<{ period: string; trends: any[] }>(`/api/analytics/trends?period=${period}`);
  },
};

// ============================================
// AI API (for Intelligence Agent)
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp?: string;
}

export interface AISuggestion {
  id: string;
  type: 'referral' | 'recovery' | 'competitive' | 'seasonal' | 'win-back' | 'loyalty';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  suggestedAudience?: { name: string; count: number; criteria: string };
  suggestedChannels?: string[];
  potentialImpact?: { metric: string; estimate: string };
  dataSource: string;
  createdAt: string;
  expiresAt?: string;
}

export interface GeneratedContent {
  email?: {
    subject: string;
    previewText?: string;
    body: string;
    cta: string;
  };
  sms?: { message: string };
  social?: { post: string; hashtags?: string[] };
  brandScore: number;
  brandScoreDetails: {
    toneAlignment: number;
    voiceConsistency: number;
    messageClarity: number;
    audienceRelevance: number;
  };
  suggestions: string[];
}

export interface BirdeyeReview {
  id: string;
  customerName: string;
  rating: number;
  review: string;
  date: string;
  source: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  serviceType?: string;
}

export const aiApi = {
  // Chat with AI
  chat: async (message: string, history?: any[], brandId?: string) => {
    return apiCall<{ response: string; sources?: string[] }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, brandId }),
    });
  },

  // Generate content with brand voice
  generateContent: async (params: {
    campaignType: string;
    audience: string | { name: string; count?: number; description?: string };
    channels: string[];
    goal: string;
    brandId?: string;
    customInstructions?: string;
  }) => {
    return apiCall<GeneratedContent>('/api/ai/content/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Get AI suggestions from real data
  suggestions: async (businessId?: string) => {
    const url = businessId
      ? `/api/ai/suggestions/${businessId}`
      : '/api/ai/suggestions';
    return apiCall<AISuggestion[]>(url);
  },

  // Process intelligence command
  processCommand: async (params: {
    message: string;
    sessionId?: string;
    brandId?: string;
    userId?: string;
  }) => {
    return apiCall<{
      intent: any;
      response: string;
      actions?: any[];
      suggestions?: AISuggestion[];
      sessionId: string;
    }>('/api/ai/intelligence/process', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Quick process (no AI, just pattern matching)
  quickProcess: async (message: string) => {
    return apiCall<{
      intent: any;
      confidence: number;
    }>('/api/ai/intelligence/quick', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Get Birdeye reviews
  getReviews: async (businessId?: string, params?: { count?: number; minRating?: number; maxRating?: number }) => {
    const query = new URLSearchParams();
    if (params?.count) query.set('count', params.count.toString());
    if (params?.minRating) query.set('minRating', params.minRating.toString());
    if (params?.maxRating) query.set('maxRating', params.maxRating.toString());

    const url = businessId
      ? `/api/ai/reviews/${businessId}?${query.toString()}`
      : `/api/ai/reviews/premier-nissan?${query.toString()}`;
    return apiCall<BirdeyeReview[]>(url);
  },

  // AI content review (Gate 2)
  reviewContent: async (content: any, brandId?: string) => {
    return apiCall<{
      passed: boolean;
      brandScore: number;
      brandScoreDetails: any;
      checks: any[];
      suggestions: string[];
    }>('/api/ai/review', {
      method: 'POST',
      body: JSON.stringify({ content, brandId }),
    });
  },

  // Analyze campaign
  analyze: async (campaignId: string) => {
    return apiCall<any>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId }),
    });
  },

  // Get "What Changed" - feedback loop adjustments
  getWhatChanged: async (campaignType: string) => {
    return apiCall<{
      campaignType: string;
      adjustments: Array<{
        id: string;
        icon: string;
        text: string;
        reason: string;
        impact: string;
        dataSource: string;
      }>;
      summary: string;
      lastUpdated: string;
    }>(`/api/ai/feedback/what-changed/${campaignType}`);
  },
};

// ============================================
// CONTENT LIBRARY API
// ============================================

export interface ContentLibraryItem {
  id: string;
  name: string;
  type: 'template' | 'asset' | 'banner';
  channels: string[];
  campaignTypes: string[];
  content: {
    subject?: string;
    body?: string;
    cta?: string;
  };
  brandScore: number;
  performance: {
    timesUsed: number;
    avgOpenRate: number;
    avgClickRate: number;
    bestPerformingIn: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const contentLibraryApi = {
  // List all content
  list: async (params?: { channel?: string; campaignType?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.channel) query.set('channel', params.channel);
    if (params?.campaignType) query.set('campaignType', params.campaignType);
    if (params?.type) query.set('type', params.type);

    return apiCall<ContentLibraryItem[]>(`/api/content?${query.toString()}`);
  },

  // Get single content item
  get: async (id: string) => {
    return apiCall<ContentLibraryItem>(`/api/content/${id}`);
  },

  // Create content
  create: async (data: Partial<ContentLibraryItem>) => {
    return apiCall<ContentLibraryItem>('/api/content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update content
  update: async (id: string, data: Partial<ContentLibraryItem>) => {
    return apiCall<ContentLibraryItem>(`/api/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete content
  delete: async (id: string) => {
    return apiCall<null>(`/api/content/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// BRAND TONE API
// ============================================

export interface BrandToneConfig {
  id: string;
  brandId: string;
  voice: string;
  attributes: string[];
  wordsToUse: string[];
  wordsToAvoid: string[];
  emojiUsage: 'never' | 'sparingly' | 'encouraged';
  exclamationPolicy: 'never' | 'sparingly' | 'freely';
  channelOverrides: Record<string, Partial<BrandToneConfig>>;
  updatedAt: string;
}

export const brandToneApi = {
  // Get brand tone
  get: async (brandId: string = 'premier-nissan') => {
    return apiCall<BrandToneConfig>(`/api/content/brand-tone/${brandId}`);
  },

  // Update brand tone
  update: async (brandId: string, data: Partial<BrandToneConfig>) => {
    return apiCall<BrandToneConfig>(`/api/content/brand-tone/${brandId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Update channel override
  updateChannel: async (brandId: string, channel: string, override: Partial<BrandToneConfig>) => {
    return apiCall<BrandToneConfig>(`/api/content/brand-tone/${brandId}/channel/${channel}`, {
      method: 'PUT',
      body: JSON.stringify(override),
    });
  },
};

// ============================================
// IMAGE GENERATION API
// ============================================

export interface GeneratedImage {
  url: string;
  revisedPrompt: string;
  channel: string;
  dimensions: { width: number; height: number };
}

export interface ImageGenerationResult {
  success: boolean;
  images: GeneratedImage[];
  prompt: string;
  enhancedPrompt: string;
}

export const imageApi = {
  // Generate single image
  generate: async (params: {
    prompt: string;
    channel?: string;
    brandContext?: {
      primaryColor?: string;
      secondaryColor?: string;
      style?: string;
      industry?: string;
    };
    style?: string;
    count?: number;
  }) => {
    return apiCall<ImageGenerationResult>('/api/ai/image/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Generate for multiple channels
  generateMulti: async (params: {
    prompt: string;
    channels: string[];
    brandContext?: {
      primaryColor?: string;
      secondaryColor?: string;
      style?: string;
      industry?: string;
    };
    style?: string;
  }) => {
    return apiCall<Record<string, GeneratedImage[]>>('/api/ai/image/generate-multi', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Get available dimensions
  getDimensions: async () => {
    return apiCall<Record<string, { width: number; height: number; label: string }>>('/api/ai/image/dimensions');
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthApi = {
  check: async () => {
    return apiCall<{ status: string; service: string; timestamp: string }>('/health');
  },
};

// Export all APIs
export default {
  campaigns: campaignsApi,
  audiences: audiencesApi,
  rules: rulesApi,
  analytics: analyticsApi,
  ai: aiApi,
  health: healthApi,
  contentLibrary: contentLibraryApi,
  brandTone: brandToneApi,
  image: imageApi,
};
