// Intent Parser Service
// Parses natural language into structured marketing intents

import { withFailsafe } from '../utils/failsafe';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load knowledge files
const knowledgePath = path.join(__dirname, '../knowledge');

interface KnowledgeBase {
  campaignTypes: any[];
  channels: any[];
  acronyms: any[];
  audienceSegments: any[];
  timeModifiers: any[];
  actionCategories: any[];
  compoundPatterns: any[];
  learnedPatterns: any[];
}

let knowledge: KnowledgeBase | null = null;

function loadKnowledge(): KnowledgeBase {
  if (knowledge) return knowledge;

  try {
    const campaignTypes = JSON.parse(
      fs.readFileSync(path.join(knowledgePath, 'terms/campaign_types.json'), 'utf-8')
    );
    const channels = JSON.parse(
      fs.readFileSync(path.join(knowledgePath, 'terms/channels.json'), 'utf-8')
    );
    const acronyms = JSON.parse(
      fs.readFileSync(path.join(knowledgePath, 'terms/acronyms.json'), 'utf-8')
    );
    const audienceTerms = JSON.parse(
      fs.readFileSync(path.join(knowledgePath, 'terms/audience_terms.json'), 'utf-8')
    );
    const actionVerbs = JSON.parse(
      fs.readFileSync(path.join(knowledgePath, 'intents/action_verbs.json'), 'utf-8')
    );
    const learnedPatterns = JSON.parse(
      fs.readFileSync(path.join(knowledgePath, 'learned/patterns.json'), 'utf-8')
    );

    knowledge = {
      campaignTypes: campaignTypes.campaign_types,
      channels: channels.channels,
      acronyms: acronyms.acronyms,
      audienceSegments: audienceTerms.audience_segments,
      timeModifiers: audienceTerms.time_modifiers,
      actionCategories: actionVerbs.action_categories,
      compoundPatterns: actionVerbs.compound_patterns,
      learnedPatterns: learnedPatterns.learned_patterns || []
    };
  } catch (err) {
    // Fallback if files not found
    knowledge = {
      campaignTypes: [],
      channels: [],
      acronyms: [],
      audienceSegments: [],
      timeModifiers: [],
      actionCategories: [],
      compoundPatterns: [],
      learnedPatterns: []
    };
  }

  return knowledge;
}

// Parsed intent structure
export interface ParsedIntent {
  action: string;
  actionCategory: string;
  channel?: string;
  campaignType?: string;
  audience?: string;
  audienceSize?: number;
  schedule?: {
    type: 'immediate' | 'scheduled';
    datetime?: string;
  };
  content?: {
    subject?: string;
    message?: string;
  };
  rawInput: string;
  extractedEntities: {
    type: string;
    value: string;
    confidence: number;
  }[];
  parseMethod: 'pattern' | 'learned' | 'ai' | 'hybrid';
}

// Initialize Claude client lazily
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

// Extract action from text
function extractAction(text: string): { action: string; category: string } | null {
  const kb = loadKnowledge();
  const textLower = text.toLowerCase();

  // Collect all verbs with their categories, then sort by length descending
  // This ensures we match longer phrases like "push a notification" before "push"
  const allVerbs: { verb: string; category: string }[] = [];
  for (const category of kb.actionCategories) {
    for (const verb of category.verbs) {
      allVerbs.push({ verb, category: category.category });
    }
  }

  // Sort by verb length descending to match longer phrases first
  allVerbs.sort((a, b) => b.verb.length - a.verb.length);

  for (const { verb, category } of allVerbs) {
    if (textLower.includes(verb)) {
      return {
        action: verb,
        category
      };
    }
  }

  return null;
}

// Extract channel from text
function extractChannel(text: string): string | null {
  const kb = loadKnowledge();
  const textLower = text.toLowerCase();

  for (const channel of kb.channels) {
    if (textLower.includes(channel.id)) return channel.id;
    for (const alias of channel.aliases) {
      if (textLower.includes(alias)) return channel.id;
    }
  }

  return null;
}

