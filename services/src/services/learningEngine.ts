// Learning Engine Service
// Learns from user corrections and improves parsing over time

import * as fs from 'fs';
import * as path from 'path';
import supabase from './db';
import { withFailsafe } from '../utils/failsafe';
import { ParsedIntent } from './intentParser';
import { ConfidenceResult } from './confidenceScorer';

const learnedPatternsPath = path.join(__dirname, '../knowledge/learned/patterns.json');

// Minimum corrections needed to auto-learn a pattern
const MIN_CORRECTIONS_TO_LEARN = 3;

export interface ParseAttempt {
  id?: string;
  input: string;
  parsedIntent: ParsedIntent;
  confidence: ConfidenceResult;
  wasCorrect: boolean;
  correction?: {
    action?: string;
    actionCategory?: string;
    channel?: string;
    campaignType?: string;
    audience?: string;
  };
  brandId: string;
  userId?: string;
  createdAt?: string;
}

export interface LearnedPattern {
  input: string;
  normalizedInput: string;
  output: {
    action: string;
    actionCategory: string;
    channel?: string;
    campaignType?: string;
    audience?: string;
  };
  correctionCount: number;
  confidence: number;
  createdAt: string;
  lastUsedAt: string;
}

// In-memory cache for learned patterns
let learnedPatternsCache: LearnedPattern[] | null = null;

// Load learned patterns from file
function loadLearnedPatterns(): LearnedPattern[] {
  if (learnedPatternsCache !== null) return learnedPatternsCache;

  try {
    const data = JSON.parse(fs.readFileSync(learnedPatternsPath, 'utf-8'));
    learnedPatternsCache = data.learned_patterns || [];
  } catch {
    learnedPatternsCache = [];
  }

  return learnedPatternsCache!;
}

// Save learned patterns to file
function saveLearnedPatterns(patterns: LearnedPattern[]): void {
  try {
    const data = {
      learned_patterns: patterns,
      last_updated: new Date().toISOString()
    };
    fs.writeFileSync(learnedPatternsPath, JSON.stringify(data, null, 2));
    learnedPatternsCache = patterns;
  } catch (err) {
    console.error('Failed to save learned patterns:', err);
  }
}

// Normalize input for pattern matching
function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Log a parse attempt
export async function logParseAttempt(attempt: Omit<ParseAttempt, 'id' | 'createdAt'>): Promise<void> {
  const fullAttempt: ParseAttempt = {
    ...attempt,
    createdAt: new Date().toISOString()
  };

  // Try to persist to Supabase
  await withFailsafe(
    `learning_log_${attempt.input.substring(0, 20)}`,
    async () => {
      const { error } = await supabase
        .from('parse_attempts')
        .insert({
          input: fullAttempt.input,
          parsed_intent: fullAttempt.parsedIntent,
          confidence: fullAttempt.confidence,
          was_correct: fullAttempt.wasCorrect,
          correction: fullAttempt.correction,
          brand_id: fullAttempt.brandId,
          user_id: fullAttempt.userId
        });

      if (error) throw error;
    },
    null
  );

  // Check if we should learn from this
  if (!attempt.wasCorrect && attempt.correction) {
    await checkAndLearn(attempt.input, attempt.correction);
  }
}

// Record a correction
export async function recordCorrection(
  input: string,
  originalParse: ParsedIntent,
  correction: ParseAttempt['correction'],
  brandId: string,
  userId?: string
): Promise<void> {
  // Log the correction
  await logParseAttempt({
    input,
    parsedIntent: originalParse,
    confidence: { score: 0, level: 'very_low', recommendation: 'reject', breakdown: [], missingComponents: [], suggestedQuestions: [] },
    wasCorrect: false,
    correction,
    brandId,
    userId
  });

  // Try to persist to Supabase corrections table
  await withFailsafe(
    `learning_correction_${input.substring(0, 20)}`,
    async () => {
      const { error } = await supabase
        .from('learned_patterns')
        .upsert({
          input: input,
          normalized_input: normalizeInput(input),
          output: correction,
          correction_count: 1,
          brand_id: brandId
        }, {
          onConflict: 'normalized_input',
          ignoreDuplicates: false
        });

      if (error) throw error;
    },
    null
  );

  // Check if we should learn
  await checkAndLearn(input, correction);
}

