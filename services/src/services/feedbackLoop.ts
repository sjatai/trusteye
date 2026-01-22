/**
 * Feedback Loop Service
 *
 * Demonstrates: Memory, Causality, Adaptation, Control
 *
 * Tracks learnings from campaign performance and shows
 * "What changed since last time" - the key differentiator
 */

export interface Learning {
  id: string;
  type: 'exclusion' | 'timing' | 'strategy' | 'audience' | 'content';
  insight: string;
  action: string;
  source: string; // What data triggered this learning
  confidence: number; // 0-100
  appliedAt: string;
  impact?: {
    metric: string;
    before: number;
    after: number;
    improvement: string;
  };
}

export interface Adjustment {
  id: string;
  category: 'audience' | 'timing' | 'content' | 'strategy';
  description: string;
  reason: string;
  previousValue?: string;
  newValue?: string;
}

export interface FeedbackSummary {
  campaignType: string;
  adjustmentsMade: Adjustment[];
  learningsApplied: Learning[];
  lastUpdated: string;
  improvementSummary: string;
}

// Simulated learnings from Q3 performance data
const LEARNINGS_DATABASE: Learning[] = [
  {
    id: 'learn-001',
    type: 'exclusion',
    insight: 'Customers with unresolved negative reviews have 73% lower conversion',
    action: 'Excluded customers with unresolved negative reviews from promotional campaigns',
    source: 'Q3 Campaign Performance Analysis',
    confidence: 94,
    appliedAt: '2026-01-15T10:00:00Z',
    impact: {
      metric: 'Conversion Rate',
      before: 4.2,
      after: 7.8,
      improvement: '+86%'
    }
  },
  {
    id: 'learn-002',
    type: 'timing',
    insight: 'Messages sent within 2 days of previous contact have 45% lower open rates',
    action: 'Increased minimum wait time between messages from 2 → 5 days',
    source: 'Email Fatigue Analysis',
    confidence: 89,
    appliedAt: '2026-01-18T14:30:00Z',
    impact: {
      metric: 'Open Rate',
      before: 22.4,
      after: 31.2,
      improvement: '+39%'
    }
  },
  {
    id: 'learn-003',
    type: 'strategy',
    insight: 'VIP customers respond 2.3x better to referral asks than discount offers',
    action: 'Prioritized referral over discount offers for VIP segment',
    source: 'VIP Segment A/B Test Results',
    confidence: 91,
    appliedAt: '2026-01-19T09:00:00Z',
    impact: {
      metric: 'Response Rate',
      before: 12.1,
      after: 27.8,
      improvement: '+130%'
    }
  },
  {
    id: 'learn-004',
    type: 'content',
    insight: 'Subject lines with customer name have 18% higher open rate',
    action: 'Added personalization to all subject lines',
    source: 'Subject Line Performance Analysis',
    confidence: 96,
    appliedAt: '2026-01-20T11:00:00Z',
    impact: {
      metric: 'Open Rate',
      before: 28.4,
      after: 33.5,
      improvement: '+18%'
    }
  },
  {
    id: 'learn-005',
    type: 'audience',
    insight: 'Riverside location customers need service quality focus, not more marketing',
    action: 'Reduced campaign frequency for Riverside by 40%, added service follow-up',
    source: 'Location Performance Variance Report',
    confidence: 87,
    appliedAt: '2026-01-21T08:00:00Z',
    impact: {
      metric: 'Customer Satisfaction',
      before: 3.2,
      after: 4.1,
      improvement: '+28%'
    }
  },
  {
    id: 'learn-006',
    type: 'timing',
    insight: 'Saturday 10 AM sends outperform all other times by 18%',
    action: 'Shifted default send time from Tuesday 2 PM to Saturday 10 AM',
    source: 'Send Time Optimization Study',
    confidence: 93,
    appliedAt: '2026-01-17T16:00:00Z',
    impact: {
      metric: 'Open Rate',
      before: 26.1,
      after: 30.8,
      improvement: '+18%'
    }
  },
  {
    id: 'learn-007',
    type: 'strategy',
    insight: '20% discount optimal for win-back; 15% under-performs by 23%',
    action: 'Increased win-back discount from 15% → 20%',
    source: 'Win-Back Campaign Analysis',
    confidence: 88,
    appliedAt: '2026-01-16T13:00:00Z',
    impact: {
      metric: 'Reactivation Rate',
      before: 8.4,
      after: 14.2,
      improvement: '+69%'
    }
  },
  {
    id: 'learn-008',
    type: 'exclusion',
    insight: 'Customers contacted in last 7 days have 52% higher unsubscribe rate',
    action: 'Added 7-day cooling period after any customer contact',
    source: 'Unsubscribe Pattern Analysis',
    confidence: 92,
    appliedAt: '2026-01-14T10:00:00Z',
    impact: {
      metric: 'Unsubscribe Rate',
      before: 2.8,
      after: 1.1,
      improvement: '-61%'
    }
  }
];