// Extract campaign type from text
function extractCampaignType(text: string): string | null {
  const kb = loadKnowledge();
  const textLower = text.toLowerCase();

  for (const type of kb.campaignTypes) {
    if (textLower.includes(type.id)) return type.id;
    for (const alias of type.aliases) {
      if (textLower.includes(alias)) return type.id;
    }
  }

  return null;
}

// Extract audience from text
function extractAudience(text: string): string | null {
  const kb = loadKnowledge();
  const textLower = text.toLowerCase();

  for (const segment of kb.audienceSegments) {
    if (textLower.includes(segment.id.replace('_', ' '))) return segment.id;
    for (const alias of segment.aliases) {
      if (textLower.includes(alias)) return segment.id;
    }
  }

  return null;
}

// Extract time modifier from text
function extractTimeModifier(text: string): number | null {
  const kb = loadKnowledge();
  const textLower = text.toLowerCase();

  for (const modifier of kb.timeModifiers) {
    if (textLower.includes(modifier.term)) return modifier.days;
    for (const alias of modifier.aliases) {
      if (textLower.includes(alias)) return modifier.days;
    }
  }

  // Try to extract number of days directly
  const daysMatch = text.match(/(\d+)\s*(days?|d)/i);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10);
  }

  return null;
}

// Check for learned patterns
function checkLearnedPatterns(text: string): Partial<ParsedIntent> | null {
  const kb = loadKnowledge();
  const textLower = text.toLowerCase();

  for (const pattern of kb.learnedPatterns) {
    if (textLower.includes(pattern.input.toLowerCase())) {
      return {
        action: pattern.output.action,
        actionCategory: pattern.output.actionCategory,
        channel: pattern.output.channel,
        campaignType: pattern.output.campaignType,
        audience: pattern.output.audience,
        parseMethod: 'learned'
      };
    }
  }

  return null;
}

// Pattern-based parsing
function parseWithPatterns(text: string): Partial<ParsedIntent> {
  const action = extractAction(text);
  const channel = extractChannel(text);
  const campaignType = extractCampaignType(text);
  const audience = extractAudience(text);
  const timeModifier = extractTimeModifier(text);

  const extractedEntities: ParsedIntent['extractedEntities'] = [];

  if (action) {
    extractedEntities.push({ type: 'action', value: action.action, confidence: 90 });
  }
  if (channel) {
    extractedEntities.push({ type: 'channel', value: channel, confidence: 90 });
  }
  if (campaignType) {
    extractedEntities.push({ type: 'campaignType', value: campaignType, confidence: 85 });
  }
  if (audience) {
    extractedEntities.push({ type: 'audience', value: audience, confidence: 85 });
  }

  return {
    action: action?.action || 'unknown',
    actionCategory: action?.category || 'unknown',
    channel: channel || undefined,
    campaignType: campaignType || undefined,
    audience: audience || undefined,
    extractedEntities,
    parseMethod: 'pattern'
  };
}

