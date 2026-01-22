/**
 * Recommendations Engine
 * Uses brand knowledge and marketing data to recommend campaigns
 * and predict outcomes based on historical performance
 */

import { CAMPAIGN_TEMPLATES, CampaignTemplate } from '../config/templates';
import { getWhatChanged, getAdjustmentsForCampaign } from './feedbackLoop';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  segment: 'vip' | 'regular' | 'lapsed' | 'new';
  lastReviewRating?: number;
  lastActivityDays: number;
  totalPurchases: number;
  lifetimeValue: number;
  vehicle?: string;
  location?: 'downtown' | 'riverside' | 'valley';
}

export interface CampaignRecommendation {
  templateId: string;
  templateName: string;
  type: string;
  score: number; // 0-100, higher is better match
  reason: string;
  predictedOutcomes: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
    estimatedRevenue: number;
    roi: number;
  };
  bestPractices: string[];
  warnings?: string[];
  adjustmentsMade?: {
    icon: string;
    text: string;
    reason: string;
  }[];
}

export interface MarketingInsights {
  optimalSendTime: string;
  optimalDiscount: string;
  channelRecommendation: string;
  audienceSize: number;
  competitorActivity?: string;
}

// Historical performance data from Q3 report
const HISTORICAL_PERFORMANCE = {
  segments: {
    vip: { openRate: 34.2, clickRate: 6.8, conversionRate: 12.4 },
    regular: { openRate: 28.1, clickRate: 4.2, conversionRate: 7.2 },
    lapsed: { openRate: 22.4, clickRate: 3.1, conversionRate: 4.8 },
    new: { openRate: 31.5, clickRate: 5.4, conversionRate: 8.9 }
  },
  locations: {
    downtown: { multiplier: 1.1, avgRevenue: 485 },
    riverside: { multiplier: 0.85, avgRevenue: 412 },
    valley: { multiplier: 1.05, avgRevenue: 467 }
  },
  discounts: {
    '10%': { conversionMultiplier: 1.0, marginImpact: -8 },
    '15%': { conversionMultiplier: 1.45, marginImpact: -12 },
    '20%': { conversionMultiplier: 1.62, marginImpact: -17 },
    '25%': { conversionMultiplier: 1.71, marginImpact: -22 }
  },
  sendTimes: {
    'tuesday_10am': { openRateBoost: 1.08 },
    'saturday_10am': { openRateBoost: 1.18 },
    'thursday_2pm': { openRateBoost: 0.92 }
  },
  subjectLineFactors: {
    emoji: 1.18,
    personalization: 1.15,
    question: 1.07
  }
};

