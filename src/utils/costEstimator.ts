/**
 * Cost estimator for AI melody generation
 * Provides approximate token usage and cost estimates
 */

import { AIProvider } from '../types';

// Token pricing per 1M tokens (as of 2025)
const PRICING = {
  openai: {
    input: 0.15, // GPT-4o-mini input
    output: 0.60, // GPT-4o-mini output
  },
  gemini: {
    input: 0.075, // Gemini 1.5 Flash input
    output: 0.30, // Gemini 1.5 Flash output
  },
  anthropic: {
    input: 0.25, // Claude 3.5 Haiku input
    output: 1.25, // Claude 3.5 Haiku output
  },
  cohere: {
    input: 0.15, // Command R input (estimate)
    output: 0.60, // Command R output (estimate)
  },
};

export interface CostEstimate {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number; // In USD
  provider: AIProvider;
}

/**
 * Estimate token count for a text
 * Simple heuristic: ~4 characters per token for English text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost for a melody generation request
 */
export function estimateGenerationCost(
  prompt: string,
  measures: number,
  provider: AIProvider
): CostEstimate {
  // Base system prompt: ~300 tokens
  const systemPromptTokens = 300;

  // User prompt tokens
  const userPromptTokens = estimateTokens(prompt);

  // Scale/constraint tokens: ~50 tokens
  const constraintTokens = 50;

  // Total input tokens
  const estimatedInputTokens = systemPromptTokens + userPromptTokens + constraintTokens;

  // Output tokens: ~30-50 tokens per note
  // Average melody: ~4-8 notes per measure
  const notesPerMeasure = 6;
  const tokensPerNote = 40;
  const estimatedOutputTokens = measures * notesPerMeasure * tokensPerNote;

  // Calculate cost
  const pricing = PRICING[provider] || PRICING.openai;
  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.input;
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.output;
  const estimatedCost = inputCost + outputCost;

  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCost,
    provider,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return '<$0.001';
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
}

/**
 * Check if request is considered "large" (may incur higher costs)
 */
export function isLargeRequest(measures: number): boolean {
  return measures > 8;
}

/**
 * Get warning message for large requests
 */
export function getLargeRequestWarning(measures: number, cost: number): string {
  return `This is a large request (${measures} measures). Estimated cost: ${formatCost(cost)}. Continue?`;
}

/**
 * Calculate total spend tracking (localStorage-based)
 */
const SPEND_STORAGE_KEY = 'ai_total_spend';

export interface SpendStats {
  totalRequests: number;
  totalCost: number;
  lastReset: string;
}

export function getSpendStats(): SpendStats {
  try {
    const stored = localStorage.getItem(SPEND_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load spend stats:', e);
  }

  return {
    totalRequests: 0,
    totalCost: 0,
    lastReset: new Date().toISOString(),
  };
}

export function recordSpend(cost: number): void {
  try {
    const stats = getSpendStats();
    stats.totalRequests += 1;
    stats.totalCost += cost;
    localStorage.setItem(SPEND_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to record spend:', e);
  }
}

export function resetSpendStats(): void {
  try {
    const stats: SpendStats = {
      totalRequests: 0,
      totalCost: 0,
      lastReset: new Date().toISOString(),
    };
    localStorage.setItem(SPEND_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to reset spend stats:', e);
  }
}
