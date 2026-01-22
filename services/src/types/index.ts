// TrustEye API Types

export interface Campaign {
  id: string;
  name: string;
  type: 'win-back' | 'promotional' | 'product-launch' | 'nurture' | 'loyalty' | 'event' | 'feedback' | 'announcement' | 'referral' | 'review';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  channels: ('email' | 'sms' | 'social' | 'in-app')[];
  audience_id?: string;
  content?: CampaignContent;
  schedule?: CampaignSchedule;
  metrics?: CampaignMetrics;
  created_at: string;
  updated_at: string;
}

export interface CampaignContent {
  subject?: string;
  body?: string;
  cta?: string;
  preview_text?: string;
}

export interface CampaignSchedule {
  start_date?: string;
  end_date?: string;
  timezone?: string;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface Audience {
  id: string;
  name: string;
  description?: string;
  conditions: AudienceConditions;
  estimated_size?: number;
  created_at: string;
  updated_at: string;
}

export interface AudienceConditions {
  inactive_days?: number;
  min_purchase_value?: number;
  location?: string;
  tags?: string[];
  custom_filters?: Record<string, any>;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'review' | 'purchase' | 'signup' | 'inactivity' | 'custom';
  trigger_conditions: Record<string, any>;
  actions: RuleAction[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RuleAction {
  type: 'suggest_campaign' | 'send_notification' | 'create_task' | 'update_record';
  config: Record<string, any>;
}

export interface GateResult {
  gate: 1 | 2 | 3;
  passed: boolean;
  details: Record<string, any>;
  timestamp: string;
}

export interface ReviewResult {
  campaign_id: string;
  gates: GateResult[];
  overall_passed: boolean;
  brand_score?: number;
  risk_level?: 'low' | 'medium' | 'high';
}

export interface AnalyticsOverview {
  total_campaigns: number;
  active_campaigns: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  average_open_rate: number;
  average_click_rate: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Failsafe wrapper type
export type FailsafeResult<T> = {
  data: T;
  fromCache: boolean;
};
