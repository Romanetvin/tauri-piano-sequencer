import React, { useState, useEffect } from 'react';
import { AIProvider, AIProviderConfig, MelodyGenerationResponse, Scale } from '../types';
import ScaleSelector from './ScaleSelector';
import { RootNote, ScaleMode } from '../utils/scaleUtils';
import { getMelodyStats } from '../utils/aiMelodyUtils';
import { parseAIError } from '../utils/errorParser';
import { loadAISettings, saveAISettings } from '../utils/localStorage';
import { estimateGenerationCost, formatCost, isLargeRequest } from '../utils/costEstimator';
import { RateLimitState } from '../utils/rateLimiter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings, Sparkles } from 'lucide-react';

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
  rateLimitState?: RateLimitState;
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
  rateLimitState,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [measures, setMeasures] = useState(4);
  const [temperature, setTemperature] = useState(1.0);
  const [useCustomScale, setUseCustomScale] = useState(false);
  const [customScale, setCustomScale] = useState<{ root: RootNote; mode: ScaleMode } | null>(null);
  const [rootOctave, setRootOctave] = useState(4);
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
    setRootOctave(settings.rootOctave);
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
      rootOctave,
    });

    try {
      // Determine which scale to use
      let scaleToUse: Scale | undefined;
      if (useCustomScale && customScale) {
        scaleToUse = { root: customScale.root, mode: customScale.mode, octave: rootOctave };
      } else if (selectedScale) {
        scaleToUse = { root: selectedScale.root, mode: selectedScale.mode, octave: rootOctave };
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Melody Generator
          </DialogTitle>
          <DialogDescription>
            Generate melodies using AI. Describe what you want and let AI compose for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {!generatedResponse ? (
            <>
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label htmlFor="provider">AI Provider</Label>
                <div className="flex gap-2 items-center">
                  <Select
                    value={selectedProvider}
                    onValueChange={(value) => setSelectedProvider(value as AIProvider)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="provider" className="flex-1">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem
                          key={provider.name}
                          value={provider.name}
                          disabled={!provider.hasApiKey}
                        >
                          {provider.displayName} {provider.hasApiKey ? '✓' : '(Not configured)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={onOpenSettings}
                    variant="outline"
                    size="icon"
                    title="Configure API keys"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
                {availableProviders.length === 0 && (
                  <p className="text-sm text-destructive">
                    No API keys configured.{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={onOpenSettings}>
                      Configure now
                    </Button>
                  </p>
                )}
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Melody Description</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., 'A cheerful melody with ascending notes' or 'Dark ambient progression with slow rhythm'"
                  rows={4}
                  disabled={isLoading}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Describe the mood, style, or character of the melody
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prompt.length}/1000
                  </p>
                </div>
              </div>

              {/* Basic Settings */}
              <div className="grid grid-cols-3 gap-4">
                {/* Measures */}
                <div className="space-y-2">
                  <Label htmlFor="measures">Measures (4/4)</Label>
                  <Input
                    id="measures"
                    type="number"
                    value={measures}
                    onChange={(e) => setMeasures(Math.max(1, Math.min(16, parseInt(e.target.value) || 4)))}
                    min="1"
                    max="16"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Duration: {measures * 4} beats
                  </p>
                </div>

                {/* Root Octave */}
                <div className="space-y-2">
                  <Label htmlFor="rootOctave">Root Octave</Label>
                  <Select
                    value={rootOctave.toString()}
                    onValueChange={(value) => setRootOctave(parseInt(value))}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="rootOctave">
                      <SelectValue placeholder="Select octave" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Low)</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4 (Default - C4)</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7 (High)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Chord octave range
                  </p>
                </div>

                {/* Scale Override */}
                <div className="space-y-2">
                  <Label>Scale</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomScale"
                      checked={useCustomScale}
                      onChange={(e) => setUseCustomScale(e.target.checked)}
                      className="w-4 h-4"
                      disabled={isLoading}
                    />
                    <label htmlFor="useCustomScale" className="text-sm">
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
                    <p className="text-xs text-muted-foreground">
                      Using: {selectedScale.root} {selectedScale.mode}
                    </p>
                  )}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
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
                  <div className="space-y-4 p-4 bg-muted rounded-lg border">
                    {/* Temperature */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="temperature">Creativity</Label>
                        <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
                      </div>
                      <Slider
                        id="temperature"
                        min={0}
                        max={2}
                        step={0.1}
                        value={[temperature]}
                        onValueChange={(values) => setTemperature(values[0])}
                        disabled={isLoading}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Conservative (0.0)</span>
                        <span>Creative (2.0)</span>
                      </div>
                    </div>

                    {/* Overlay */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="overlay"
                        checked={overlay}
                        onChange={(e) => setOverlay(e.target.checked)}
                        className="w-4 h-4"
                        disabled={isLoading}
                      />
                      <label htmlFor="overlay" className="text-sm">
                        Overlay on existing notes (uncheck to replace)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
                  <p className="text-sm font-medium text-destructive mb-1">
                    ✗ {parseAIError(error).message}
                  </p>
                  {parseAIError(error).action && (
                    <p className="text-xs text-destructive/80">
                      {parseAIError(error).action}
                    </p>
                  )}
                  {parseAIError(error).type === 'api_key_invalid' && (
                    <Button
                      onClick={onOpenSettings}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Configure API Key
                    </Button>
                  )}
                  {(parseAIError(error).type === 'network_error' || parseAIError(error).type === 'timeout') && (
                    <Button
                      onClick={handleGenerate}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              )}

              {/* Rate Limit Warning */}
              {rateLimitState?.isLimited && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-destructive">
                      Rate limit reached
                    </p>
                  </div>
                  <p className="text-xs text-destructive/80">
                    Please wait {rateLimitState.cooldownSeconds} seconds before generating again.
                  </p>
                </div>
              )}

              {/* Cost Estimate */}
              {prompt.trim() && !isLoading && !rateLimitState?.isLimited && (() => {
                const estimate = estimateGenerationCost(prompt, measures, selectedProvider);
                const isLarge = isLargeRequest(measures);
                return (
                  <div className={`p-3 border rounded-lg ${isLarge ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-muted border-border'}`}>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs ${isLarge ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}`}>
                        Estimated cost: {formatCost(estimate.estimatedCost)}
                      </p>
                      <p className={`text-xs ${isLarge ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                        ~{estimate.estimatedOutputTokens} tokens
                      </p>
                    </div>
                    {isLarge && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ Large request ({measures} measures)
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Generate Button */}
              <div className="flex flex-col gap-2">
                {isLoading && (
                  <div className="p-3 bg-primary/10 border border-primary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-primary">
                        Generating melody...
                      </p>
                      <p className="text-xs text-primary/80">
                        {elapsedSeconds}s
                      </p>
                    </div>
                    <p className="text-xs text-primary/80">
                      {elapsedSeconds < 5 ? 'This may take 5-15 seconds...' :
                       elapsedSeconds < 15 ? 'Please wait...' :
                       'Almost there...'}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim() || !selectedProviderConfig?.hasApiKey || rateLimitState?.isLimited}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Melody
                      </>
                    )}
                  </Button>
                  {isLoading && canCancel && onCancel && (
                    <Button
                      onClick={onCancel}
                      variant="destructive"
                    >
                      Cancel
                    </Button>
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
                  <Button
                    onClick={handleImport}
                    className="w-full"
                  >
                    Import to Piano Roll
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleRegenerate}
                      disabled={isLoading}
                      variant="secondary"
                    >
                      🔄 Regenerate
                    </Button>
                    <Button
                      onClick={() => setGeneratedResponse(null)}
                      variant="secondary"
                    >
                      ← Back
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIMelodyGenerator;
