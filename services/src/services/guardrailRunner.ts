// Guardrail Runner Service
// Runs all guardrail checks on content

import { GUARDRAILS, GuardrailResult } from '../config/guardrails';

export interface GuardrailReport {
  passed: boolean;
  blockers: string[];
  warnings: string[];
  details: {
    guardrail: string;
    type: 'block' | 'warn' | 'transform';
    result: GuardrailResult;
  }[];
}

// Run all guardrails on content
export function runGuardrails(content: string, context?: any): GuardrailReport {
  const report: GuardrailReport = {
    passed: true,
    blockers: [],
    warnings: [],
    details: []
  };

  for (const guardrail of GUARDRAILS) {
    const result = guardrail.check(content, context);

    report.details.push({
      guardrail: guardrail.name,
      type: guardrail.type,
      result
    });

    if (!result.passed) {
      if (guardrail.type === 'block') {
        report.passed = false;
        report.blockers.push(result.message || guardrail.name);
      } else if (guardrail.type === 'warn') {
        report.warnings.push(result.message || guardrail.name);
      }
    }
  }

  return report;
}

// Run only blocking guardrails (fast check)
export function runBlockingGuardrails(content: string, context?: any): {
  passed: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];

  for (const guardrail of GUARDRAILS) {
    if (guardrail.type !== 'block') continue;

    const result = guardrail.check(content, context);

    if (!result.passed) {
      blockers.push(result.message || guardrail.name);
    }
  }

  return {
    passed: blockers.length === 0,
    blockers
  };
}

// Run specific guardrails by ID
export function runSpecificGuardrails(
  content: string,
  guardrailIds: string[],
  context?: any
): GuardrailReport {
  const report: GuardrailReport = {
    passed: true,
    blockers: [],
    warnings: [],
    details: []
  };

  const selectedGuardrails = GUARDRAILS.filter(g => guardrailIds.includes(g.id));

  for (const guardrail of selectedGuardrails) {
    const result = guardrail.check(content, context);

    report.details.push({
      guardrail: guardrail.name,
      type: guardrail.type,
      result
    });

    if (!result.passed) {
      if (guardrail.type === 'block') {
        report.passed = false;
        report.blockers.push(result.message || guardrail.name);
      } else if (guardrail.type === 'warn') {
        report.warnings.push(result.message || guardrail.name);
      }
    }
  }

  return report;
}

// Get all guardrail IDs
export function getGuardrailIds(): string[] {
  return GUARDRAILS.map(g => g.id);
}

// Get guardrail by ID
export function getGuardrailById(id: string) {
  return GUARDRAILS.find(g => g.id === id);
}

export default {
  runGuardrails,
  runBlockingGuardrails,
  runSpecificGuardrails,
  getGuardrailIds,
  getGuardrailById
};
