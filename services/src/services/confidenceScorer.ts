// Confidence Scorer Service
// Scores the confidence of parsed intents

import { ParsedIntent } from './intentParser';

export interface ConfidenceResult {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low' | 'very_low';
  recommendation: 'proceed' | 'clarify' | 'reject';
  breakdown: {
    component: string;
    score: number;
    reason: string;
  }[];
  missingComponents: string[];
  suggestedQuestions: string[];
}

// Thresholds
const THRESHOLDS = {
  proceed: 60,    // >= 60: proceed automatically
  clarify: 40,    // 40-59: ask clarification
  reject: 0       // < 40: reject / unclear
};

// Component weights
const WEIGHTS = {
  action: 30,
  channel: 20,
  campaignType: 20,
  audience: 20,
  schedule: 10
};

// Score individual components
function scoreAction(intent: ParsedIntent): { score: number; reason: string } {
  if (intent.action && intent.action !== 'unknown') {
    if (intent.actionCategory && intent.actionCategory !== 'unknown') {
      return { score: 100, reason: 'Clear action identified' };
    }
    return { score: 80, reason: 'Action found but category unclear' };
  }
  return { score: 0, reason: 'No action identified' };
}

function scoreChannel(intent: ParsedIntent): { score: number; reason: string } {
  if (intent.channel) {
    // Check if channel is valid
    const validChannels = ['email', 'sms', 'slack', 'social', 'demo-site'];
    if (validChannels.includes(intent.channel)) {
      return { score: 100, reason: `Channel "${intent.channel}" identified` };
    }
    return { score: 70, reason: 'Channel identified but may be invalid' };
  }

  // Some actions don't need a channel
  const noChannelActions = ['analyze', 'get', 'approve', 'reject'];
  if (noChannelActions.includes(intent.actionCategory)) {
    return { score: 100, reason: 'Action does not require channel' };
  }

  return { score: 0, reason: 'No channel specified' };
}

function scoreCampaignType(intent: ParsedIntent): { score: number; reason: string } {
  if (intent.campaignType) {
    const validTypes = [
      'win-back', 'loyalty', 'promotional', 'referral', 'review',
      'product-launch', 'event', 'nurture', 'seasonal', 'service-reminder'
    ];
    if (validTypes.includes(intent.campaignType)) {
      return { score: 100, reason: `Campaign type "${intent.campaignType}" identified` };
    }
    return { score: 70, reason: 'Campaign type identified but may be invalid' };
  }

  // Some actions don't need campaign type
  const noCampaignTypeActions = ['analyze', 'get', 'show', 'approve', 'reject'];
  if (noCampaignTypeActions.includes(intent.actionCategory)) {
    return { score: 100, reason: 'Action does not require campaign type' };
  }

  return { score: 0, reason: 'No campaign type specified' };
}

function scoreAudience(intent: ParsedIntent): { score: number; reason: string } {
  if (intent.audience) {
    return { score: 100, reason: `Audience "${intent.audience}" identified` };
  }

  // Some actions don't need audience
  const noAudienceActions = ['analyze', 'get', 'show', 'approve', 'reject'];
  if (noAudienceActions.includes(intent.actionCategory)) {
    return { score: 100, reason: 'Action does not require audience' };
  }

  // Implicit audience for some campaign types
  if (intent.campaignType === 'win-back') {
    return { score: 60, reason: 'Win-back implies inactive customers (implicit)' };
  }
  if (intent.campaignType === 'loyalty') {
    return { score: 60, reason: 'Loyalty implies loyal customers (implicit)' };
  }

  return { score: 0, reason: 'No audience specified' };
}

function scoreSchedule(intent: ParsedIntent): { score: number; reason: string } {
  if (intent.schedule) {
    if (intent.schedule.type === 'scheduled' && intent.schedule.datetime) {
      return { score: 100, reason: `Scheduled for ${intent.schedule.datetime}` };
    }
    if (intent.schedule.type === 'immediate') {
      return { score: 100, reason: 'Immediate execution requested' };
    }
  }
  // Default to immediate if not specified
  return { score: 80, reason: 'No schedule specified (defaulting to immediate)' };
}

