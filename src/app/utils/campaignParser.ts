/**
 * Campaign Parser Utilities
 * Extracts campaign type, audience, and other details from natural language commands
 */

export interface ParsedCampaign {
  campaignType: string;
  campaignLabel: string;
  audienceDescription: string;
  isEventBased: boolean;
  isCustomType: boolean;
  channels: string[];
}

// Campaign type definitions
export const CAMPAIGN_TYPES = [
  { value: 'new', label: '+ New Campaign', isEventBased: false },
  { value: 'loyalty', label: 'Loyalty Campaign', isEventBased: true },
  { value: 'referral', label: 'Referral Campaign', isEventBased: false },
  { value: 'recovery', label: 'Recovery Campaign', isEventBased: false },
  { value: 'conquest', label: 'Conquest Campaign', isEventBased: false },
  { value: 'win-back', label: 'Win-Back Campaign', isEventBased: false },
  { value: 'promotional', label: 'Promotional Campaign', isEventBased: false },
  { value: 'seasonal', label: 'Seasonal Campaign', isEventBased: false },
];

// Event-based audience options
export const EVENT_BASED_AUDIENCES = [
  'Website Visitors',
  'Appointment Bookers',
  'Service Completers',
  'Purchase Events',
  'Review Submitters',
];

// Standard audience options
export const STANDARD_AUDIENCES = [
  '5-Star Reviewers',
  'Negative Reviewers (1-2 stars)',
  'Inactive 90+ Days',
  'VIP Members',
  'High-Value Buyers',
  'Churn Risk Users',
  'New Subscribers',
  'Repeat Purchasers',
  'Cart Abandoners',
];

// Available channels
export const AVAILABLE_CHANNELS = ['email', 'slack', 'sms'];

/**
 * Parse a natural language command into campaign details
 */
export function parseCampaignCommand(query: string): ParsedCampaign {
  const lowerQuery = query.toLowerCase();

  let campaignType = 'custom';
  let campaignLabel = 'Custom';
  let audienceDescription = 'target customers';
  let isEventBased = false;
  let isCustomType = true;
  let channels: string[] = ['email'];

  // Detect campaign type
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
  } else if (lowerQuery.includes('service') || lowerQuery.includes('maintenance') || lowerQuery.includes('reminder')) {
    campaignType = 'service';
    campaignLabel = 'Service Reminder';
    audienceDescription = 'Customers due for service';
    isCustomType = false;
  } else if (lowerQuery.includes('loyalty') || lowerQuery.includes('vip') || lowerQuery.includes('reward') || lowerQuery.includes('points')) {
    campaignType = 'loyalty';
    campaignLabel = 'Loyalty';
    isEventBased = true;
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

  // Detect channels from query
  channels = ['email']; // Default
  if (lowerQuery.includes('slack')) channels.push('slack');
  if (lowerQuery.includes('sms') || lowerQuery.includes('text')) channels.push('sms');

  return {
    campaignType,
    campaignLabel,
    audienceDescription,
    isEventBased,
    isCustomType,
    channels,
  };
}

/**
 * Check if a campaign type is event-based
 */
export function isEventBasedCampaign(campaignType: string): boolean {
  const type = CAMPAIGN_TYPES.find(t => t.value === campaignType);
  return type?.isEventBased || false;
}

/**
 * Get timing options based on whether campaign is event-based
 */
export function getTimingOptions(isEventBased: boolean): string[] {
  if (isEventBased) {
    return [
      'Ongoing (Always Active)',
      'Next 7 Days',
      'Next 30 Days',
      'Next 90 Days',
      'Custom Duration',
    ];
  }
  return [
    'Send Immediately',
    'Schedule for Tomorrow',
    'Schedule for Weekend',
    'Optimal Send Time (AI)',
    'Custom Schedule',
  ];
}

/**
 * Get audience options based on campaign type
 */
export function getAudienceOptions(isEventBased: boolean): string[] {
  return isEventBased ? EVENT_BASED_AUDIENCES : STANDARD_AUDIENCES;
}

/**
 * Validate channels against available integrations
 */
export function validateChannels(requestedChannels: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid = requestedChannels.filter(c => AVAILABLE_CHANNELS.includes(c.toLowerCase()));
  const invalid = requestedChannels.filter(c => !AVAILABLE_CHANNELS.includes(c.toLowerCase()));
  return { valid, invalid };
}
