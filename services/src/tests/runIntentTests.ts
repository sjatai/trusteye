// Intent Test Runner
// Runs the 32 test cases and reports results

import { TEST_CASES, TestCase, getTestsByCategory } from './intentTestSuite';
import { parseIntent, quickParse } from '../services/intentParser';
import { calculateConfidence } from '../services/confidenceScorer';

interface TestResult {
  testId: number;
  passed: boolean;
  input: string;
  description: string;
  expected: TestCase['expected'];
  actual: {
    actionCategory: string;
    channel?: string;
    campaignType?: string;
    audience?: string;
  };
  confidence: number;
  minConfidence: number;
  errors: string[];
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  avgConfidence: number;
  byCategory: Record<string, { total: number; passed: number; passRate: number }>;
  failures: TestResult[];
}

// Run a single test
async function runTest(test: TestCase, useAI: boolean = false): Promise<TestResult> {
  const errors: string[] = [];

  // Parse the input
  const parsed = useAI ? await parseIntent(test.input) : quickParse(test.input);

  // Get confidence
  const fullParsed = {
    action: (parsed as any).action || 'unknown',
    actionCategory: parsed.actionCategory || 'unknown',
    channel: parsed.channel,
    campaignType: parsed.campaignType,
    audience: parsed.audience,
    schedule: { type: 'immediate' as const },
    rawInput: test.input,
    extractedEntities: (parsed as any).extractedEntities || [],
    parseMethod: (parsed as any).parseMethod || 'pattern'
  };

  const confidence = calculateConfidence(fullParsed);

  // Check action category
  if (test.expected.actionCategory && parsed.actionCategory !== test.expected.actionCategory) {
    errors.push(`actionCategory: expected "${test.expected.actionCategory}", got "${parsed.actionCategory}"`);
  }

  // Check channel
  if (test.expected.channel && parsed.channel !== test.expected.channel) {
    errors.push(`channel: expected "${test.expected.channel}", got "${parsed.channel || 'undefined'}"`);
  }

  // Check campaign type
  if (test.expected.campaignType && parsed.campaignType !== test.expected.campaignType) {
    errors.push(`campaignType: expected "${test.expected.campaignType}", got "${parsed.campaignType || 'undefined'}"`);
  }

  // Check audience
  if (test.expected.audience && parsed.audience !== test.expected.audience) {
    errors.push(`audience: expected "${test.expected.audience}", got "${parsed.audience || 'undefined'}"`);
  }

  // Check confidence threshold
  if (confidence.score < test.minConfidence) {
    errors.push(`confidence: expected >=${test.minConfidence}, got ${confidence.score}`);
  }

  return {
    testId: test.id,
    passed: errors.length === 0,
    input: test.input,
    description: test.description,
    expected: test.expected,
    actual: {
      actionCategory: parsed.actionCategory || 'unknown',
      channel: parsed.channel,
      campaignType: parsed.campaignType,
      audience: parsed.audience
    },
    confidence: confidence.score,
    minConfidence: test.minConfidence,
    errors
  };
}

// Run all tests
export async function runAllTests(useAI: boolean = false): Promise<TestSummary> {
  console.log('\n========================================');
  console.log('🧪 MARKETING INTELLIGENCE ENGINE TESTS');
  console.log('========================================\n');
  console.log(`Mode: ${useAI ? 'AI-Enhanced' : 'Pattern-Only'}`);
  console.log(`Total Tests: ${TEST_CASES.length}\n`);

  const results: TestResult[] = [];
  const byCategory: Record<string, { total: number; passed: number; passRate: number }> = {};

  // Initialize category tracking
  for (const category of Object.keys(getTestsByCategory())) {
    byCategory[category] = { total: 0, passed: 0, passRate: 0 };
  }

  // Run each test
  for (const test of TEST_CASES) {
    const result = await runTest(test, useAI);
    results.push(result);

    // Update category stats
    byCategory[test.category].total += 1;
    if (result.passed) {
      byCategory[test.category].passed += 1;
    }

    // Print result
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Test ${test.id}: ${test.description}`);
    if (!result.passed) {
      console.log(`   Input: "${test.input}"`);
      result.errors.forEach(e => console.log(`   ❌ ${e}`));
    }
  }

  // Calculate pass rates
  for (const category of Object.keys(byCategory)) {
    const cat = byCategory[category];
    cat.passRate = cat.total > 0 ? Math.round((cat.passed / cat.total) * 100) : 0;
  }

  // Calculate summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  const summary: TestSummary = {
    totalTests: results.length,
    passed,
    failed,
    passRate: Math.round((passed / results.length) * 100),
    avgConfidence: Math.round(avgConfidence),
    byCategory,
    failures: results.filter(r => !r.passed)
  };

  // Print summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================\n');
  console.log(`Total: ${summary.totalTests}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Pass Rate: ${summary.passRate}%`);
  console.log(`Avg Confidence: ${summary.avgConfidence}%`);

  console.log('\n📁 BY CATEGORY:');
  for (const [category, stats] of Object.entries(summary.byCategory)) {
    const emoji = stats.passRate >= 80 ? '🟢' : stats.passRate >= 60 ? '🟡' : '🔴';
    console.log(`   ${emoji} ${category}: ${stats.passed}/${stats.total} (${stats.passRate}%)`);
  }

  if (summary.failures.length > 0) {
    console.log('\n❌ FAILURES:');
    for (const failure of summary.failures) {
      console.log(`\n   Test ${failure.testId}: ${failure.description}`);
      console.log(`   Input: "${failure.input}"`);
      failure.errors.forEach(e => console.log(`   • ${e}`));
    }
  }

  console.log('\n========================================');
  const targetMet = summary.passRate >= 80;
  console.log(targetMet ? '✅ TARGET MET (>80% pass rate)' : '❌ TARGET NOT MET (need >80% pass rate)');
  console.log('========================================\n');

  return summary;
}

// Run tests for a specific category
export async function runCategoryTests(
  category: string,
  useAI: boolean = false
): Promise<TestResult[]> {
  const tests = TEST_CASES.filter(t => t.category === category);
  const results: TestResult[] = [];

  for (const test of tests) {
    results.push(await runTest(test, useAI));
  }

  return results;
}

// CLI entry point
if (require.main === module) {
  const useAI = process.argv.includes('--ai');
  runAllTests(useAI).then(summary => {
    process.exit(summary.passRate >= 80 ? 0 : 1);
  });
}

export default {
  runAllTests,
  runCategoryTests,
  runTest
};
