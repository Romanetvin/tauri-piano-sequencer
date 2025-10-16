import { AIProvider } from '../types';

const AI_SETTINGS_KEY = 'piano-app-ai-settings';

export interface AISettings {
  lastProvider: AIProvider;
  temperature: number;
  overlay: boolean;
  measures: number;
}

const DEFAULT_SETTINGS: AISettings = {
  lastProvider: 'openai',
  temperature: 1.0,
  overlay: true,
  measures: 4,
};

/**
 * Load AI settings from localStorage
 */
export function loadAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);

    // Validate and merge with defaults to handle missing keys
    return {
      lastProvider: parsed.lastProvider || DEFAULT_SETTINGS.lastProvider,
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULT_SETTINGS.temperature,
      overlay: typeof parsed.overlay === 'boolean' ? parsed.overlay : DEFAULT_SETTINGS.overlay,
      measures: typeof parsed.measures === 'number' ? parsed.measures : DEFAULT_SETTINGS.measures,
    };
  } catch (error) {
    console.error('Failed to load AI settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save AI settings to localStorage
 */
export function saveAISettings(settings: Partial<AISettings>): void {
  try {
    const current = loadAISettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save AI settings to localStorage:', error);
  }
}

/**
 * Clear AI settings from localStorage
 */
export function clearAISettings(): void {
  try {
    localStorage.removeItem(AI_SETTINGS_KEY);
  } catch (error) {
    console.error('Failed to clear AI settings from localStorage:', error);
  }
}
