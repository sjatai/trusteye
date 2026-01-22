// Tool Resolver Service
// Matches user intent to registered tools

import { TOOLS_REGISTRY, Tool } from '../config/tools-registry';
import { withFailsafe } from '../utils/failsafe';
import Anthropic from '@anthropic-ai/sdk';

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

// Resolve user intent to a specific tool
export async function resolveToolFromIntent(userMessage: string): Promise<Tool | null> {
  // 1. Try exact phrase match first (fast)
  for (const tool of TOOLS_REGISTRY) {
    for (const phrase of tool.example_phrases) {
      if (userMessage.toLowerCase().includes(phrase.toLowerCase())) {
        return tool;
      }
    }
  }

  // 2. Use AI to match intent to tool
  const result = await withFailsafe(
    `tool_resolve_${userMessage.substring(0, 30)}`,
    async () => {
      const anthropic = getClient();

      const toolDescriptions = TOOLS_REGISTRY.map(t =>
        `${t.id}: ${t.description}`
      ).join('\n');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `Match user intent to a tool. Return ONLY the tool ID or "none".

AVAILABLE TOOLS:
${toolDescriptions}

USER MESSAGE: "${userMessage}"

TOOL ID:`
        }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const toolId = (textContent?.text || '').trim().toLowerCase();

      return TOOLS_REGISTRY.find(t => t.id === toolId) || null;
    },
    null
  );

  return result.data;
}

// Extract tool parameters from user message
export async function extractToolParams(
  tool: Tool,
  userMessage: string,
  context?: any
): Promise<Record<string, any>> {
  const result = await withFailsafe(
    `tool_params_${tool.id}`,
    async () => {
      const anthropic = getClient();

      const paramDescriptions = tool.params.map(p =>
        `${p.name} (${p.type}, ${p.required ? 'required' : 'optional'}): ${p.description}`
      ).join('\n');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Extract parameters for the "${tool.name}" tool from the user message.

PARAMETERS NEEDED:
${paramDescriptions}

USER MESSAGE: "${userMessage}"

CONTEXT: ${JSON.stringify(context || {})}

Return JSON object with parameter values. Use null for missing optional params.`
        }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent?.text || '{}';

      try {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : {};
      } catch {
        return {};
      }
    },
    {}
  );

  return result.data;
}

// Validate extracted parameters
export function validateToolParams(tool: Tool, params: Record<string, any>): {
  valid: boolean;
  missing: string[];
  errors: string[];
} {
  const missing: string[] = [];
  const errors: string[] = [];

  for (const param of tool.params) {
    const value = params[param.name];

    // Check required
    if (param.required && (value === undefined || value === null || value === '')) {
      missing.push(param.name);
      continue;
    }

    // Check type (basic)
    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (param.type === 'array' && !Array.isArray(value)) {
        errors.push(`${param.name} should be an array`);
      } else if (param.type === 'object' && typeof value !== 'object') {
        errors.push(`${param.name} should be an object`);
      } else if (param.type === 'number' && typeof value !== 'number') {
        errors.push(`${param.name} should be a number`);
      } else if (param.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${param.name} should be a boolean`);
      }
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

// Get tools matching a category
export function getToolsByCategory(category: Tool['category']): Tool[] {
  return TOOLS_REGISTRY.filter(t => t.category === category);
}

// Check if tool requires approval
export function requiresApproval(toolId: string): boolean {
  const tool = TOOLS_REGISTRY.find(t => t.id === toolId);
  return tool?.requires_approval || false;
}

export default {
  resolveToolFromIntent,
  extractToolParams,
  validateToolParams,
  getToolsByCategory,
  requiresApproval
};