// Get recent adjustments for a campaign type
export function getAdjustmentsForCampaign(campaignType: string): Adjustment[] {
  const adjustments: Adjustment[] = [];

  // Normalize campaign type (handle win-back vs winback)
  const normalizedType = campaignType.toLowerCase().replace('-', '');

  // REFERRAL campaigns - targeting happy customers (5-star reviewers)
  if (normalizedType === 'referral' || normalizedType === 'loyalty') {
    adjustments.push({
      id: 'adj-ref-001',
      category: 'audience',
      description: 'Excluded customers with unresolved negative reviews',
      reason: '73% lower conversion rate observed in Q3',
      previousValue: 'All customers in segment',
      newValue: 'Only customers with positive/neutral history'
    });

    adjustments.push({
      id: 'adj-ref-002',
      category: 'timing',
      description: 'Increased wait time between messages from 2 → 5 days',
      reason: '45% lower open rates when contacted within 2 days',
      previousValue: '2 days minimum',
      newValue: '5 days minimum'
    });

    adjustments.push({
      id: 'adj-ref-003',
      category: 'strategy',
      description: 'Prioritized referral over discount offers',
      reason: 'VIP customers respond 2.3x better to referral asks',
      previousValue: '15% discount offer',
      newValue: 'Referral program with reciprocal benefit ($100 each)'
    });
  }

  // RECOVERY campaigns - targeting unhappy customers (1-2 star reviewers)
  if (normalizedType === 'recovery') {
    adjustments.push({
      id: 'adj-rec-001',
      category: 'timing',
      description: 'Response time reduced to within 2 hours',
      reason: 'Recovery rate drops 50% after 24 hours',
      previousValue: 'Next business day',
      newValue: 'Within 2 hours of negative review'
    });

    adjustments.push({
      id: 'adj-rec-002',
      category: 'strategy',
      description: 'Added personal manager outreach',
      reason: 'Manager contact increases resolution by 40%',
      previousValue: 'Generic support email',
      newValue: 'Personal call from Service Director'
    });

    adjustments.push({
      id: 'adj-rec-003',
      category: 'content',
      description: 'Lead with apology before offering compensation',
      reason: '"We\'re sorry" first increases acceptance by 28%',
      previousValue: 'Discount-first messaging',
      newValue: 'Apology → acknowledgment → compensation'
    });
  }

  // WIN-BACK campaigns - targeting inactive customers (90+ days)
  if (normalizedType === 'winback') {
    adjustments.push({
      id: 'adj-win-001',
      category: 'content',
      description: 'Increased discount from 15% to 20%',
      reason: '15% under-performs by 23% for win-back campaigns',
      previousValue: '15% discount',
      newValue: '20% discount'
    });

    adjustments.push({
      id: 'adj-win-002',
      category: 'content',
      description: 'Lead with "we miss you" before discount',
      reason: 'Emotional lead outperforms discount-first by 34%',
      previousValue: 'Discount-first messaging',
      newValue: '"We miss you" emotional lead'
    });

    adjustments.push({
      id: 'adj-win-003',
      category: 'strategy',
      description: 'Added SMS follow-up to email',
      reason: 'Email+SMS combo has 52% higher reactivation',
      previousValue: 'Email only',
      newValue: 'Email + SMS after 3 days'
    });
  }

  // CONQUEST campaigns - targeting competitor customers
  if (normalizedType === 'conquest') {
    adjustments.push({
      id: 'adj-con-001',
      category: 'content',
      description: 'Highlighted speed advantage (1.8hr vs 2.5hr)',
      reason: 'Wait time is #1 complaint in competitor reviews',
      previousValue: 'Generic value proposition',
      newValue: 'Specific speed comparison'
    });

    adjustments.push({
      id: 'adj-con-002',
      category: 'strategy',
      description: 'Increased first-visit discount to 25%',
      reason: 'Switching cost barrier requires stronger incentive',
      previousValue: '15% first service',
      newValue: '25% first service'
    });

    adjustments.push({
      id: 'adj-con-003',
      category: 'content',
      description: 'Added satisfaction guarantee',
      reason: 'Reduces perceived risk of switching by 45%',
      previousValue: 'No guarantee',
      newValue: 'Money-back if not satisfied'
    });
  }

  // SERVICE campaigns - reminder for maintenance
  if (normalizedType === 'service') {
    adjustments.push({
      id: 'adj-svc-001',
      category: 'timing',
      description: 'Send time optimized to Saturday 10 AM',
      reason: 'Saturday sends have 18% higher open rate',
      previousValue: 'Tuesday 2 PM',
      newValue: 'Saturday 10 AM'
    });

    adjustments.push({
      id: 'adj-svc-002',
      category: 'audience',
      description: 'Excluded customers contacted in last 7 days',
      reason: '52% higher unsubscribe rate when over-contacted',
      previousValue: 'No cooling period',
      newValue: '7-day minimum between contacts'
    });
  }

  // CUSTOM / PROMOTIONAL campaigns - general best practices
  if (normalizedType === 'custom' || normalizedType === 'promotional' || adjustments.length === 0) {
    // Only add if no other adjustments were added
    if (adjustments.length === 0) {
      adjustments.push({
        id: 'adj-gen-001',
        category: 'content',
        description: 'Added personalization to subject lines',
        reason: 'Personalized subjects have 18% higher open rate',
        previousValue: 'Generic subject line',
        newValue: 'Include [First Name] in subject'
      });

      adjustments.push({
        id: 'adj-gen-002',
        category: 'timing',
        description: 'Optimized send time based on audience behavior',
        reason: 'AI analyzed past engagement patterns',
        previousValue: 'Default send time',
        newValue: 'Best time for this audience segment'
      });

      adjustments.push({
        id: 'adj-gen-003',
        category: 'audience',
        description: 'Excluded recently contacted customers',
        reason: 'Prevent email fatigue and unsubscribes',
        previousValue: 'No exclusions',
        newValue: '7-day cooling period applied'
      });
    }
  }

  return adjustments;
}

