export type AIErrorType =
  | 'api_key_invalid'
  | 'rate_limit'
  | 'network_error'
  | 'timeout'
  | 'invalid_response'
  | 'validation_error'
  | 'unknown';

export interface ParsedError {
  type: AIErrorType;
  message: string;
  originalError: string;
  action?: string;
  retryAfter?: number; // seconds
}

/**
 * Parse AI generation error messages and extract actionable information
 */
export function parseAIError(error: string): ParsedError {
  const errorLower = error.toLowerCase();

  // API key errors
  if (
    errorLower.includes('api key') ||
    errorLower.includes('unauthorized') ||
    errorLower.includes('invalid key') ||
    errorLower.includes('authentication') ||
    errorLower.includes('401')
  ) {
    return {
      type: 'api_key_invalid',
      message: 'Invalid or missing API key',
      originalError: error,
      action: 'Please check your API key in settings',
    };
  }

  // Rate limit errors
  if (
    errorLower.includes('rate limit') ||
    errorLower.includes('too many requests') ||
    errorLower.includes('429')
  ) {
    // Try to extract retry-after time
    const retryMatch = error.match(/retry.*?(\d+)\s*(second|minute|hour)/i);
    let retryAfter: number | undefined;

    if (retryMatch) {
      const value = parseInt(retryMatch[1]);
      const unit = retryMatch[2].toLowerCase();
      retryAfter = unit === 'minute' ? value * 60 : unit === 'hour' ? value * 3600 : value;
    }

    return {
      type: 'rate_limit',
      message: 'Rate limit exceeded',
      originalError: error,
      action: retryAfter ? `Please wait ${retryAfter} seconds before retrying` : 'Please wait a moment before retrying',
      retryAfter,
    };
  }

  // Network errors
  if (
    errorLower.includes('network') ||
    errorLower.includes('connection') ||
    errorLower.includes('fetch') ||
    errorLower.includes('dns') ||
    errorLower.includes('econnrefused') ||
    errorLower.includes('enotfound')
  ) {
    return {
      type: 'network_error',
      message: 'Network connection failed',
      originalError: error,
      action: 'Check your internet connection and try again',
    };
  }

  // Timeout errors
  if (
    errorLower.includes('timeout') ||
    errorLower.includes('timed out') ||
    errorLower.includes('deadline exceeded')
  ) {
    return {
      type: 'timeout',
      message: 'Request timed out',
      originalError: error,
      action: 'The request took too long. Try a shorter melody or try again',
    };
  }

  // Validation errors
  if (
    errorLower.includes('validation') ||
    errorLower.includes('invalid notes') ||
    errorLower.includes('invalid request') ||
    errorLower.includes('measures') ||
    errorLower.includes('scale')
  ) {
    return {
      type: 'validation_error',
      message: 'Generated melody validation failed',
      originalError: error,
      action: 'Try generating again with a different prompt',
    };
  }

  // Invalid response/parsing errors
  if (
    errorLower.includes('parse') ||
    errorLower.includes('invalid json') ||
    errorLower.includes('no valid json') ||
    errorLower.includes('unexpected response')
  ) {
    return {
      type: 'invalid_response',
      message: 'AI returned an invalid response',
      originalError: error,
      action: 'Try generating again',
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    originalError: error,
    action: 'Please try again',
  };
}

/**
 * Get a user-friendly error message with action
 */
export function formatErrorMessage(error: string): string {
  const parsed = parseAIError(error);
  return parsed.action ? `${parsed.message}. ${parsed.action}` : parsed.message;
}
