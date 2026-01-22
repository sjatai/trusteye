// Content Marketing Types

export type ContentChannel = 'email' | 'sms' | 'instagram' | 'linkedin' | 'twitter' | 'slack' | 'web-banner';

export type CampaignType =
  | 'referral'
  | 'recovery'
  | 'winback'
  | 'conquest'
  | 'welcome'
  | 'loyalty'
  | 'service'
  | 'birthday'
  | 'seasonal';

export interface ContentPerformance {
  timesUsed: number;
  avgOpenRate: number;
  avgClickRate: number;
  bestPerformingIn?: CampaignType;
  isMock: true; // Always true - all performance data is simulated
}

export interface ContentVariation {
  id: string;
  version: 'A' | 'B';
  content: ContentBody;
  brandScore: number;
}

export interface ContentBody {
  subject?: string;      // For email
  body: string;          // Main content
  cta?: string;          // Call to action
  hashtags?: string[];   // For Instagram
  imageUrl?: string;     // For Instagram/banner
  dimensions?: string;   // For banner (e.g., "728x90")
}

export interface ContentItem {
  id: string;
  name: string;
  type: 'template' | 'image' | 'banner';
  channels: ContentChannel[];
  campaignTypes: CampaignType[];
  content: ContentBody;
  brandScore: number;
  performance: ContentPerformance;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelOverride {
  voice?: string;
  attributes?: string[];
  emojiUsage?: 'none' | 'sparingly' | 'freely';
  maxLength?: number;
}

export interface BrandTone {
  voice: string;
  attributes: string[];
  wordsToUse: string[];
  wordsToAvoid: string[];
  emojiUsage: 'none' | 'sparingly' | 'freely';
  exclamationPolicy: 'avoid' | 'sparingly' | 'allowed';
  channelOverrides: Partial<Record<ContentChannel, ChannelOverride>>;
}

// Channel display configuration
export const CHANNEL_CONFIG: Record<ContentChannel, { icon: string; label: string; color: string }> = {
  'email': { icon: '📧', label: 'Email', color: 'purple' },
  'sms': { icon: '📱', label: 'SMS', color: 'green' },
  'instagram': { icon: '📸', label: 'Instagram', color: 'pink' },
  'linkedin': { icon: '💼', label: 'LinkedIn', color: 'sky' },
  'twitter': { icon: '🐦', label: 'Twitter/X', color: 'slate' },
  'slack': { icon: '💬', label: 'Slack', color: 'amber' },
  'web-banner': { icon: '🖼️', label: 'Banner', color: 'blue' },
};

// Campaign type display configuration
export const CAMPAIGN_TYPE_CONFIG: Record<CampaignType, { label: string; color: string }> = {
  'referral': { label: 'Referral', color: 'emerald' },
  'recovery': { label: 'Recovery', color: 'red' },
  'winback': { label: 'Win-back', color: 'amber' },
  'conquest': { label: 'Conquest', color: 'purple' },
  'welcome': { label: 'Welcome', color: 'sky' },
  'loyalty': { label: 'Loyalty', color: 'indigo' },
  'service': { label: 'Service', color: 'slate' },
  'birthday': { label: 'Birthday', color: 'pink' },
  'seasonal': { label: 'Seasonal', color: 'teal' },
};
