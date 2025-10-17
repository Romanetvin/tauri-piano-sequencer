import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import PianoRoll from './components/PianoRoll';
import TransportControls from './components/TransportControls';
import ThemeToggle from './components/ThemeToggle';
import KeyboardGuide, { keyMappings } from './components/KeyboardGuide';
import VisualPiano from './components/VisualPiano';
import KeyPressNotification, { KeyPress } from './components/KeyPressNotification';
import ScaleSelector from './components/ScaleSelector';
import AISettings from './components/AISettings';
import AIMelodyGenerator from './components/AIMelodyGenerator';
import { Toaster } from 'sonner';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Music, FileJson, ChevronDown, Upload, Sparkles, Trash2 } from 'lucide-react';
import { useNotes } from './hooks/useNotes';
import { usePlayback } from './hooks/usePlayback';
import { useTracks } from './hooks/useTracks';
import { useAI } from './hooks/useAI';
import { useToast } from './hooks/useToast';
import { Note, GridSettings, AIProvider, MelodyGenerationResponse, Scale } from './types';
import { exportProject, importProject, validateProject, ExportFormat } from './utils/projectUtils';
import { RootNote, ScaleMode, getScaleNotes } from './utils/scaleUtils';
import { importAIMelody, quantizeToGrid } from './utils/aiMelodyUtils';

