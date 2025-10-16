import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AIProvider, AIProviderConfig, MelodyGenerationRequest, MelodyGenerationResponse } from '../types';
import { getRateLimiter, RateLimitState } from '../utils/rateLimiter';

interface UseAIReturn {
  // State
  configuredProviders: AIProviderConfig[];
  isLoading: boolean;
  error: string | null;
  lastResponse: MelodyGenerationResponse | null;
  canCancel: boolean;
  rateLimitState: RateLimitState;

  // Actions
  generateMelody: (request: MelodyGenerationRequest) => Promise<MelodyGenerationResponse>;
  cancelGeneration: () => void;
  saveApiKey: (provider: AIProvider, apiKey: string) => Promise<void>;
  deleteApiKey: (provider: AIProvider) => Promise<void>;
  testConnection: (provider: AIProvider) => Promise<boolean>;
  refreshProviders: () => Promise<void>;
  clearError: () => void;
}

const AI_PROVIDERS: { name: AIProvider; displayName: string }[] = [
  { name: 'openai', displayName: 'OpenAI (GPT-4)' },
  { name: 'gemini', displayName: 'Google Gemini' },
  { name: 'anthropic', displayName: 'Anthropic (Claude)' },
  { name: 'cohere', displayName: 'Cohere' },
];

export const useAI = (): UseAIReturn => {
  const [configuredProviders, setConfiguredProviders] = useState<AIProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<MelodyGenerationResponse | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(() =>
    getRateLimiter().getState()
  );

  const cancelledRef = useRef(false);
  const rateLimiterIntervalRef = useRef<number | null>(null);

  // Fetch configured providers on mount
  useEffect(() => {
    refreshProviders();
  }, []);

  // Update rate limit state periodically
  useEffect(() => {
    const updateRateLimitState = () => {
      const newState = getRateLimiter().getState();
      setRateLimitState(newState);
    };

    // Update immediately
    updateRateLimitState();

    // Update every second when rate limited
    if (rateLimitState.isLimited) {
      rateLimiterIntervalRef.current = window.setInterval(updateRateLimitState, 1000);
    }

    return () => {
      if (rateLimiterIntervalRef.current) {
        clearInterval(rateLimiterIntervalRef.current);
        rateLimiterIntervalRef.current = null;
      }
    };
  }, [rateLimitState.isLimited]);

  const refreshProviders = useCallback(async () => {
    try {
      const configured = await invoke<string[]>('get_configured_ai_providers');
      const configuredSet = new Set(configured.map(p => p.toLowerCase()));

      const providers: AIProviderConfig[] = AI_PROVIDERS.map(provider => ({
        name: provider.name,
        displayName: provider.displayName,
        hasApiKey: configuredSet.has(provider.name),
      }));

      setConfiguredProviders(providers);
    } catch (err) {
      console.error('Failed to fetch configured providers:', err);
      // Set all as not configured on error
      setConfiguredProviders(
        AI_PROVIDERS.map(provider => ({
          name: provider.name,
          displayName: provider.displayName,
          hasApiKey: false,
        }))
      );
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    setCanCancel(false);
  }, []);

  const generateMelody = useCallback(async (request: MelodyGenerationRequest): Promise<MelodyGenerationResponse> => {
    // Check rate limit before attempting
    const rateLimiter = getRateLimiter();
    if (!rateLimiter.canMakeRequest()) {
      const state = rateLimiter.getState();
      throw new Error(`Rate limit exceeded. Please wait ${state.cooldownSeconds} seconds before trying again.`);
    }

    setIsLoading(true);
    setError(null);
    setCanCancel(true);
    cancelledRef.current = false;

    try {
      // Record the request
      rateLimiter.recordRequest();
      setRateLimitState(rateLimiter.getState());

      const response = await invoke<MelodyGenerationResponse>('generate_melody', {
        prompt: request.prompt,
        scale: request.scale,
        measures: request.measures || 4,
        provider: request.provider,
        temperature: request.temperature || 1.0,
      });

      // Check if cancelled after invoke completes
      if (cancelledRef.current) {
        throw new Error('Generation cancelled by user');
      }

      setLastResponse(response);
      return response;
    } catch (err) {
      if (cancelledRef.current) {
        throw new Error('Generation cancelled by user');
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      setCanCancel(false);
      cancelledRef.current = false;
      setRateLimitState(rateLimiter.getState());
    }
  }, []);

  const saveApiKey = useCallback(async (provider: AIProvider, apiKey: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await invoke('save_ai_api_key', {
        provider,
        apiKey,
      });

      // Refresh the providers list
      await refreshProviders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [refreshProviders]);

  const deleteApiKey = useCallback(async (provider: AIProvider): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await invoke('delete_ai_api_key', {
        provider,
      });

      // Refresh the providers list
      await refreshProviders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [refreshProviders]);

  const testConnection = useCallback(async (provider: AIProvider): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke<boolean>('test_ai_connection', {
        provider,
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    configuredProviders,
    isLoading,
    error,
    lastResponse,
    canCancel,
    rateLimitState,
    generateMelody,
    cancelGeneration,
    saveApiKey,
    deleteApiKey,
    testConnection,
    refreshProviders,
    clearError,
  };
};
