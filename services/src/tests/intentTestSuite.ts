// Intent Test Suite
// 32 test cases for the Marketing Intelligence Engine

export interface TestCase {
  id: number;
  input: string;
  expected: {
    actionCategory: string;
    channel?: string;
    campaignType?: string;
    audience?: string;
  };
  minConfidence: number;
  category: 'basic' | 'channel' | 'campaign_type' | 'audience' | 'compound' | 'edge_case';
  description: string;
}

export const TEST_CASES: TestCase[] = [
  // ========================================
  // BASIC ACTION TESTS (1-6)
  // ========================================
  {
    id: 1,
    input: 'create a campaign',
    expected: { actionCategory: 'create' },
    minConfidence: 40,
    category: 'basic',
    description: 'Simple create action'
  },
  {
    id: 2,
    input: 'send an email',
    expected: { actionCategory: 'send', channel: 'email' },
    minConfidence: 60,
    category: 'basic',
    description: 'Send email action'
  },
  {
    id: 3,
    input: 'show a banner on the website',
    expected: { actionCategory: 'show', channel: 'demo-site' },
    minConfidence: 60,
    category: 'basic',
    description: 'Show banner action'
  },
  {
    id: 4,
    input: 'analyze the reviews',
    expected: { actionCategory: 'analyze' },
    minConfidence: 60,
    category: 'basic',
    description: 'Analyze action'
  },
  {
    id: 5,
    input: 'generate content for the campaign',
    expected: { actionCategory: 'generate' },
    minConfidence: 50,
    category: 'basic',
    description: 'Generate action'
  },
  {
    id: 6,
    input: 'get the list of customers',
    expected: { actionCategory: 'get' },
    minConfidence: 50,
    category: 'basic',
    description: 'Get/retrieve action'
  },

  // ========================================
  // CHANNEL TESTS (7-12)
  // ========================================
  {
    id: 7,
    input: 'text customers about the service',
    expected: { actionCategory: 'send', channel: 'sms' },
    minConfidence: 60,
    category: 'channel',
    description: 'SMS via "text" keyword'
  },
  {
    id: 8,
    input: 'post on social media',
    expected: { actionCategory: 'send', channel: 'social' },
    minConfidence: 60,
    category: 'channel',
    description: 'Social media channel'
  },
  {
    id: 9,
    input: 'notify the team on slack',
    expected: { actionCategory: 'send', channel: 'slack' },
    minConfidence: 60,
    category: 'channel',
    description: 'Slack channel'
  },
  {
    id: 10,
    input: 'send an SMS to customers',
    expected: { actionCategory: 'send', channel: 'sms' },
    minConfidence: 60,
    category: 'channel',
    description: 'Direct SMS mention'
  },
  {
    id: 11,
    input: 'push a notification on the website',
    expected: { actionCategory: 'show', channel: 'demo-site' },
    minConfidence: 60,
    category: 'channel',
    description: 'Website notification'
  },
  {
    id: 12,
    input: 'post on Facebook and Instagram',
    expected: { actionCategory: 'send', channel: 'social' },
    minConfidence: 60,
    category: 'channel',
    description: 'Social platforms by name'
  },

  // ========================================
  // CAMPAIGN TYPE TESTS (13-20)
  // ========================================
  {
    id: 13,
    input: 'create a win-back campaign',
    expected: { actionCategory: 'create', campaignType: 'win-back' },
    minConfidence: 60,
    category: 'campaign_type',
    description: 'Win-back campaign'
  },
  {
    id: 14,
    input: 'launch a loyalty program',
    expected: { actionCategory: 'create', campaignType: 'loyalty' },
    minConfidence: 60,
    category: 'campaign_type',
    description: 'Loyalty campaign'
  },
  {
    id: 15,
    input: 'run a promotional sale campaign',
    expected: { actionCategory: 'create', campaignType: 'promotional' },
    minConfidence: 60,
    category: 'campaign_type',
    description: 'Promotional campaign'
  },
  {
    id: 16,
    input: 'set up a referral program',
    expected: { actionCategory: 'create', campaignType: 'referral' },
    minConfidence: 60,
    category: 'campaign_type',
    description: 'Referral campaign'
  },
  {
    id: 17,
    input: 'request reviews from customers',
    expected: { actionCategory: 'create', campaignType: 'review' },
    minConfidence: 60,
    category: 'campaign_type',
    description: 'Review request campaign'
  },
  {
    id: 18,
    input: 'announce the new model launch',
    expected: { actionCategory: 'create', campaignType: 'product-launch' },
    minConfidence: 60,
    category: 'campaign_type',
    description: 'Product launch campaign'
  },
  {
    id: 19,
    input: 'send service reminders',
    expected: { actionCategory: 'send', campaignType: 'service-reminder' },
    minConfidence: 60,
    category: 'campaign_type',
    description: 'Service reminder campaign'
  },
  {
    id: 20,
    input: 're-engage inactive customers',
    expected: { actionCategory: 'create', campaignType: 'win-back' },
    minConfidence: 50,
    category: 'campaign_type',
    description: 'Win-back via alias "re-engage"'
  },

  // ========================================
  // AUDIENCE TESTS (21-26)
  // ========================================
  {
    id: 21,
    input: 'email inactive customers',
    expected: { actionCategory: 'send', channel: 'email', audience: 'inactive_customers' },
    minConfidence: 70,
    category: 'audience',
    description: 'Inactive audience'
  },
  {
    id: 22,
    input: 'send to VIP customers',
    expected: { actionCategory: 'send', audience: 'loyal_customers' },
    minConfidence: 60,
    category: 'audience',
    description: 'VIP/loyal audience'
  },
  {
    id: 23,
    input: 'text happy customers',
    expected: { actionCategory: 'send', channel: 'sms', audience: 'satisfied_customers' },
    minConfidence: 60,
    category: 'audience',
    description: 'Satisfied audience'
  },
  {
    id: 24,
    input: 'email customers who just bought',
    expected: { actionCategory: 'send', channel: 'email', audience: 'recent_purchasers' },
    minConfidence: 60,
    category: 'audience',
    description: 'Recent purchasers audience'
  },
  {
    id: 25,
    input: 'send to everyone',
    expected: { actionCategory: 'send', audience: 'all_customers' },
    minConfidence: 60,
    category: 'audience',
    description: 'All customers audience'
  },
  {
    id: 26,
    input: 'notify local customers',
    expected: { actionCategory: 'send', audience: 'local_customers' },
    minConfidence: 60,
    category: 'audience',
    description: 'Local customers audience'
  },

  // ========================================
  // COMPOUND TESTS (27-30)
  // ========================================
  {
    id: 27,
    input: 'create a win-back email campaign for inactive customers',
    expected: {
      actionCategory: 'create',
      channel: 'email',
      campaignType: 'win-back',
      audience: 'inactive_customers'
    },
    minConfidence: 80,
    category: 'compound',
    description: 'Full compound: action + channel + type + audience'
  },
  {
    id: 28,
    input: 'send a loyalty SMS to VIP customers',
    expected: {
      actionCategory: 'send',
      channel: 'sms',
      campaignType: 'loyalty',
      audience: 'loyal_customers'
    },
    minConfidence: 80,
    category: 'compound',
    description: 'Compound: send + sms + loyalty + vip'
  },
  {
    id: 29,
    input: 'launch a referral campaign via email for satisfied customers',
    expected: {
      actionCategory: 'create',
      channel: 'email',
      campaignType: 'referral',
      audience: 'satisfied_customers'
    },
    minConfidence: 80,
    category: 'compound',
    description: 'Compound: launch + email + referral + satisfied'
  },
  {
    id: 30,
    input: 'show a promotional banner on the website for all visitors',
    expected: {
      actionCategory: 'show',
      channel: 'demo-site',
      campaignType: 'promotional'
    },
    minConfidence: 70,
    category: 'compound',
    description: 'Compound: show + website + promotional'
  },

  // ========================================
  // EDGE CASES (31-32)
  // ========================================
  {
    id: 31,
    input: 'blast',
    expected: { actionCategory: 'send' },
    minConfidence: 30,
    category: 'edge_case',
    description: 'Single word input (minimal)'
  },
  {
    id: 32,
    input: 'Can you help me reach out to customers who havent visited in 90 days with a special offer?',
    expected: {
      actionCategory: 'send',
      campaignType: 'win-back',
      audience: 'inactive_customers'
    },
    minConfidence: 50,
    category: 'edge_case',
    description: 'Natural language with context'
  }
];

// Group tests by category
export function getTestsByCategory(): Record<string, TestCase[]> {
  const grouped: Record<string, TestCase[]> = {};
  for (const test of TEST_CASES) {
    if (!grouped[test.category]) {
      grouped[test.category] = [];
    }
    grouped[test.category].push(test);
  }
  return grouped;
}

// Get total test count
export function getTotalTestCount(): number {
  return TEST_CASES.length;
}

export default TEST_CASES;
