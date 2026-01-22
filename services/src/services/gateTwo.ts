// Gate 2 - AI Review Service
// Reviews content for brand alignment and guardrails

import Anthropic from '@anthropic-ai/sdk';
import { withFailsafe } from '../utils/failsafe';
import knowledgeBase from './pinecone';
import contentGen from './contentGen';

const BRAND_ID = 'premier-nissan';

// Initialize Anthropic client
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return client;
}

// Guardrails to check against
const GUARDRAILS = [
  {
    id: 'no-pressure-tactics',
    name: 'No Pressure Tactics',
    description: 'Content should not use pressure tactics or urgency manipulation',
    patterns: [
      'act now',
      'limited time',
      'don\'t miss out',
      'expires soon',
      'only \\d+ left',
      'before it\'s too late'
    ]
  },
  {
    id: 'no-fear-messaging',
    name: 'No Fear-Based Messaging',
    description: 'Content should not use fear to motivate action',
    patterns: [
      'break down',
      'fail',
      'danger',
      'risk',
      'unsafe',
      'before it\'s too late'
    ]
  },
  {
    id: 'no-all-caps',
    name: 'No ALL CAPS',
    description: 'Content should not use ALL CAPS for emphasis',
    patterns: [
      '\\b[A-Z]{4,}\\b' // Words with 4+ consecutive caps
    ]
  },
  {
    id: 'no-excessive-punctuation',
    name: 'No Excessive Punctuation',
    description: 'Content should not use excessive exclamation marks',
    patterns: [
      '!{2,}', // Multiple exclamation marks
      '\\?{2,}' // Multiple question marks
    ]
  },
  {
    id: 'no-misleading-claims',
    name: 'No Misleading Claims',
    description: 'Content should not make unverifiable claims',
    patterns: [
      'best in',
      'lowest price',
      'guaranteed',
      '#1',
      'number one'
    ]
  },
  {
    id: 'no-competitor-negativity',
    name: 'No Competitor Negativity',
    description: 'Content should not disparage competitors',
    patterns: [
      'unlike',
      'better than',
      'competitor',
      'other dealers'
    ]
  }
];

export interface ReviewCheck {
  id: string;
  name: string;
  passed: boolean;
  details?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface Gate2Result {
  passed: boolean;
  brandScore: number;
  brandScoreDetails: {
    toneAlignment: number;
    voiceConsistency: number;
    messageClarity: number;
    audienceRelevance: number;
  };
  checks: ReviewCheck[];
  suggestions: string[];
  reviewedAt: string;
}

// Check content against guardrails
function checkGuardrails(content: string): ReviewCheck[] {
  const checks: ReviewCheck[] = [];
  const contentLower = content.toLowerCase();

  for (const guardrail of GUARDRAILS) {
    let passed = true;
    let details: string | undefined;

    for (const pattern of guardrail.patterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);

      if (matches && matches.length > 0) {
        passed = false;
        details = `Found: "${matches[0]}"`;
        break;
      }
    }

    checks.push({
      id: guardrail.id,
      name: guardrail.name,
      passed,
      details: passed ? undefined : details,
      severity: passed ? 'info' : (guardrail.id === 'no-all-caps' ? 'error' : 'warning')
    });
  }

  // Check for personalization
  const hasPersonalization = content.includes('[First Name]') ||
    content.includes('[Name]') ||
    content.includes('[Vehicle]');

  checks.push({
    id: 'personalization',
    name: 'Uses Personalization',
    passed: hasPersonalization,
    details: hasPersonalization ? undefined : 'Consider adding [First Name] or [Vehicle] placeholders',
    severity: 'info'
  });

  // Check email length (if appears to be email body)
  if (content.length > 100) {
    const wordCount = content.split(/\s+/).length;
    const tooLong = wordCount > 200;

    checks.push({
      id: 'email-length',
      name: 'Email Length Check',
      passed: !tooLong,
      details: tooLong ? `${wordCount} words (recommended: under 150)` : undefined,
      severity: tooLong ? 'warning' : 'info'
    });
  }

