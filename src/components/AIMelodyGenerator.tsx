import React, { useState, useEffect } from 'react';
import { AIProvider, AIProviderConfig, MelodyGenerationResponse, Scale } from '../types';
import ScaleSelector from './ScaleSelector';
import { RootNote, ScaleMode } from '../utils/scaleUtils';
import { getMelodyStats } from '../utils/aiMelodyUtils';
import { parseAIError } from '../utils/errorParser';
import { loadAISettings, saveAISettings } from '../utils/localStorage';

interface AIMelodyGeneratorProps {
  providers: AIProviderConfig[];
  selectedScale: { root: RootNote; mode: ScaleMode } | null;
  selectedTrackId: string;
  onGenerate: (
    prompt: string,
    scale: Scale | undefined,
    measures: number,
    provider: AIProvider,
    temperature: number
  ) => Promise<MelodyGenerationResponse>;
  onImport: (response: MelodyGenerationResponse, trackId: string, overlay: boolean) => void;
  onOpenSettings: () => void;
  onClose: () => void;
  isLoading: boolean;
  canCancel?: boolean;
  onCancel?: () => void;
}

const AIMelodyGenerator: React.FC<AIMelodyGeneratorProps> = ({
  providers,
  selectedScale,
  selectedTrackId,
  onGenerate,
  onImport,
  onOpenSettings,
  onClose,
  isLoading,
  canCancel = false,
  onCancel,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [measures, setMeasures] = useState(4);
  const [temperature, setTemperature] = useState(1.0);
  const [useCustomScale, setUseCustomScale] = useState(false);
  const [customScale, setCustomScale] = useState<{ root: RootNote; mode: ScaleMode } | null>(null);
  const [overlay, setOverlay] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<MelodyGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load settings from localStorage on mount
  useEffect(() => {
    const settings = loadAISettings();
    setSelectedProvider(settings.lastProvider);
    setTemperature(settings.temperature);
    setOverlay(settings.overlay);
    setMeasures(settings.measures);
  }, []);

  // Track elapsed time during generation
  useEffect(() => {
    if (!isLoading || !generationStartTime) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - generationStartTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, generationStartTime]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    const providerConfig = providers.find(p => p.name === selectedProvider);
    if (!providerConfig?.hasApiKey) {
      setError('Please configure an API key for this provider');
      return;
    }

    setError(null);
    setGenerationStartTime(Date.now());

    // Save settings to localStorage
    saveAISettings({
      lastProvider: selectedProvider,
      temperature,
      overlay,
      measures,
    });

    try {
      // Determine which scale to use
      let scaleToUse: Scale | undefined;
      if (useCustomScale && customScale) {
        scaleToUse = { root: customScale.root, mode: customScale.mode };
      } else if (selectedScale) {
        scaleToUse = { root: selectedScale.root, mode: selectedScale.mode };
      }

      const response = await onGenerate(
        prompt,
        scaleToUse,
        measures,
        selectedProvider,
        temperature
      );

      setGeneratedResponse(response);
      setGenerationStartTime(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Don't show error if user cancelled
      if (!errorMessage.includes('cancelled')) {
        setError(errorMessage);
      }
      setGenerationStartTime(null);
    }
  };

  const handleImport = () => {
    if (generatedResponse) {
      onImport(generatedResponse, selectedTrackId, overlay);
      onClose();
    }
  };

  const handleRegenerate = () => {
    setGeneratedResponse(null);
    handleGenerate();
  };

  const availableProviders = providers.filter(p => p.hasApiKey);
  const selectedProviderConfig = providers.find(p => p.name === selectedProvider);

  const stats = generatedResponse ? getMelodyStats(generatedResponse.notes) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-3xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              ✨ AI Melody Generator
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!generatedResponse ? (
            <>
              {/* Model Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Model
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    {providers.map(provider => (
                      <option
                        key={provider.name}
                        value={provider.name}
                        disabled={!provider.hasApiKey}
                      >
                        {provider.displayName} {provider.hasApiKey ? '✓' : '(No API key)'}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={onOpenSettings}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Configure API keys"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                {availableProviders.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ No API keys configured. Click the settings icon to add one.
                  </p>
                )}
              </div>

              {/* Prompt Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Melody Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., 'A cheerful melody with ascending notes' or 'Dark ambient progression with slow rhythm'"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
                  disabled={isLoading}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Describe the mood, style, or character of the melody
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {prompt.length}/1000
                  </p>
                </div>
              </div>

              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Measures */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Measures (4/4)
                  </label>
                  <input
                    type="number"
                    value={measures}
                    onChange={(e) => setMeasures(Math.max(1, Math.min(16, parseInt(e.target.value) || 4)))}
                    min="1"
                    max="16"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Duration: {measures * 4} beats
                  </p>
                </div>

                {/* Scale Override */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scale
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomScale"
                      checked={useCustomScale}
                      onChange={(e) => setUseCustomScale(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                      disabled={isLoading}
                    />
                    <label htmlFor="useCustomScale" className="text-sm text-gray-700 dark:text-gray-300">
                      Use custom scale
                    </label>
                  </div>
                  {useCustomScale && (
                    <div className="mt-2">
                      <ScaleSelector
                        selectedScale={customScale}
                        onScaleChange={setCustomScale}
                      />
                    </div>
                  )}
                  {!useCustomScale && selectedScale && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Using: {selectedScale.root} {selectedScale.mode}
                    </p>
                  )}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="mb-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-2"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Advanced Settings
                </button>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* Temperature */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temperature: {temperature.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Lower = more predictable, Higher = more creative
                      </p>
                    </div>

                    {/* Overlay */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="overlay"
                        checked={overlay}
                        onChange={(e) => setOverlay(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                      <label htmlFor="overlay" className="text-sm text-gray-700 dark:text-gray-300">
                        Overlay on existing notes (uncheck to replace)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    ✗ {parseAIError(error).message}
                  </p>
                  {parseAIError(error).action && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {parseAIError(error).action}
                    </p>
                  )}
                  {parseAIError(error).type === 'api_key_invalid' && (
                    <button
                      onClick={onOpenSettings}
                      className="mt-2 text-xs px-3 py-1 bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 rounded transition-colors"
                    >
                      Configure API Key
                    </button>
                  )}
                  {(parseAIError(error).type === 'network_error' || parseAIError(error).type === 'timeout') && (
                    <button
                      onClick={handleGenerate}
                      className="mt-2 text-xs px-3 py-1 bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 rounded transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <div className="flex flex-col gap-2">
                {isLoading && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        Generating melody...
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">
                        {elapsedSeconds}s
                      </p>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      {elapsedSeconds < 5 ? 'This may take 5-15 seconds...' :
                       elapsedSeconds < 15 ? 'Please wait...' :
                       'Almost there...'}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim() || !selectedProviderConfig?.hasApiKey}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>✨ Generate Melody</>
                    )}
                  </button>
                  {isLoading && canCancel && onCancel && (
                    <button
                      onClick={onCancel}
                      className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                      title="Cancel generation"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Preview Section */}
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                    ✓ Melody generated successfully!
                  </p>
                  {stats && (
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-700 dark:text-green-400">
                      <div>Notes: {stats.noteCount}</div>
                      <div>Duration: {stats.duration.toFixed(1)} beats</div>
                      <div>Range: {stats.lowestNote}-{stats.highestNote}</div>
                      <div>Avg Velocity: {stats.averageVelocity}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleImport}
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                  >
                    Import to Piano Roll
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      🔄 Regenerate
                    </button>
                    <button
                      onClick={() => setGeneratedResponse(null)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AIMelodyGenerator;
