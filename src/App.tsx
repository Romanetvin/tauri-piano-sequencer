import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import PianoRoll from './components/PianoRoll';
import TransportControls from './components/TransportControls';
import SettingsPanel from './components/SettingsPanel';
import ThemeToggle from './components/ThemeToggle';
import KeyboardGuide, { keyMappings } from './components/KeyboardGuide';
import VisualPiano from './components/VisualPiano';
import KeyPressNotification, { KeyPress } from './components/KeyPressNotification';
import TrackPanel from './components/TrackPanel';
import ScaleSelector from './components/ScaleSelector';
import { useNotes } from './hooks/useNotes';
import { usePlayback } from './hooks/usePlayback';
import { useTracks } from './hooks/useTracks';
import { Note, GridSettings } from './types';
import { exportProject, importProject, validateProject, ExportFormat } from './utils/projectUtils';
import { RootNote, ScaleMode, getScaleNotes } from './utils/scaleUtils';

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
  } = useNotes();

  const {
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    updateTrack,
    toggleMute,
    toggleSolo,
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

  const { playbackState, play, pause, stop, seek, setVolume } =
    usePlayback(notes, { onNotePlay: handleNotePlay, tracks });

  const handleVolumeChange = useCallback(
    async (volume: number) => {
      setVolume(volume);
      try {
        await invoke('set_volume', { volume });
      } catch (error) {
        console.error('Failed to set volume:', error);
      }
    },
    [setVolume]
  );

  const handleSoundModeChange = useCallback(
    async (mode: 'piano' | 'synthesizer') => {
      setSoundMode(mode);
      try {
        await invoke('set_sound_mode', { mode });
      } catch (error) {
        console.error('Failed to set sound mode:', error);
      }
    },
    []
  );

  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [activePianoNotes, setActivePianoNotes] = useState<Set<number>>(new Set());
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false);
  const [showTrackPanel, setShowTrackPanel] = useState(false);
  const [showPianoVisual, setShowPianoVisual] = useState(true);
  const [keyPresses, setKeyPresses] = useState<KeyPress[]>([]);
  const [soundMode, setSoundMode] = useState<'piano' | 'synthesizer'>('piano');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedScale, setSelectedScale] = useState<{ root: RootNote; mode: ScaleMode } | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement) return;

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
  }, [activeKeys, playNoteFromKeyboard, removeSelectedNotes, clearSelection, playbackState.isPlaying, pause, play]);

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
      setShowExportMenu(false);
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
        <SettingsPanel
          volume={playbackState.volume}
          onVolumeChange={handleVolumeChange}
          soundMode={soundMode}
          onSoundModeChange={handleSoundModeChange}
        />
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

        {/* Export/Import Buttons */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       border border-gray-300 dark:border-gray-700
                       transition-all duration-300 flex items-center gap-2"
            title="Export project"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Export</span>
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Export dropdown menu */}
          {showExportMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => handleExport('midi')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Export as MIDI (default)
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as JSON
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={triggerFileInput}
          className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                     border border-gray-300 dark:border-gray-700
                     transition-all duration-300 flex items-center gap-2"
          title="Import project from JSON"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Import</span>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.mid,.midi"
          onChange={handleImport}
          className="hidden"
        />

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

        <button
          onClick={() => setShowTrackPanel(!showTrackPanel)}
          className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                     border border-gray-300 dark:border-gray-700
                     transition-all duration-300"
          title="Toggle track panel"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <ThemeToggle />
      </div>

      {/* Track Panel - Collapsible */}
      {showTrackPanel && (
        <TrackPanel
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
          onUpdateTrack={updateTrack}
          onToggleMute={toggleMute}
          onToggleSolo={toggleSolo}
        />
      )}

      {/* Piano Roll */}
      <div
        className="flex-1 overflow-hidden transition-all duration-300"
        style={{
          maxHeight: showTrackPanel
            ? (showPianoVisual ? 'calc(100vh - 400px)' : 'calc(100vh - 150px)')
            : (showPianoVisual ? 'calc(100vh - 300px)' : 'calc(100vh - 50px)')
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

      {/* Key Press Notifications */}
      <KeyPressNotification keyPresses={keyPresses} />
    </div>
  );
}

export default App;