// Get all learnings, optionally filtered by type
export function getLearnings(type?: Learning['type']): Learning[] {
  if (type) {
    return LEARNINGS_DATABASE.filter(l => l.type === type);
  }
  return LEARNINGS_DATABASE;
}

// Get feedback summary for a campaign type
export function getFeedbackSummary(campaignType: string): FeedbackSummary {
  const adjustments = getAdjustmentsForCampaign(campaignType);
  const relevantLearnings = getRelevantLearnings(campaignType);

  // Calculate overall improvement
  const improvements = relevantLearnings
    .filter(l => l.impact)
    .map(l => parseFloat(l.impact!.improvement));

  const avgImprovement = improvements.length > 0
    ? (improvements.reduce((a, b) => a + b, 0) / improvements.length).toFixed(0)
    : '0';

  return {
    campaignType,
    adjustmentsMade: adjustments,
    learningsApplied: relevantLearnings,
    lastUpdated: new Date().toISOString(),
    improvementSummary: `${adjustments.length} adjustments applied based on ${relevantLearnings.length} learnings. Average improvement: ${avgImprovement}%`
  };
}

// Get learnings relevant to a campaign type
function getRelevantLearnings(campaignType: string): Learning[] {
  // Normalize campaign type
  const normalizedType = campaignType.toLowerCase().replace('-', '');

  const specific: Learning[] = [];

  // Referral/loyalty - VIP and referral learnings
  if (normalizedType === 'referral' || normalizedType === 'loyalty') {
    specific.push(...LEARNINGS_DATABASE.filter(l =>
      l.insight.toLowerCase().includes('referral') ||
      l.insight.toLowerCase().includes('vip') ||
      l.insight.toLowerCase().includes('negative reviews')
    ));
  }

  // Win-back - discount and reactivation learnings
  if (normalizedType === 'winback') {
    specific.push(...LEARNINGS_DATABASE.filter(l =>
      l.insight.toLowerCase().includes('win-back') ||
      l.insight.toLowerCase().includes('discount') ||
      l.insight.toLowerCase().includes('inactive')
    ));
  }

  // Recovery - timing and customer satisfaction learnings
  if (normalizedType === 'recovery') {
    specific.push(...LEARNINGS_DATABASE.filter(l =>
      l.insight.toLowerCase().includes('within') ||
      l.insight.toLowerCase().includes('satisfaction') ||
      l.insight.toLowerCase().includes('subject line')
    ));
  }

  // Conquest - competitive learnings
  if (normalizedType === 'conquest') {
    specific.push(...LEARNINGS_DATABASE.filter(l =>
      l.insight.toLowerCase().includes('competitor') ||
      l.insight.toLowerCase().includes('switch')
    ));
  }

  // Service - timing learnings
  if (normalizedType === 'service') {
    specific.push(...LEARNINGS_DATABASE.filter(l =>
      l.insight.toLowerCase().includes('saturday') ||
      l.insight.toLowerCase().includes('send time') ||
      l.insight.toLowerCase().includes('contacted')
    ));
  }

  // Deduplicate
  return specific.filter((l, i, arr) => arr.findIndex(x => x.id === l.id) === i);
}