// Check if we have enough corrections to learn a pattern
async function checkAndLearn(input: string, correction: ParseAttempt['correction']): Promise<void> {
  if (!correction) return;

  const normalizedInput = normalizeInput(input);
  const patterns = loadLearnedPatterns();

  // Find existing pattern or count corrections
  const existing = patterns.find(p => p.normalizedInput === normalizedInput);

  if (existing) {
    // Update existing pattern
    existing.correctionCount += 1;
    existing.lastUsedAt = new Date().toISOString();

    // Merge corrections (prefer new values)
    existing.output = {
      ...existing.output,
      ...correction
    };

    // Increase confidence if we've seen this multiple times
    if (existing.correctionCount >= MIN_CORRECTIONS_TO_LEARN) {
      existing.confidence = Math.min(100, existing.confidence + 10);
      console.log(`📚 Learning strengthened: "${normalizedInput}" (confidence: ${existing.confidence}%)`);
    }
  } else {
    // Add new pattern
    const newPattern: LearnedPattern = {
      input: input,
      normalizedInput,
      output: {
        action: correction.action || 'unknown',
        actionCategory: correction.actionCategory || 'unknown',
        channel: correction.channel,
        campaignType: correction.campaignType,
        audience: correction.audience
      },
      correctionCount: 1,
      confidence: 50, // Start at 50% confidence
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString()
    };

    patterns.push(newPattern);
    console.log(`📝 New pattern recorded: "${normalizedInput}"`);
  }

  // Save updated patterns
  saveLearnedPatterns(patterns);
}

// Get learning stats
export async function getLearningStats(brandId?: string): Promise<{
  totalPatterns: number;
  totalAttempts: number;
  successRate: number;
  recentCorrections: number;
}> {
  const patterns = loadLearnedPatterns();

  const result = await withFailsafe(
    'learning_stats',
    async () => {
      let query = supabase
        .from('parse_attempts')
        .select('*', { count: 'exact' });

      if (brandId) {
        query = query.eq('brand_id', brandId);
      }

      const { data, count } = await query;

      const correctCount = data?.filter(d => d.was_correct).length || 0;
      const recentCorrections = data?.filter(d =>
        !d.was_correct &&
        new Date(d.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;

      return {
        totalAttempts: count || 0,
        correctCount,
        recentCorrections
      };
    },
    { totalAttempts: 0, correctCount: 0, recentCorrections: 0 }
  );

  return {
    totalPatterns: patterns.length,
    totalAttempts: result.data.totalAttempts,
    successRate: result.data.totalAttempts > 0
      ? (result.data.correctCount / result.data.totalAttempts) * 100
      : 0,
    recentCorrections: result.data.recentCorrections
  };
}

// Export learned patterns for backup
export function exportLearnedPatterns(): LearnedPattern[] {
  return loadLearnedPatterns();
}

// Import learned patterns (for restore or transfer)
export function importLearnedPatterns(patterns: LearnedPattern[]): void {
  saveLearnedPatterns(patterns);
}

// Clear learned patterns (for testing)
export function clearLearnedPatterns(): void {
  saveLearnedPatterns([]);
}

// Get similar past successes (for learning from successful parses)
export async function getSimilarSuccesses(
  input: string,
  limit: number = 5
): Promise<ParseAttempt[]> {
  const result = await withFailsafe(
    'learning_similar',
    async () => {
      const { data } = await supabase
        .from('parse_attempts')
        .select('*')
        .eq('was_correct', true)
        .order('created_at', { ascending: false })
        .limit(100);

      // Simple similarity: count matching words
      const inputWords = new Set(normalizeInput(input).split(' '));

      const scored = (data || []).map(attempt => {
        const attemptWords = new Set(normalizeInput(attempt.input).split(' '));
        const intersection = [...inputWords].filter(w => attemptWords.has(w));
        return {
          attempt,
          similarity: intersection.length / Math.max(inputWords.size, attemptWords.size)
        };
      });

      return scored
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(s => s.attempt);
    },
    []
  );

  return result.data;
}

// Check if a pattern has been learned
export function hasLearnedPattern(input: string): boolean {
  const patterns = loadLearnedPatterns();
  const normalized = normalizeInput(input);
  return patterns.some(p =>
    p.normalizedInput === normalized &&
    p.correctionCount >= MIN_CORRECTIONS_TO_LEARN
  );
}

// Get learned pattern if exists
export function getLearnedPattern(input: string): LearnedPattern | null {
  const patterns = loadLearnedPatterns();
  const normalized = normalizeInput(input);
  return patterns.find(p => p.normalizedInput === normalized) || null;
}

export default {
  logParseAttempt,
  recordCorrection,
  getLearningStats,
  exportLearnedPatterns,
  importLearnedPatterns,
  clearLearnedPatterns,
  getSimilarSuccesses,
  hasLearnedPattern,
  getLearnedPattern,
  MIN_CORRECTIONS_TO_LEARN
};
