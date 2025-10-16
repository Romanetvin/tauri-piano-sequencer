import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AIProvider, AIProviderConfig, MelodyGenerationRequest, MelodyGenerationResponse } from '../types';

interface UseAIReturn {
  // State
  configuredProviders: AIProviderConfig[];
  isLoading: boolean;
  error: string | null;
  lastResponse: MelodyGenerationResponse | null;

  // Actions
  generateMelody: (request: MelodyGenerationRequest) => Promise<MelodyGenerationResponse>;
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

  // Fetch configured providers on mount
  useEffect(() => {
    refreshProviders();
  }, []);

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

  const generateMelody = useCallback(async (request: MelodyGenerationRequest): Promise<MelodyGenerationResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await invoke<MelodyGenerationResponse>('generate_melody', {
        prompt: request.prompt,
        scale: request.scale,
        measures: request.measures || 4,
        provider: request.provider,
        temperature: request.temperature || 1.0,
      });

      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
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
    generateMelody,
    saveApiKey,
    deleteApiKey,
    testConnection,
    refreshProviders,
    clearError,
  };
};