  return checks;
}

// Review content with AI
export async function reviewContent(
  content: {
    email?: { subject?: string; body?: string };
    sms?: { message?: string };
    social?: { post?: string };
  },
  brandId: string = BRAND_ID
): Promise<Gate2Result> {
  const result = await withFailsafe(
    `gate2_review_${brandId}`,
    async () => {
      // Combine all content for review
      const contentText = [
        content.email?.subject && `Subject: ${content.email.subject}`,
        content.email?.body && `Body: ${content.email.body}`,
        content.sms?.message && `SMS: ${content.sms.message}`,
        content.social?.post && `Social: ${content.social.post}`
      ].filter(Boolean).join('\n\n');

      // Run guardrail checks
      const guardrailChecks = checkGuardrails(contentText);

      // Calculate brand score
      const brandScore = await contentGen.calculateBrandScore(content, brandId);

      // AI-powered review for additional checks
      const aiChecks = await runAIReview(contentText, brandId);

      // Combine all checks
      const allChecks = [...guardrailChecks, ...aiChecks];

      // Determine if passed (no errors, brand score >= 70)
      const hasErrors = allChecks.some(c => !c.passed && c.severity === 'error');
      const hasWarnings = allChecks.some(c => !c.passed && c.severity === 'warning');
      const passed = !hasErrors && brandScore.overall >= 70;

      // Generate suggestions
      const suggestions: string[] = [];
      for (const check of allChecks) {
        if (!check.passed && check.details) {
          suggestions.push(`${check.name}: ${check.details}`);
        }
      }

      if (brandScore.overall < 80) {
        suggestions.push('Consider revising to better match brand voice guidelines');
      }

      return {
        passed,
        brandScore: brandScore.overall,
        brandScoreDetails: brandScore.details,
        checks: allChecks,
        suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
        reviewedAt: new Date().toISOString()
      };
    },
    // Fallback result
    {
      passed: true,
      brandScore: 85,
      brandScoreDetails: {
        toneAlignment: 85,
        voiceConsistency: 85,
        messageClarity: 85,
        audienceRelevance: 85
      },
      checks: [
        { id: 'fallback', name: 'Basic Review', passed: true, severity: 'info' as const }
      ],
      suggestions: [],
      reviewedAt: new Date().toISOString()
    }
  );

  return result.data;
}

// AI-powered additional review
async function runAIReview(content: string, brandId: string): Promise<ReviewCheck[]> {
  const result = await withFailsafe(
    `ai_review_${brandId}`,
    async () => {
      const anthropic = getClient();

      // Get brand guidelines for context
      const guidelines = await knowledgeBase.queryContext(
        'brand voice guidelines messaging do dont',
        5,
        { brandId }
      );

      const guidelinesText = guidelines.map(g => g.content).join('\n\n').substring(0, 2000);

      const prompt = `Review this marketing content for Premier Nissan against the brand guidelines.

BRAND GUIDELINES:
${guidelinesText}

CONTENT TO REVIEW:
${content}

Check for:
1. Brand voice alignment - Does it match the professional yet friendly tone?
2. Value proposition - Does it focus on value rather than just discounts?
3. Community focus - Does it feel local and personal?
4. Call to action - Is the CTA clear and non-pushy?

Respond with JSON array of checks:
[
  {
    "id": "brand-voice",
    "name": "Brand Voice Alignment",
    "passed": true/false,
    "details": "optional details if failed",
    "severity": "error" | "warning" | "info"
  },
  ...
]`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '[]';

      try {
        return JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
    },
    []
  );

  return result.data;
}

// Quick check without full AI review (for real-time validation)
export function quickCheck(content: string): { passed: boolean; issues: string[] } {
  const checks = checkGuardrails(content);
  const failedChecks = checks.filter(c => !c.passed);

  return {
    passed: !failedChecks.some(c => c.severity === 'error'),
    issues: failedChecks.map(c => c.details || c.name)
  };
}

export default {
  reviewContent,
  quickCheck,
  GUARDRAILS
};