// Format adjustments for display (the "What changed" view)
export function formatAdjustmentsForDisplay(campaignType: string): string {
  const adjustments = getAdjustmentsForCampaign(campaignType);

  const lines = [
    '🔁 Adjustments made based on performance data:',
    ''
  ];

  for (const adj of adjustments) {
    lines.push(`– ${adj.description}`);
  }

  return lines.join('\n');
}

// Get the "What changed since last time" data for UI display
export function getWhatChanged(campaignType: string): {
  title: string;
  adjustments: { icon: string; text: string; reason: string }[];
  confidence: number;
  dataSource: string;
} {
  const adjustments = getAdjustmentsForCampaign(campaignType);

  const iconMap: Record<Adjustment['category'], string> = {
    audience: '👥',
    timing: '⏰',
    content: '✍️',
    strategy: '🎯'
  };

  return {
    title: 'What changed since last time',
    adjustments: adjustments.map(adj => ({
      icon: iconMap[adj.category] || '🔄',
      text: adj.description,
      reason: adj.reason
    })),
    confidence: 91, // Average confidence from learnings
    dataSource: 'Q3 Campaign Performance + Real-time Analytics'
  };
}

// Record a new learning (for future: hook into actual campaign results)
export function recordLearning(learning: Omit<Learning, 'id' | 'appliedAt'>): Learning {
  const newLearning: Learning = {
    ...learning,
    id: `learn-${Date.now()}`,
    appliedAt: new Date().toISOString()
  };

  LEARNINGS_DATABASE.push(newLearning);
  console.log(`📚 New learning recorded: ${learning.insight}`);

  return newLearning;
}

export default {
  getAdjustmentsForCampaign,
  getLearnings,
  getFeedbackSummary,
  formatAdjustmentsForDisplay,
  getWhatChanged,
  recordLearning
};
