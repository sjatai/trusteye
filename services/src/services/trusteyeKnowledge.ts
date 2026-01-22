/**
 * TrustEye Knowledge Indexer
 *
 * Indexes TrustEye's own capabilities, tools, workflows, and FAQs
 * so the AI can answer questions about what TrustEye can do.
 */

import fs from 'fs';
import path from 'path';
import { indexDocuments, BrandDocument } from './pinecone';
import { TOOLS_REGISTRY } from '../config/tools-registry';
import { CAMPAIGN_TEMPLATES } from '../config/templates';
import { getWhatChanged } from './feedbackLoop';

const TRUSTEYE_BRAND_ID = 'trusteye-system';

/**
 * Index all TrustEye knowledge
 */
export async function indexTrustEyeKnowledge(): Promise<boolean> {
  console.log('📚 Indexing TrustEye knowledge...');

  const documents: BrandDocument[] = [];

  // 1. Index tool definitions
  documents.push(...indexTools());

  // 2. Index campaign workflows
  documents.push(...indexWorkflows());

  // 3. Index 3-gate system
  documents.push(...index3GateSystem());

  // 4. Index feedback loop
  documents.push(...indexFeedbackLoop());

  // 5. Index FAQs
  documents.push(...indexFAQs());

  // 6. Index markdown docs from trusteye folder
  documents.push(...await indexTrustEyeDocs());

  // 7. Index campaign templates
  documents.push(...indexCampaignTemplates());

  console.log(`📚 Prepared ${documents.length} TrustEye knowledge documents`);

  return await indexDocuments(documents);
}

/**
 * Index all tools from the registry
 */
function indexTools(): BrandDocument[] {
  const docs: BrandDocument[] = [];

  // Create a summary document of all tools
  const toolsSummary = TOOLS_REGISTRY.map(t =>
    `- **${t.name}** (${t.category}): ${t.description}`
  ).join('\n');

  docs.push({
    id: `${TRUSTEYE_BRAND_ID}:tools:summary`,
    content: `# TrustEye Available Tools\n\nTrustEye has ${TOOLS_REGISTRY.length} tools available:\n\n${toolsSummary}\n\nTools requiring approval: ${TOOLS_REGISTRY.filter(t => t.requires_approval).map(t => t.name).join(', ')}`,
    metadata: {
      filename: 'tools-registry.ts',
      brandId: TRUSTEYE_BRAND_ID,
      type: 'general',
      section: 'Available Tools'
    }
  });

  // Index each tool individually for detailed queries
  for (const tool of TOOLS_REGISTRY) {
    const toolDoc = `## ${tool.name}

**Category:** ${tool.category}
**Description:** ${tool.description}
**Requires Approval:** ${tool.requires_approval ? 'Yes' : 'No'}

**Parameters:**
${tool.params.map(p => `- ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`).join('\n')}

**Example phrases:**
${tool.example_phrases.map(p => `- "${p}"`).join('\n')}`;

    docs.push({
      id: `${TRUSTEYE_BRAND_ID}:tools:${tool.id}`,
      content: toolDoc,
      metadata: {
        filename: 'tools-registry.ts',
        brandId: TRUSTEYE_BRAND_ID,
        type: 'general',
        section: `Tool: ${tool.name}`
      }
    });
  }

  return docs;
}

/**
 * Index the three main campaign workflows
 */
function indexWorkflows(): BrandDocument[] {
  const docs: BrandDocument[] = [];

  // Referral Campaign Workflow
  docs.push({
    id: `${TRUSTEYE_BRAND_ID}:workflow:referral`,
    content: `# Referral Campaign Workflow

**Trigger:** 5-star reviews from Birdeye

**How to create:** Say "Create a referral campaign from 5-star reviews"

**What TrustEye does:**
1. Identifies customers who left 5-star reviews in the last 24-48 hours
2. Creates personalized thank-you email in brand voice
3. Includes referral ask with reciprocal benefit ($100 for both parties)
4. Sends through 3-gate approval

**Best practices:**
- Send within 48 hours of the review for best response
- Focus on gratitude before the ask
- Offer reciprocal benefit (both referrer and referee get reward)

**Expected performance:**
- Open rate: 34.2%
- Best send time: Saturday 10 AM

**Example subject line:** "Thank you for the amazing review, {{customer_name}}!"`,
    metadata: {
      filename: 'workflows',
      brandId: TRUSTEYE_BRAND_ID,
      type: 'general',
      section: 'Referral Campaign Workflow'
    }
  });

  // Conquest Campaign Workflow
  docs.push({
    id: `${TRUSTEYE_BRAND_ID}:workflow:conquest`,
    content: `# Conquest Campaign Workflow

**Trigger:** Competitor weaknesses identified from competitive analysis

**How to create:** Say "Create a conquest campaign targeting Valley Honda" or "conquest campaign for competitor customers"

**What TrustEye does:**
1. Analyzes competitor reviews and identifies their weaknesses
2. Valley Honda weaknesses: slow service, hidden fees, poor communication
3. Creates targeted content highlighting Premier Nissan's strengths
4. Targets customers who may be unhappy with competitors

**Best practices:**
- Focus on our strengths, not attacking competitors
- Highlight specific differentiators (transparent pricing, fast service)
- Use comparison without direct negative mentions

**Expected performance:**
- Open rate: 24.8%
- Best for: customers researching alternatives

**Example subject line:** "Tired of waiting? We respect your time."`,
    metadata: {
      filename: 'workflows',
      brandId: TRUSTEYE_BRAND_ID,
      type: 'general',
      section: 'Conquest Campaign Workflow'
    }
  });

  // Recovery Campaign Workflow
  docs.push({
    id: `${TRUSTEYE_BRAND_ID}:workflow:recovery`,
    content: `# Recovery Campaign Workflow

**Trigger:** 1-2 star reviews from Birdeye

**How to create:** Say "Create a recovery campaign for negative reviews" or "win back unhappy customers"

**What TrustEye does:**
1. Monitors 1-2 star reviews in real-time
2. Creates immediate personalized recovery outreach
3. Routes for urgent human approval
4. Includes appropriate recovery offer

**Best practices:**
- Respond within 2 hours of negative review
- Personal outreach from manager increases resolution by 40%
- 20% discount is optimal for win-back (15% under-performs)
- Lead with "we're sorry" before offering discount

**Expected performance:**
- Open rate: 31.5%
- Reactivation rate: 14.2% with 20% discount

**Example subject line:** "We want to make this right, {{customer_name}}"`,
    metadata: {
      filename: 'workflows',
      brandId: TRUSTEYE_BRAND_ID,
      type: 'general',
      section: 'Recovery Campaign Workflow'
    }
  });

  return docs;
}