// AI-based parsing for ambiguous inputs
async function parseWithAI(text: string): Promise<Partial<ParsedIntent>> {
  const kb = loadKnowledge();

  const result = await withFailsafe(
    `intent_parse_ai_${text.substring(0, 30)}`,
    async () => {
      const anthropic = getClient();

      const prompt = `Parse this marketing request into structured components.

INPUT: "${text}"

AVAILABLE OPTIONS:
- Campaign Types: ${kb.campaignTypes.map(t => t.id).join(', ')}
- Channels: ${kb.channels.map(c => c.id).join(', ')}
- Audience Segments: ${kb.audienceSegments.map(a => a.id).join(', ')}
- Actions: create, send, show, analyze, generate, schedule, get, update, stop

Return JSON only:
{
  "action": "the verb/action",
  "actionCategory": "create|send|show|analyze|generate|schedule|get|update|stop",
  "channel": "email|sms|slack|social|demo-site|null",
  "campaignType": "campaign type id or null",
  "audience": "audience segment id or null",
  "schedule": { "type": "immediate|scheduled", "datetime": "ISO string or null" }
}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const responseText = textContent?.text || '{}';

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        return {};
      }
    },
    {}
  );

  return {
    ...result.data,
    parseMethod: 'ai' as const
  };
}

// Main parse function
export async function parseIntent(text: string): Promise<ParsedIntent> {
  const textLower = text.toLowerCase().trim();

  // 1. Check learned patterns first
  const learned = checkLearnedPatterns(textLower);
  if (learned && learned.action !== 'unknown') {
    return {
      ...learned,
      rawInput: text,
      extractedEntities: [],
      parseMethod: 'learned'
    } as ParsedIntent;
  }

  // 2. Try pattern matching
  const patternResult = parseWithPatterns(textLower);

  // If we got a clear action and at least one other entity, use pattern result
  const hasGoodMatch = patternResult.action !== 'unknown' &&
    (patternResult.channel || patternResult.campaignType || patternResult.audience);

  if (hasGoodMatch) {
    return {
      ...patternResult,
      rawInput: text,
      schedule: { type: 'immediate' }
    } as ParsedIntent;
  }

  // 3. Fall back to AI for ambiguous inputs
  const aiResult = await parseWithAI(text);

  // Merge pattern and AI results (prefer pattern matches)
  const patternAction = patternResult.action || 'unknown';
  const patternCategory = patternResult.actionCategory || 'unknown';

  const mergedResult: ParsedIntent = {
    action: patternAction !== 'unknown' ? patternAction : (aiResult.action || 'unknown'),
    actionCategory: patternCategory !== 'unknown' ? patternCategory : (aiResult.actionCategory || 'unknown'),
    channel: patternResult.channel || aiResult.channel,
    campaignType: patternResult.campaignType || aiResult.campaignType,
    audience: patternResult.audience || aiResult.audience,
    schedule: aiResult.schedule || { type: 'immediate' },
    rawInput: text,
    extractedEntities: patternResult.extractedEntities || [],
    parseMethod: 'hybrid'
  };

  return mergedResult;
}

// Quick parse (pattern only, no AI)
export function quickParse(text: string): Partial<ParsedIntent> {
  const learned = checkLearnedPatterns(text.toLowerCase());
  if (learned) return learned;

  return parseWithPatterns(text.toLowerCase());
}

// Get suggested clarification questions
export function getSuggestedClarifications(parsedIntent: ParsedIntent): string[] {
  const questions: string[] = [];

  if (!parsedIntent.channel && parsedIntent.actionCategory === 'send') {
    questions.push('Which channel would you like to use? (email, SMS, or social media)');
  }

  if (!parsedIntent.audience && ['send', 'create'].includes(parsedIntent.actionCategory)) {
    questions.push('Who is the target audience for this campaign?');
  }

  if (!parsedIntent.campaignType && parsedIntent.actionCategory === 'create') {
    questions.push('What type of campaign is this? (win-back, loyalty, promotional, etc.)');
  }

  return questions;
}

// Get inferred defaults based on campaign type
export function applyDefaults(parsedIntent: ParsedIntent): ParsedIntent {
  const kb = loadKnowledge();

  if (parsedIntent.campaignType && !parsedIntent.channel) {
    const campaignType = kb.campaignTypes.find(t => t.id === parsedIntent.campaignType);
    if (campaignType?.default_channels?.length > 0) {
      parsedIntent.channel = campaignType.default_channels[0];
    }
  }

  if (parsedIntent.campaignType && !parsedIntent.audience) {
    const campaignType = kb.campaignTypes.find(t => t.id === parsedIntent.campaignType);
    if (campaignType?.typical_audience) {
      parsedIntent.audience = campaignType.typical_audience;
    }
  }

  return parsedIntent;
}

export default {
  parseIntent,
  quickParse,
  getSuggestedClarifications,
  applyDefaults,
  loadKnowledge
};