// Get recommendations for a customer
export function getRecommendationsForCustomer(
  customer: CustomerProfile,
  limit: number = 3
): CampaignRecommendation[] {
  const recommendations: CampaignRecommendation[] = [];

  for (const template of CAMPAIGN_TEMPLATES) {
    const score = calculateMatchScore(template, customer);
    const predictions = predictOutcomes(template, customer);
    const bestPractices = getBestPractices(template, customer);
    const warnings = getWarnings(template, customer);

    // Get "What changed since last time" for this campaign type
    const whatChanged = getWhatChanged(template.type);

    recommendations.push({
      templateId: template.id,
      templateName: template.name,
      type: template.type,
      score,
      reason: generateReason(template, customer, score),
      predictedOutcomes: predictions,
      bestPractices,
      warnings: warnings.length > 0 ? warnings : undefined,
      adjustmentsMade: whatChanged.adjustments
    });
  }

  // Sort by score and return top recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Calculate how well a template matches a customer
function calculateMatchScore(template: CampaignTemplate, customer: CustomerProfile): number {
  let score = 50; // Base score

  // Segment matching
  if (template.type === 'loyalty' && customer.segment === 'vip') score += 30;
  if (template.type === 'winback' && customer.segment === 'lapsed') score += 35;
  if (template.type === 'welcome' && customer.segment === 'new') score += 40;
  if (template.type === 'referral' && customer.lastReviewRating === 5) score += 35;
  if (template.type === 'recovery' && customer.lastReviewRating && customer.lastReviewRating <= 2) score += 40;

  // Activity-based adjustments
  if (template.type === 'winback' && customer.lastActivityDays > 90) score += 15;
  if (template.type === 'service' && customer.lastActivityDays > 60 && customer.lastActivityDays < 120) score += 20;

  // LTV-based adjustments
  if (customer.lifetimeValue > 2000 && template.type === 'loyalty') score += 10;
  if (customer.lifetimeValue < 500 && template.type === 'conquest') score += 10;

  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

// Predict outcomes based on historical data
function predictOutcomes(
  template: CampaignTemplate,
  customer: CustomerProfile
): CampaignRecommendation['predictedOutcomes'] {
  const segmentData = HISTORICAL_PERFORMANCE.segments[customer.segment];
  const locationData = HISTORICAL_PERFORMANCE.locations[customer.location || 'downtown'];

  // Calculate base rates
  let openRate = segmentData.openRate;
  let clickRate = segmentData.clickRate;
  let conversionRate = segmentData.conversionRate;

  // Apply template-specific expected rates (weighted average)
  openRate = (openRate * 0.6) + (template.expectedOpenRate * 0.4);
  clickRate = (clickRate * 0.6) + (template.expectedClickRate * 0.4);

  // Apply location multiplier
  openRate *= locationData.multiplier;
  clickRate *= locationData.multiplier;
  conversionRate *= locationData.multiplier;

  // Apply subject line factors (templates use personalization + often emoji)
  openRate *= HISTORICAL_PERFORMANCE.subjectLineFactors.personalization;
  if (template.subject.includes('!') || template.subject.includes('?')) {
    openRate *= HISTORICAL_PERFORMANCE.subjectLineFactors.question;
  }

  // Estimate revenue
  const estimatedRevenue = locationData.avgRevenue * (conversionRate / 100);

  // Calculate ROI (assuming $0.50 per email cost)
  const campaignCost = 0.50;
  const roi = ((estimatedRevenue - campaignCost) / campaignCost) * 100;

  return {
    openRate: Math.round(openRate * 10) / 10,
    clickRate: Math.round(clickRate * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
    estimatedRevenue: Math.round(estimatedRevenue),
    roi: Math.round(roi)
  };
}

// Generate best practices based on brand knowledge and Q3 learnings
function getBestPractices(template: CampaignTemplate, customer: CustomerProfile): string[] {
  const practices: string[] = [];

  // Universal best practices from brand guidelines
  practices.push('Keep email under 150 words for 15% higher engagement');
  practices.push(`Optimal send time: ${template.bestSendTime}`);

  // Segment-specific practices
  if (customer.segment === 'vip') {
    practices.push('Focus on perks and recognition, not just discounts');
    practices.push('Use personal, warm tone - they\'re part of the family');
  }
  if (customer.segment === 'lapsed') {
    practices.push('Lead with "we miss you" messaging - performs better than discount-first');
    practices.push('20% discount is optimal for win-back (15% under-performs)');
  }
  if (customer.segment === 'new') {
    practices.push('Critical retention window - personalize heavily');
    practices.push('Follow up with welcome series (3 emails over 2 weeks)');
  }

  // Type-specific practices
  if (template.type === 'referral') {
    practices.push('Ask within 48 hours of positive review for best response');
    practices.push('Offer reciprocal benefit ($100 for both parties)');
  }
  if (template.type === 'recovery') {
    practices.push('Respond within 2 hours of negative review');
    practices.push('Personal outreach from manager increases resolution by 40%');
  }

  // Location-specific
  if (customer.location === 'riverside') {
    practices.push('Note: Riverside location has lower engagement - consider service improvements before heavy marketing');
  }

  return practices.slice(0, 5);
}

// Generate warnings
function getWarnings(template: CampaignTemplate, customer: CustomerProfile): string[] {
  const warnings: string[] = [];

  if (customer.location === 'riverside' && template.type !== 'recovery') {
    warnings.push('Riverside location has 17% lower engagement - review service quality first');
  }

  if (template.type === 'winback' && customer.lastActivityDays < 60) {
    warnings.push('Customer may not be truly lapsed - activity within 60 days');
  }

  if (template.type === 'referral' && (!customer.lastReviewRating || customer.lastReviewRating < 4)) {
    warnings.push('No recent positive review - referral ask may be premature');
  }

  return warnings;
}

// Generate human-readable reason for recommendation
function generateReason(template: CampaignTemplate, customer: CustomerProfile, score: number): string {
  if (score >= 85) {
    if (template.type === 'referral' && customer.lastReviewRating === 5) {
      return `${customer.name} left a 5-star review - perfect time to ask for referrals`;
    }
    if (template.type === 'winback' && customer.segment === 'lapsed') {
      return `${customer.name} hasn't visited in ${customer.lastActivityDays} days - win-back campaign recommended`;
    }
    if (template.type === 'welcome' && customer.segment === 'new') {
      return `${customer.name} is a new customer - welcome series will boost retention`;
    }
    if (template.type === 'loyalty' && customer.segment === 'vip') {
      return `${customer.name} is a VIP customer - loyalty recognition will strengthen relationship`;
    }
  }

  if (score >= 70) {
    return `Good match for ${customer.segment} segment with ${template.type} campaign`;
  }

  return `Consider ${template.type} campaign based on customer profile`;
}

// Get marketing insights for campaign planning
export function getMarketingInsights(
  audienceSegment: string,
  campaignType: string
): MarketingInsights {
  return {
    optimalSendTime: 'Saturday 10:00 AM (18% higher open rate) or Tuesday 10:00 AM',
    optimalDiscount: campaignType === 'winback' ? '20% (best ROI for lapsed customers)' : '15% (best margin vs conversion)',
    channelRecommendation: 'Email primary (78% preference), SMS for time-sensitive only',
    audienceSize: Math.floor(Math.random() * 2000) + 500,
    competitorActivity: 'Valley Honda running 25% off service - consider differentiation over price matching'
  };
}

// Analyze a campaign concept and provide predictions
export function analyzeCampaignConcept(concept: {
  type: string;
  targetSegment: string;
  discount?: string;
  sendTime?: string;
}): {
  viability: 'high' | 'medium' | 'low';
  predictedOpenRate: number;
  predictedClickRate: number;
  predictedRevenue: number;
  suggestions: string[];
} {
  const segmentData = HISTORICAL_PERFORMANCE.segments[concept.targetSegment as keyof typeof HISTORICAL_PERFORMANCE.segments]
    || HISTORICAL_PERFORMANCE.segments.regular;

  let openRate = segmentData.openRate;
  let clickRate = segmentData.clickRate;

  // Apply discount impact
  if (concept.discount) {
    const discountData = HISTORICAL_PERFORMANCE.discounts[concept.discount as keyof typeof HISTORICAL_PERFORMANCE.discounts];
    if (discountData) {
      clickRate *= discountData.conversionMultiplier;
    }
  }

  // Apply send time impact
  if (concept.sendTime === 'saturday_10am') {
    openRate *= HISTORICAL_PERFORMANCE.sendTimes.saturday_10am.openRateBoost;
  } else if (concept.sendTime === 'tuesday_10am') {
    openRate *= HISTORICAL_PERFORMANCE.sendTimes.tuesday_10am.openRateBoost;
  }

  const suggestions: string[] = [];

  if (!concept.sendTime || concept.sendTime === 'thursday_2pm') {
    suggestions.push('Consider Saturday 10 AM send time for 18% higher open rate');
  }

  if (concept.discount === '25%') {
    suggestions.push('25% discount has diminishing returns - 15-20% typically optimal');
  }

  if (concept.targetSegment === 'lapsed' && !concept.discount) {
    suggestions.push('Lapsed customers respond well to 20% discount');
  }

  let viability: 'high' | 'medium' | 'low' = 'medium';
  if (openRate > 30 && clickRate > 5) viability = 'high';
  if (openRate < 20 || clickRate < 3) viability = 'low';

  return {
    viability,
    predictedOpenRate: Math.round(openRate * 10) / 10,
    predictedClickRate: Math.round(clickRate * 10) / 10,
    predictedRevenue: Math.round(450 * (clickRate / 100) * 100) / 100,
    suggestions
  };
}

export default {
  getRecommendationsForCustomer,
  getMarketingInsights,
  analyzeCampaignConcept
};