/**
 * Index the 3-gate approval system
 */
function index3GateSystem(): BrandDocument[] {
  const docs: BrandDocument[] = [];

  docs.push({
    id: `${TRUSTEYE_BRAND_ID}:3gate:overview`,
    content: `# 3-Gate Approval System

Every campaign in TrustEye goes through 3 gates before sending. This is the Trust Layer.

## Gate 1: Rules Engine (Automated)
- **Type:** Deterministic - Binary Pass/Fail
- **What it checks:**
  - CAN-SPAM compliance (physical address, unsubscribe link)
  - GDPR requirements (consent validation)
  - Required fields (subject, body, audience)
  - Profanity filter (blocks inappropriate language)
  - PII detection (no SSN, credit cards, passwords exposed)
  - Unsubscribe link present

## Gate 2: AI Review (Automated)
- **Type:** Probabilistic - Scored
- **What it checks:**
  - Brand Score (target: 85%+) - measures brand voice alignment
  - Toxicity Score (target: 0%) - detects harmful content
  - Copyright Risk (Low/Medium/High) - flags potential issues
  - Tone Alignment - matches brand personality
  - Competitor Mentions - flags if mentioning competitors

## Gate 3: Human Approval (Manual)
- **Type:** Non-delegable - Requires human click
- **What happens:**
  - Slack notification sent with campaign summary
  - Shows Gate 1 and Gate 2 results
  - Approve or Reject buttons
  - Records: who approved, when, interaction duration
  - AI cannot bypass this gate

## Why This Matters
"Jasper says 'trust us.' TrustEye says 'here's the proof.'"

Every gate generates audit data. When regulators ask "prove this was compliant" - you show the receipt.`,
    metadata: {
      filename: '3-gate-system',
      brandId: TRUSTEYE_BRAND_ID,
      type: 'general',
      section: '3-Gate Approval System'
    }
  });

  return docs;
}

/**
 * Index the feedback loop system
 */
function indexFeedbackLoop(): BrandDocument[] {
  const docs: BrandDocument[] = [];

  // Get actual adjustments for different campaign types
  const referralChanges = getWhatChanged('referral');
  const winbackChanges = getWhatChanged('winback');

  docs.push({
    id: `${TRUSTEYE_BRAND_ID}:feedback:overview`,
    content: `# Feedback Loop - "What Changed Since Last Time"

TrustEye learns from past campaign performance and shows you exactly what it changed.

## How It Works
When you create a campaign, TrustEye shows adjustments it made based on performance data:

**For Referral Campaigns:**
${referralChanges.adjustments.map(a => `- ${a.icon} ${a.text}\n  Reason: ${a.reason}`).join('\n')}

**For Win-Back Campaigns:**
${winbackChanges.adjustments.map(a => `- ${a.icon} ${a.text}\n  Reason: ${a.reason}`).join('\n')}

## What This Demonstrates
- **Memory**: System remembers past campaign results
- **Causality**: Understands WHY things worked or failed
- **Adaptation**: Automatically adjusts behavior based on learnings
- **Control**: User sees exactly what changed and why

## Data Sources
- Q3 Campaign Performance Report
- Real-time Analytics
- Historical A/B test results

This is the key differentiator. The AI isn't just generating content - it's learning and improving.`,
    metadata: {
      filename: 'feedback-loop',
      brandId: TRUSTEYE_BRAND_ID,
      type: 'general',
      section: 'Feedback Loop'
    }
  });

  return docs;
}