// Main scoring function
export function calculateConfidence(intent: ParsedIntent): ConfidenceResult {
  const breakdown: ConfidenceResult['breakdown'] = [];
  const missingComponents: string[] = [];
  const suggestedQuestions: string[] = [];

  // Score each component
  const actionScore = scoreAction(intent);
  breakdown.push({ component: 'action', score: actionScore.score, reason: actionScore.reason });
  if (actionScore.score === 0) {
    missingComponents.push('action');
    suggestedQuestions.push('What would you like me to do? (create, send, show, analyze, etc.)');
  }

  const channelScore = scoreChannel(intent);
  breakdown.push({ component: 'channel', score: channelScore.score, reason: channelScore.reason });
  if (channelScore.score === 0) {
    missingComponents.push('channel');
    suggestedQuestions.push('Which channel should I use? (email, SMS, social media, or website)');
  }

  const campaignTypeScore = scoreCampaignType(intent);
  breakdown.push({ component: 'campaignType', score: campaignTypeScore.score, reason: campaignTypeScore.reason });
  if (campaignTypeScore.score === 0 && !['analyze', 'get', 'show'].includes(intent.actionCategory)) {
    missingComponents.push('campaignType');
    suggestedQuestions.push('What type of campaign is this? (win-back, loyalty, promotional, etc.)');
  }

  const audienceScore = scoreAudience(intent);
  breakdown.push({ component: 'audience', score: audienceScore.score, reason: audienceScore.reason });
  if (audienceScore.score === 0 && !['analyze', 'get', 'show'].includes(intent.actionCategory)) {
    missingComponents.push('audience');
    suggestedQuestions.push('Who is the target audience?');
  }

  const scheduleScore = scoreSchedule(intent);
  breakdown.push({ component: 'schedule', score: scheduleScore.score, reason: scheduleScore.reason });

  // Calculate weighted score
  const weightedScore = (
    (actionScore.score * WEIGHTS.action) +
    (channelScore.score * WEIGHTS.channel) +
    (campaignTypeScore.score * WEIGHTS.campaignType) +
    (audienceScore.score * WEIGHTS.audience) +
    (scheduleScore.score * WEIGHTS.schedule)
  ) / 100;

  // Determine level
  let level: ConfidenceResult['level'];
  if (weightedScore >= 80) level = 'high';
  else if (weightedScore >= 60) level = 'medium';
  else if (weightedScore >= 40) level = 'low';
  else level = 'very_low';

  // Determine recommendation
  let recommendation: ConfidenceResult['recommendation'];
  if (weightedScore >= THRESHOLDS.proceed) {
    recommendation = 'proceed';
  } else if (weightedScore >= THRESHOLDS.clarify) {
    recommendation = 'clarify';
  } else {
    recommendation = 'reject';
  }

  return {
    score: Math.round(weightedScore),
    level,
    recommendation,
    breakdown,
    missingComponents,
    suggestedQuestions: suggestedQuestions.slice(0, 3) // Max 3 questions
  };
}

// Quick check for minimum viability
export function isViable(intent: ParsedIntent): boolean {
  // Must have at least an action
  if (!intent.action || intent.action === 'unknown') return false;

  const confidence = calculateConfidence(intent);
  return confidence.score >= THRESHOLDS.clarify;
}

// Get the single most important missing piece
export function getMostImportantMissing(intent: ParsedIntent): string | null {
  const confidence = calculateConfidence(intent);

  if (confidence.missingComponents.includes('action')) {
    return 'action';
  }
  if (['send', 'create'].includes(intent.actionCategory)) {
    if (confidence.missingComponents.includes('channel')) return 'channel';
    if (confidence.missingComponents.includes('audience')) return 'audience';
  }

  return confidence.missingComponents[0] || null;
}

// Format confidence for display
export function formatConfidenceForUser(confidence: ConfidenceResult): string {
  const emoji = confidence.level === 'high' ? '🟢' :
                confidence.level === 'medium' ? '🟡' :
                confidence.level === 'low' ? '🟠' : '🔴';

  let message = `${emoji} Confidence: ${confidence.score}% (${confidence.level})`;

  if (confidence.recommendation === 'clarify' && confidence.suggestedQuestions.length > 0) {
    message += `\n\nI need a bit more info:\n${confidence.suggestedQuestions.map(q => `• ${q}`).join('\n')}`;
  } else if (confidence.recommendation === 'reject') {
    message += `\n\nI'm not quite sure what you're asking. Could you rephrase that?`;
  }

  return message;
}

export default {
  calculateConfidence,
  isViable,
  getMostImportantMissing,
  formatConfidenceForUser,
  THRESHOLDS
};