function App() {
  const [gridSettings] = useState<GridSettings>({
    snapToGrid: true,
    gridDivision: 4,
    pixelsPerBeat: 80,
    noteHeight: 20,
  });

  const {
    notes,
    selectedNoteIds,
    addNote,
    removeNote,
    removeSelectedNotes,
    selectNote,
    clearSelection,
    moveNote,
    moveSelectedNotes,
    resizeNote,
    setNotes,
    copySelectedNotes,
    pasteNotes,
    duplicateSelectedNotes,
    clearAllNotes,
  } = useNotes();

  const {
    tracks,
    selectedTrackId,
    setTracks,
  } = useTracks();

  const handleNotePlay = useCallback(async (note: Note) => {
    try {
      await invoke('play_note', {
        pitch: note.pitch,
        duration: note.duration,
        velocity: note.velocity,
      });
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  }, []);

  const { playbackState, play, pause, stop, seek } =
    usePlayback(notes, { onNotePlay: handleNotePlay, tracks });


  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [activePianoNotes, setActivePianoNotes] = useState<Set<number>>(new Set());
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false);
  const [showPianoVisual, setShowPianoVisual] = useState(true);
  const [keyPresses, setKeyPresses] = useState<KeyPress[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedScale, setSelectedScale] = useState<{ root: RootNote; mode: ScaleMode } | null>(null);

  // AI State
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAIMelodyGenerator, setShowAIMelodyGenerator] = useState(false);
  const {
    configuredProviders,
    isLoading: isAILoading,
    canCancel,
    rateLimitState,
    generateMelody,
    cancelGeneration,
    saveApiKey,
    deleteApiKey,
    testConnection,
  } = useAI();

  // Toast notifications
  const { showSuccess } = useToast();

  // Calculate highlighted notes based on selected scale
  const highlightedNotes = useMemo(() => {
    if (!selectedScale) return new Set<number>();
    return getScaleNotes(selectedScale.root, selectedScale.mode);
  }, [selectedScale]);

  // Keyboard playback functionality
  const playNoteFromKeyboard = useCallback(async (pitch: number) => {
    try {
      await invoke('play_note', {
        pitch,
        duration: 0.5, // Short duration for keyboard notes
        velocity: 100,
      });
    } catch (error) {
      console.error('Failed to play keyboard note:', error);
    }
  }, []);

  // Mouse playback for visual piano
  const handlePianoNotePlay = useCallback(async (pitch: number) => {
    setActivePianoNotes(prev => new Set(prev).add(pitch));
    try {
      await invoke('play_note', {
        pitch,
        duration: 0.5,
        velocity: 100,
      });
    } catch (error) {
      console.error('Failed to play piano note:', error);
    }
  }, []);

  const handlePianoNoteStop = useCallback((pitch: number) => {
    setActivePianoNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(pitch);
      return newSet;
    });
  }, []);

  // AI Handlers
  const handleAIGenerate = useCallback(async (
    prompt: string,
    scale: Scale | undefined,
    measures: number,
    provider: AIProvider,
    temperature: number
  ): Promise<MelodyGenerationResponse> => {
    return await generateMelody({ prompt, scale, measures, provider, temperature });
  }, [generateMelody]);

  const handleAIImport = useCallback((
    response: MelodyGenerationResponse,
    trackId: string,
    overlay: boolean
  ) => {
    const newNotes = importAIMelody(response, trackId, overlay, notes);
    const quantized = quantizeToGrid(newNotes, gridSettings);
    setNotes(quantized);

    // Auto-select the scale if one was used during generation
    if (response.metadata.scale) {
      const scale = response.metadata.scale;
      // Validate that root is a valid RootNote
      const validRoots: readonly string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      if (validRoots.includes(scale.root)) {
        setSelectedScale({ root: scale.root as RootNote, mode: scale.mode });
        showSuccess(`Melody imported! Added ${response.notes.length} notes in ${scale.root} ${scale.mode} 🎵`);
      } else {
        showSuccess(`Melody imported! Added ${response.notes.length} notes to piano roll 🎵`);
      }
    } else {
      showSuccess(`Melody imported! Added ${response.notes.length} notes to piano roll 🎵`);
    }
  }, [notes, gridSettings, setNotes, showSuccess, setSelectedScale]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // AI shortcut: Cmd/Ctrl + Shift + G
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyG') {
        e.preventDefault();
        setShowAIMelodyGenerator(true);
        return;
      }

      // Copy-paste shortcuts MUST be checked FIRST (before piano keys)
      // Use e.code for physical key position (works across all keyboard layouts)
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC') {
        e.preventDefault();
        copySelectedNotes();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyV') {
        e.preventDefault();
        pasteNotes();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyD') {
        e.preventDefault();
        duplicateSelectedNotes();
        return;
      }

      const key = e.key.toLowerCase();

      // Check if it's a piano key
      const mapping = keyMappings.find(m => m.key.toLowerCase() === key);
      if (mapping && !activeKeys.has(key)) {
        e.preventDefault();
        setActiveKeys(prev => new Set(prev).add(key));
        setActivePianoNotes(prev => new Set(prev).add(mapping.pitch));

        // Add key press notification
        const newKeyPress: KeyPress = {
          id: `${mapping.key}-${Date.now()}`,
          key: mapping.key,
          note: mapping.note,
          timestamp: Date.now(),
        };
        setKeyPresses(prev => [...prev, newKeyPress]);

        // Remove after timeout
        setTimeout(() => {
          setKeyPresses(prev => prev.filter(kp => kp.id !== newKeyPress.id));
        }, 2500);

        playNoteFromKeyboard(mapping.pitch);
        return;
      }

      // Other keyboard shortcuts
      if (e.key === 'Delete' || e.key === 'Backspace') {
        removeSelectedNotes();
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (playbackState.isPlaying) {
          pause();
        } else {
          play();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mapping = keyMappings.find(m => m.key.toLowerCase() === key);

      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      if (mapping) {
        setActivePianoNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(mapping.pitch);
          return newSet;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys, playNoteFromKeyboard, removeSelectedNotes, clearSelection, playbackState.isPlaying, pause, play, copySelectedNotes, pasteNotes, duplicateSelectedNotes]);

  const handleKeyDown = useCallback(
    (_e: React.KeyboardEvent) => {
      // This handler is kept for the piano roll container
      // Most keyboard handling is now done via window event listeners
    },
    []
  );

  // Export project with format selection
  const handleExport = useCallback((format: ExportFormat = 'midi') => {
    try {
      exportProject(notes, tracks, keyMappings, undefined, format);
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project. Please try again.');
    }
  }, [notes, tracks]);

  // Import project from JSON
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const project = await importProject(file);

      if (!validateProject(project)) {
        throw new Error('Invalid project file format');
      }

      // Load tracks
      setTracks(project.tracks);

      // Load notes
      setNotes(project.notes);

      // Clear selections
      clearSelection();

      alert(`Project "${project.name}" loaded successfully!`);
    } catch (error) {
      console.error('Failed to import project:', error);
      alert(`Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setNotes, setTracks, clearSelection]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleResetWithExport = useCallback((format: ExportFormat) => {
    try {
      exportProject(notes, tracks, keyMappings, undefined, format);
      clearAllNotes();
      setShowResetModal(false);
    } catch (error) {
      console.error('Failed to export before reset:', error);
      alert('Failed to export project. Reset cancelled.');
    }
  }, [notes, tracks, clearAllNotes]);

  const handleResetWithoutExport = useCallback(() => {
    if (notes.length === 0) {
      setShowResetModal(false);
      return;
    }
    clearAllNotes();
    setShowResetModal(false);
  }, [notes.length, clearAllNotes]);

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Piano Player
        </h1>
        <div className="flex-1" />
        <ScaleSelector
          selectedScale={selectedScale}
          onScaleChange={setSelectedScale}
        />
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
        <TransportControls
          isPlaying={playbackState.isPlaying}
          onPlay={play}
          onPause={pause}
          onStop={stop}
        />
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

        {/* Export/Import Buttons */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-5 w-5" />
              <span>Export</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('midi')}>
              <Music className="mr-2 h-4 w-4" />
              Export as MIDI (default)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              <FileJson className="mr-2 h-4 w-4" />
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={triggerFileInput}
          variant="outline"
          className="gap-2"
          title="Import project from JSON"
        >
          <Upload className="h-5 w-5" />
          <span>Import</span>
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.mid,.midi"
          onChange={handleImport}
          className="hidden"
        />

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

        {/* AI Generate Button */}
        <Button
          onClick={() => setShowAIMelodyGenerator(true)}
          className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white relative"
          title="AI Melody Generator (Ctrl+Shift+G)"
        >
          <Sparkles className="h-5 w-5" />
          <span>AI</span>
          {configuredProviders.filter(p => p.hasApiKey).length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              {configuredProviders.filter(p => p.hasApiKey).length}
            </span>
          )}
        </Button>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

        {/* Reset Button */}
        <Button
          onClick={() => setShowResetModal(true)}
          variant="outline"
          className="gap-2 hover:bg-destructive/10 hover:border-destructive/50"
          title="Reset piano roll"
        >
          <Trash2 className="h-5 w-5" />
          <span>Reset</span>
        </Button>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

        <ThemeToggle />
      </div>

      {/* Piano Roll */}
      <div
        className="flex-1 overflow-hidden transition-all duration-300"
        style={{
          maxHeight: showPianoVisual ? 'calc(100vh - 300px)' : 'calc(100vh - 50px)'
        }}
      >
        <PianoRoll
          notes={notes}
          selectedNoteIds={selectedNoteIds}
          currentBeat={playbackState.currentTime}
          gridSettings={gridSettings}
          onNoteSelect={selectNote}
          onNoteMove={moveNote}
          onMoveSelectedNotes={moveSelectedNotes}
          onNoteResize={resizeNote}
          onNoteAdd={addNote}
          onNoteDelete={removeNote}
          onSeek={seek}
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          highlightedNotes={highlightedNotes}
        />
      </div>

      {/* Piano Visual Toggle Button */}
      <div className="flex justify-center bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-1">
        <button
          onClick={() => setShowPianoVisual(!showPianoVisual)}
          className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                     border border-gray-300 dark:border-gray-700
                     transition-all duration-300 flex items-center gap-2"
          title={showPianoVisual ? "Hide piano visual" : "Show piano visual"}
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showPianoVisual ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            )}
          </svg>
        </button>
      </div>

      {/* Visual Piano - Collapsible */}
      {showPianoVisual && (
        <VisualPiano
          minPitch={48}
          maxPitch={84}
          activeNotes={activePianoNotes}
          onNotePlay={handlePianoNotePlay}
          onNoteStop={handlePianoNoteStop}
        />
      )}

      {/* Status Bar */}
      <div className="px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Notes: <span className="font-semibold text-gray-900 dark:text-gray-100">{notes.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Selected: <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedNoteIds.size}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Time: <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{playbackState.currentTime.toFixed(2)}</span> beats
            </span>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Use keyboard to play • Click & drag to create notes • Delete to remove • Space to play/pause
          </span>
        </div>
      </div>

      {/* Keyboard Guide Toggle Button - Lower Right */}
      {!showKeyboardGuide && (
        <button
          onClick={() => setShowKeyboardGuide(true)}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-lg bg-indigo-500 hover:bg-indigo-600
                     text-white shadow-lg hover:shadow-xl
                     transition-all duration-300 flex items-center gap-2"
          title="Show keyboard guide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Keyboard Guide</span>
        </button>
      )}

      {/* Keyboard Guide */}
      {showKeyboardGuide && <KeyboardGuide activeKeys={activeKeys} onClose={() => setShowKeyboardGuide(false)} />}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <AlertDialog open={showResetModal} onOpenChange={setShowResetModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  Reset Piano Roll
                  <p className="text-sm font-normal text-muted-foreground">This will clear all notes</p>
                </div>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to export your current melody before clearing?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
              {/* Export & Clear */}
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => handleResetWithExport('midi')}
                  className="flex-1"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Export MIDI & Clear
                </Button>
                <Button
                  onClick={() => handleResetWithExport('json')}
                  className="flex-1"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export JSON & Clear
                </Button>
              </div>

              {/* Clear without Export */}
              <Button
                onClick={handleResetWithoutExport}
                variant="destructive"
                className="w-full"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear without Exporting
              </Button>

              {/* Cancel */}
              <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Key Press Notifications */}
      <KeyPressNotification keyPresses={keyPresses} />

      {/* AI Settings Modal */}
      {showAISettings && (
        <AISettings
          providers={configuredProviders}
          onSaveApiKey={saveApiKey}
          onDeleteApiKey={deleteApiKey}
          onTestConnection={testConnection}
          onClose={() => setShowAISettings(false)}
          isLoading={isAILoading}
        />
      )}

      {/* AI Melody Generator Modal */}
      {showAIMelodyGenerator && (
        <AIMelodyGenerator
          providers={configuredProviders}
          selectedScale={selectedScale}
          selectedTrackId={selectedTrackId}
          onGenerate={handleAIGenerate}
          onImport={handleAIImport}
          onOpenSettings={() => {
            setShowAIMelodyGenerator(false);
            setShowAISettings(true);
          }}
          onClose={() => setShowAIMelodyGenerator(false)}
          isLoading={isAILoading}
          canCancel={canCancel}
          onCancel={cancelGeneration}
          rateLimitState={rateLimitState}
        />
      )}

      {/* Toast Notifications */}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

export default App;