/**
 * Index FAQ answers
 */
function indexFAQs(): BrandDocument[] {
  const docs: BrandDocument[] = [];

  const faqs = [
    {
      q: 'What can TrustEye do?',
      a: `TrustEye can create three types of marketing campaigns from your real Birdeye data:

1. **Referral campaigns** from 5-star reviews - identify happy customers and ask for referrals
2. **Conquest campaigns** based on competitor weaknesses - target customers unhappy with competitors like Valley Honda
3. **Recovery campaigns** from negative reviews - immediately reach out to unhappy customers

All campaigns go through 3-gate approval (Rules, AI, Human) before sending. The system learns from past performance and shows you "what changed since last time."

Want me to create one of these campaigns?`
    },
    {
      q: 'How is TrustEye different from Jasper?',
      a: `Jasper has what they call a "Trust Foundation" - infrastructure underneath their tools. It's a promise.

TrustEye has a "Trust Layer" - verification that's visible, auditable, and defensible. It's evidence.

**Jasper says "trust us." TrustEye says "here's the proof."**

Every campaign in TrustEye generates a compliance receipt with:
- What rules were checked
- AI review scores
- Who approved it and when
- SHA-256 hash (tamper-proof)

When regulators ask "prove this campaign was compliant" - you hand them the receipt.`
    },
    {
      q: 'What integrations does TrustEye have?',
      a: `TrustEye integrates with:
- **Birdeye** - Customer reviews, contacts, competitor data
- **Slack** - Team notifications and approval workflow
- **Resend** - Email delivery
- **Late.dev** - Social media posting
- **Supabase** - Database for campaigns and receipts`
    },
    {
      q: 'What is the 3-gate approval system?',
      a: `Every campaign goes through 3 gates:

**Gate 1: Rules** - Automated checks for CAN-SPAM, GDPR, profanity, PII. Pass or Fail.

**Gate 2: AI Review** - Brand score, toxicity check, copyright risk. Probabilistic scoring.

**Gate 3: Human Approval** - Slack notification, real person must click Approve. AI cannot bypass this gate.

This creates an audit trail for every campaign.`
    },
    {
      q: 'Can AI approve campaigns by itself?',
      a: `No. Gate 3 (Human Approval) is non-delegable. The system verifies the click came from a real human by checking interaction duration, session verification, and identity. AI cannot bypass this gate. Every approval creates an audit trail showing who approved, when, and how long they reviewed it.`
    }
  ];

  for (const faq of faqs) {
    docs.push({
      id: `${TRUSTEYE_BRAND_ID}:faq:${faq.q.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}`,
      content: `## FAQ: ${faq.q}\n\n${faq.a}`,
      metadata: {
        filename: 'faq',
        brandId: TRUSTEYE_BRAND_ID,
        type: 'general',
        section: `FAQ: ${faq.q}`
      }
    });
  }

  return docs;
}

/**
 * Index TrustEye markdown docs from the trusteye folder
 */
async function indexTrustEyeDocs(): Promise<BrandDocument[]> {
  const docs: BrandDocument[] = [];
  const trusteyeDir = path.join(__dirname, '..', '..', '..', 'brand-knowledge', 'trusteye');

  if (!fs.existsSync(trusteyeDir)) {
    console.log('📁 TrustEye docs folder not found, skipping');
    return docs;
  }

  const files = fs.readdirSync(trusteyeDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(trusteyeDir, file), 'utf-8');

    // Split by sections (## headers)
    const sections = content.split(/^## /m).filter(s => s.trim());

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const firstLine = section.split('\n')[0].trim();
      const sectionName = firstLine.replace(/^#+ /, '');

      docs.push({
        id: `${TRUSTEYE_BRAND_ID}:doc:${file}:${i}`,
        content: i === 0 ? section : `## ${section}`,
        metadata: {
          filename: file,
          brandId: TRUSTEYE_BRAND_ID,
          type: 'general',
          section: sectionName
        }
      });
    }
  }

  console.log(`📄 Indexed ${docs.length} sections from TrustEye docs`);
  return docs;
}

/**
 * Index campaign templates
 */
function indexCampaignTemplates(): BrandDocument[] {
  const docs: BrandDocument[] = [];

  const templateSummary = CAMPAIGN_TEMPLATES.map(t =>
    `- **${t.name}** (${t.type}): ${t.expectedOpenRate}% open rate - ${t.targetAudience}`
  ).join('\n');

  docs.push({
    id: `${TRUSTEYE_BRAND_ID}:templates:summary`,
    content: `# Campaign Templates

TrustEye includes ${CAMPAIGN_TEMPLATES.length} pre-built campaign templates:

${templateSummary}

Each template:
- Written in Premier Nissan's brand voice
- Has predicted performance metrics
- Includes best practices
- Can be customized per customer`,
    metadata: {
      filename: 'templates',
      brandId: TRUSTEYE_BRAND_ID,
      type: 'general',
      section: 'Campaign Templates'
    }
  });

  return docs;
}

export default {
  indexTrustEyeKnowledge
};
