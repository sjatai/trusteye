// Tools Registry - Defines ALL actions AI can take
// AI can ONLY execute actions defined here. Nothing else.

export interface ToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'demo-site' | 'email' | 'slack' | 'sms' | 'social' | 'internal';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params: ToolParam[];
  requires_approval: boolean;
  example_phrases: string[];
}

export const TOOLS_REGISTRY: Tool[] = [
  // ========================================
  // DEMO SITE TOOLS
  // ========================================
  {
    id: 'demo_site_loyalty',
    name: 'Trigger Loyalty Campaign',
    description: 'Show loyalty campaign banner on Premier Nissan website',
    category: 'demo-site',
    endpoint: 'POST /api/demo-site/loyalty',
    method: 'POST',
    params: [
      { name: 'message', type: 'string', required: true, description: 'Banner message' },
      { name: 'offer_code', type: 'string', required: false, description: 'Promo code' },
      { name: 'cta_text', type: 'string', required: false, description: 'Button text' },
      { name: 'cta_url', type: 'string', required: false, description: 'Button link' },
      { name: 'duration_hours', type: 'number', required: false, description: 'How long to show' }
    ],
    requires_approval: true,
    example_phrases: [
      'show loyalty banner on website',
      'trigger loyalty campaign on site',
      'display loyalty offer on demo site',
      'launch loyalty popup'
    ]
  },
  {
    id: 'demo_site_display_ad',
    name: 'Update Display Ad',
    description: 'Change display ad content on Premier Nissan website',
    category: 'demo-site',
    endpoint: 'POST /api/demo-site/display-ad',
    method: 'POST',
    params: [
      { name: 'headline', type: 'string', required: true, description: 'Ad headline' },
      { name: 'body', type: 'string', required: false, description: 'Ad body text' },
      { name: 'image_url', type: 'string', required: false, description: 'Ad image' },
      { name: 'cta_text', type: 'string', required: true, description: 'Button text' },
      { name: 'cta_url', type: 'string', required: true, description: 'Button link' }
    ],
    requires_approval: true,
    example_phrases: [
      'update display ad on website',
      'change the ad on site',
      'set new display ad',
      'modify website advertisement'
    ]
  },
  {
    id: 'demo_site_notification',
    name: 'Push Site Notification',
    description: 'Show notification toast to website visitors',
    category: 'demo-site',
    endpoint: 'POST /api/demo-site/notify',
    method: 'POST',
    params: [
      { name: 'message', type: 'string', required: true, description: 'Notification message' },
      { name: 'type', type: 'string', required: true, description: 'info | success | warning | error' },
      { name: 'duration_seconds', type: 'number', required: false, description: 'Auto-dismiss time' }
    ],
    requires_approval: false,
    example_phrases: [
      'send notification to website',
      'push alert on site',
      'notify website visitors',
      'show toast message'
    ]
  },

  // ========================================
  // EMAIL TOOLS
  // ========================================
  {
    id: 'send_email_campaign',
    name: 'Send Email Campaign',
    description: 'Send email to audience segment via Resend',
    category: 'email',
    endpoint: 'internal:resend',
    method: 'POST',
    params: [
      { name: 'audience_id', type: 'string', required: true, description: 'Target audience' },
      { name: 'subject', type: 'string', required: true, description: 'Email subject' },
      { name: 'body', type: 'string', required: true, description: 'Email HTML body' },
      { name: 'from_name', type: 'string', required: false, description: 'Sender name' }
    ],
    requires_approval: true,
    example_phrases: [
      'send email campaign',
      'email the customers',
      'launch email blast',
      'send marketing email'
    ]
  },
  {
    id: 'send_single_email',
    name: 'Send Single Email',
    description: 'Send email to one recipient',
    category: 'email',
    endpoint: 'internal:resend',
    method: 'POST',
    params: [
      { name: 'to', type: 'string', required: true, description: 'Recipient email' },
      { name: 'subject', type: 'string', required: true, description: 'Email subject' },
      { name: 'body', type: 'string', required: true, description: 'Email HTML body' }
    ],
    requires_approval: false,
    example_phrases: [
      'send email to',
      'email this person',
      'send a quick email'
    ]
  },

  // ========================================
  // SLACK TOOLS
  // ========================================
  {
    id: 'send_slack_notification',
    name: 'Send Slack Notification',
    description: 'Post message to Slack channel',
    category: 'slack',
    endpoint: 'internal:slack',
    method: 'POST',
    params: [
      { name: 'message', type: 'string', required: true, description: 'Message text' },
      { name: 'channel', type: 'string', required: false, description: 'Channel name (default: general)' }
    ],
    requires_approval: false,
    example_phrases: [
      'notify slack',
      'post to slack',
      'send slack message',
      'alert the team on slack'
    ]
  },
  {
    id: 'send_slack_approval',
    name: 'Request Slack Approval',
    description: 'Send approval request to Slack with approve/reject buttons',
    category: 'slack',
    endpoint: 'internal:slack_approval',
    method: 'POST',
    params: [
      { name: 'campaign_id', type: 'string', required: true, description: 'Campaign to approve' },
      { name: 'summary', type: 'string', required: true, description: 'Campaign summary' }
    ],
    requires_approval: false,
    example_phrases: [
      'request approval',
      'send for approval',
      'get sign-off'
    ]
  },

  // ========================================
  // SMS TOOLS (via Birdeye)
  // ========================================
  {
    id: 'send_sms_campaign',
    name: 'Send SMS Campaign',
    description: 'Send SMS to audience via Birdeye',
    category: 'sms',
    endpoint: 'internal:birdeye_sms',
    method: 'POST',
    params: [
      { name: 'audience_id', type: 'string', required: true, description: 'Target audience' },
      { name: 'message', type: 'string', required: true, description: 'SMS text (max 160 chars)' }
    ],
    requires_approval: true,
    example_phrases: [
      'send sms campaign',
      'text the customers',
      'send text message blast'
    ]
  },

  // ========================================
  // SOCIAL TOOLS (via Late.dev)
  // ========================================
  {
    id: 'post_social',
    name: 'Post to Social Media',
    description: 'Post content to social media via Late.dev',
    category: 'social',
    endpoint: 'internal:late_dev',
    method: 'POST',
    params: [
      { name: 'platforms', type: 'array', required: true, description: 'facebook, instagram, twitter, linkedin' },
      { name: 'content', type: 'string', required: true, description: 'Post content' },
      { name: 'image_url', type: 'string', required: false, description: 'Image to attach' },
      { name: 'schedule_at', type: 'string', required: false, description: 'ISO datetime to post' }
    ],
    requires_approval: true,
    example_phrases: [
      'post to social media',
      'share on facebook',
      'tweet this',
      'post on linkedin'
    ]
  },

  // ========================================
  // INTERNAL / DATA TOOLS
  // ========================================
  {
    id: 'get_audience',
    name: 'Get Audience Segment',
    description: 'Retrieve audience segment details',
    category: 'internal',
    endpoint: 'GET /api/audiences/:id',
    method: 'GET',
    params: [
      { name: 'id', type: 'string', required: true, description: 'Audience ID' }
    ],
    requires_approval: false,
    example_phrases: [
      'get audience',
      'show me the segment',
      'who is in this audience'
    ]
  },
  {
    id: 'create_audience',
    name: 'Create Audience Segment',
    description: 'Create a new audience segment',
    category: 'internal',
    endpoint: 'POST /api/audiences',
    method: 'POST',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Segment name' },
      { name: 'description', type: 'string', required: false, description: 'Segment description' },
      { name: 'conditions', type: 'object', required: true, description: 'Filter conditions' }
    ],
    requires_approval: false,
    example_phrases: [
      'create audience',
      'build segment',
      'make a new audience'
    ]
  },
  {
    id: 'get_reviews',
    name: 'Get Birdeye Reviews',
    description: 'Fetch reviews from Birdeye',
    category: 'internal',
    endpoint: 'internal:birdeye_reviews',
    method: 'GET',
    params: [
      { name: 'count', type: 'number', required: false, description: 'Number of reviews' },
      { name: 'rating', type: 'number', required: false, description: 'Filter by rating' },
      { name: 'location', type: 'string', required: false, description: 'Location filter' }
    ],
    requires_approval: false,
    example_phrases: [
      'get reviews',
      'show me recent reviews',
      'fetch 5-star reviews',
      'what are customers saying'
    ]
  },
  {
    id: 'analyze_reviews',
    name: 'Analyze Reviews',
    description: 'AI analysis of review sentiment and themes',
    category: 'internal',
    endpoint: 'POST /api/ai/reviews/analyze',
    method: 'POST',
    params: [
      { name: 'count', type: 'number', required: false, description: 'Reviews to analyze' }
    ],
    requires_approval: false,
    example_phrases: [
      'analyze reviews',
      'what are the themes',
      'review sentiment analysis'
    ]
  },
  {
    id: 'get_competitors',
    name: 'Get Competitor Insights',
    description: 'Fetch competitor data from Birdeye',
    category: 'internal',
    endpoint: 'internal:birdeye_competitors',
    method: 'GET',
    params: [],
    requires_approval: false,
    example_phrases: [
      'competitor analysis',
      'how are competitors doing',
      'show competitor reviews'
    ]
  },
  {
    id: 'create_campaign',
    name: 'Create Campaign',
    description: 'Create a new marketing campaign',
    category: 'internal',
    endpoint: 'POST /api/campaigns',
    method: 'POST',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Campaign name' },
      { name: 'type', type: 'string', required: true, description: 'Campaign type' },
      { name: 'audience_id', type: 'string', required: true, description: 'Target audience' },
      { name: 'channels', type: 'array', required: true, description: 'Marketing channels' },
      { name: 'content', type: 'object', required: true, description: 'Campaign content' }
    ],
    requires_approval: true,
    example_phrases: [
      'create campaign',
      'build a campaign',
      'set up marketing campaign',
      'launch campaign'
    ]
  },
  {
    id: 'generate_content',
    name: 'Generate Marketing Content',
    description: 'AI-generate marketing content with brand voice',
    category: 'internal',
    endpoint: 'POST /api/ai/content/generate',
    method: 'POST',
    params: [
      { name: 'campaignType', type: 'string', required: true, description: 'Type of campaign' },
      { name: 'audience', type: 'object', required: true, description: 'Target audience' },
      { name: 'channels', type: 'array', required: true, description: 'Output channels' },
      { name: 'goal', type: 'string', required: true, description: 'Campaign goal' }
    ],
    requires_approval: false,
    example_phrases: [
      'generate content',
      'create email copy',
      'write marketing message',
      'draft campaign content'
    ]
  }
];

// Get tool by ID
export function getToolById(id: string): Tool | undefined {
  return TOOLS_REGISTRY.find(t => t.id === id);
}

// Get tools by category
export function getToolsByCategory(category: Tool['category']): Tool[] {
  return TOOLS_REGISTRY.filter(t => t.category === category);
}

// Get tools requiring approval
export function getApprovalRequiredTools(): Tool[] {
  return TOOLS_REGISTRY.filter(t => t.requires_approval);
}

export default TOOLS_REGISTRY;
