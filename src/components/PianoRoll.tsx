import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Note as NoteType, GridSettings, Track } from '../types';
import Note from './Note';
import PianoKeys from './PianoKeys';
import TimeRuler from './TimeRuler';
import Playhead from './Playhead';
import { pitchToY, yToPitch, pixelsToBeats, snapToGrid, isBlackKey } from '../utils/noteUtils';

interface PianoRollProps {
  notes: NoteType[];
  selectedNoteIds: Set<string>;
  currentBeat: number;
  gridSettings: GridSettings;
  onNoteSelect: (noteId: string, addToSelection?: boolean) => void;
  onNoteMove: (noteId: string, newPitch: number, newStartTime: number) => void;
  onMoveSelectedNotes: (pitchDelta: number, timeDelta: number) => void;
  onNoteResize: (noteId: string, newDuration: number) => void;
  onNoteAdd: (pitch: number, startTime: number, duration: number, velocity: number, trackId: string) => void;
  onNoteDelete: (noteId: string) => void;
  onSeek: (beat: number) => void;
  tracks: Track[];
  selectedTrackId: string;
  highlightedNotes?: Set<number>;
}

const PianoRoll: React.FC<PianoRollProps> = ({
  notes,
  selectedNoteIds,
  currentBeat,
  gridSettings,
  onNoteSelect,
  onNoteMove,
  onMoveSelectedNotes,
  onNoteResize,
  onNoteAdd,
  onNoteDelete,
  onSeek,
  tracks,
  selectedTrackId,
  highlightedNotes,
}) => {
  const rollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [lastNoteDuration, setLastNoteDuration] = useState<number>(1.0); // Remember last note duration for easy chord creation
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectStart, setBoxSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [boxSelectCurrent, setBoxSelectCurrent] = useState<{ x: number; y: number } | null>(null);

  const minPitch = 21; // A0
  const maxPitch = 108; // C8
  const totalBeats = 256; // 64 measures at 4/4
  const rollHeight = (maxPitch - minPitch + 1) * gridSettings.noteHeight;

  // Sync horizontal scroll between time ruler and piano roll
  useEffect(() => {
    const timeRulerScroll = document.getElementById('time-ruler-scroll');
    const pianoRollScroll = document.getElementById('piano-roll-scroll');

    if (!timeRulerScroll || !pianoRollScroll) return;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      target.scrollLeft = source.scrollLeft;
    };

    const handleTimeRulerScroll = () => syncScroll(timeRulerScroll, pianoRollScroll);
    const handlePianoRollScroll = () => syncScroll(pianoRollScroll, timeRulerScroll);

    timeRulerScroll.addEventListener('scroll', handleTimeRulerScroll);
    pianoRollScroll.addEventListener('scroll', handlePianoRollScroll);

    return () => {
      timeRulerScroll.removeEventListener('scroll', handleTimeRulerScroll);
      pianoRollScroll.removeEventListener('scroll', handlePianoRollScroll);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    const rect = rollRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Cmd/Meta+click initiates box selection (not Ctrl, which triggers context menu)
    if (e.metaKey) {
      setBoxSelectStart({ x, y });
      setBoxSelectCurrent({ x, y });
      setIsBoxSelecting(true);
      // Ensure dragging is disabled during box selection
      setIsDragging(false);
      setDragStart(null);
    } else {
      // Normal note creation
      setDragStart({ x, y });
      setIsDragging(true);
      // Ensure box selection is disabled during note creation
      setIsBoxSelecting(false);
      setBoxSelectStart(null);
      setBoxSelectCurrent(null);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isBoxSelecting && boxSelectStart) {
      const rect = rollRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setBoxSelectCurrent({ x, y });
    }
    // Visual feedback for note creation could be added here for normal drag
  }, [isBoxSelecting, boxSelectStart]);

  // Wrapper for onNoteResize to track duration changes
  const handleNoteResize = useCallback((noteId: string, newDuration: number) => {
    onNoteResize(noteId, newDuration);
    // Remember this duration for creating new notes
    setLastNoteDuration(newDuration);
  }, [onNoteResize]);

  const handleMouseUp = (e: React.MouseEvent) => {
    // Handle box selection
    if (isBoxSelecting && boxSelectStart && boxSelectCurrent) {
      const minX = Math.min(boxSelectStart.x, boxSelectCurrent.x);
      const maxX = Math.max(boxSelectStart.x, boxSelectCurrent.x);
      const minY = Math.min(boxSelectStart.y, boxSelectCurrent.y);
      const maxY = Math.max(boxSelectStart.y, boxSelectCurrent.y);

      // Convert to beats and pitches
      const minTime = pixelsToBeats(minX, gridSettings.pixelsPerBeat);
      const maxTime = pixelsToBeats(maxX, gridSettings.pixelsPerBeat);
      const minPitchInBox = yToPitch(maxY, gridSettings.noteHeight, 0);
      const maxPitchInBox = yToPitch(minY, gridSettings.noteHeight, 0);

      // Find notes within the box and select them
      notes.forEach((note) => {
        const noteX = note.startTime;
        const noteEndX = note.startTime + note.duration;
        const notePitch = note.pitch;

        // Check if note overlaps with selection box
        if (
          noteEndX >= minTime &&
          noteX <= maxTime &&
          notePitch >= minPitchInBox &&
          notePitch <= maxPitchInBox
        ) {
          onNoteSelect(note.id, true); // Add to selection
        }
      });

      setIsBoxSelecting(false);
      setBoxSelectStart(null);
      setBoxSelectCurrent(null);
      return;
    }

    // Handle note creation
    if (!isDragging || !dragStart) return;

    const rect = rollRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pitch = yToPitch(dragStart.y, gridSettings.noteHeight, 0);

    // ALWAYS snap start position to grid cell (for precision)
    let startTime = pixelsToBeats(dragStart.x, gridSettings.pixelsPerBeat);
    if (gridSettings.snapToGrid) {
      startTime = snapToGrid(startTime, gridSettings.gridDivision);
    }

    // Calculate drag width to determine if user clicked or dragged
    const endX = e.clientX - rect.left;
    const width = Math.abs(endX - dragStart.x);
    const minDragThreshold = 5; // pixels - if drag is smaller than this, treat as click

    let duration: number;

    if (width < minDragThreshold) {
      // User clicked (didn't drag) - use last note duration
      duration = lastNoteDuration;
    } else {
      // User dragged - calculate duration from drag width
      duration = pixelsToBeats(width, gridSettings.pixelsPerBeat);

      // Apply grid snapping to duration
      if (gridSettings.snapToGrid) {
        duration = snapToGrid(duration, gridSettings.gridDivision);
      }

      // Minimum duration
      duration = Math.max(duration, 0.25);

      // Remember this duration for next note
      setLastNoteDuration(duration);
    }

    // Add note if valid
    if (duration > 0 && pitch >= minPitch && pitch <= maxPitch) {
      onNoteAdd(pitch, startTime, duration, 100, selectedTrackId);
    }

    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-950">
      {/* Main Piano Roll Area */}
      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
        {/* Time Ruler - scrolls horizontally with grid */}
        <div className="flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Empty space for piano keys alignment */}
          <div style={{ minWidth: '80px', flexShrink: 0 }} className="bg-gray-50 dark:bg-gray-950"></div>
          {/* Time Ruler Container - scrolls horizontally */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin" id="time-ruler-scroll" style={{ minWidth: 0 }}>
            <TimeRuler
              totalBeats={totalBeats}
              pixelsPerBeat={gridSettings.pixelsPerBeat}
              onSeek={onSeek}
            />
          </div>
        </div>

        {/* Piano Roll Grid with Keys - scrolls vertically and horizontally */}
        <div className="relative flex-1 flex overflow-y-auto overflow-x-hidden">
          {/* Piano Keys Sidebar - Fixed on left, sticky during horizontal scroll */}
          <div style={{ minWidth: '80px', flexShrink: 0, height: `${rollHeight}px` }} className="bg-gray-50 dark:bg-gray-950 z-10 sticky left-0">
            <PianoKeys
              minPitch={minPitch}
              maxPitch={maxPitch}
              noteHeight={gridSettings.noteHeight}
              highlightedNotes={highlightedNotes}
            />
          </div>

          {/* Piano Roll Grid Container - scrolls horizontally */}
          <div className="overflow-x-auto overflow-y-hidden scrollbar-thin" id="piano-roll-scroll" style={{ height: `${rollHeight}px`, width: '100%' }}>
            <div
              ref={rollRef}
              className="relative"
              style={{
                width: `${totalBeats * gridSettings.pixelsPerBeat}px`,
                height: `${rollHeight}px`,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                if (isDragging) {
                  setIsDragging(false);
                  setDragStart(null);
                }
                if (isBoxSelecting) {
                  setIsBoxSelecting(false);
                  setBoxSelectStart(null);
                  setBoxSelectCurrent(null);
                }
              }}
            >
            {/* Grid lines */}
            {Array.from({ length: maxPitch - minPitch + 1 }, (_, i) => {
              const pitch = maxPitch - i;
              const y = i * gridSettings.noteHeight;
              const isBlack = isBlackKey(pitch);
              const isInScale = highlightedNotes?.has(pitch);
              const hasScaleSelected = highlightedNotes && highlightedNotes.size > 0;

              // When scale is selected: use 2 tints (in-scale = lighter, out-of-scale = darker)
              // When no scale: use standard colors (white keys lighter, black keys darker)
              let bgClass = '';
              if (hasScaleSelected) {
                if (isInScale) {
                  // In scale: very light (highlighted)
                  bgClass = 'bg-gray-50 dark:bg-gray-800';
                } else {
                  // Out of scale: moderate gray/darker (dimmed)
                  bgClass = 'bg-gray-200 dark:bg-gray-950';
                }
              } else {
                // No scale selected: standard appearance
                if (isBlack) {
                  bgClass = 'bg-gray-100 dark:bg-gray-800';
                } else {
                  bgClass = 'bg-white dark:bg-gray-950';
                }
              }

              return (
                <div
                  key={pitch}
                  className={`absolute left-0 right-0 border-b border-gray-200 dark:border-gray-700 ${bgClass}`}
                  style={{
                    top: `${y}px`,
                    height: `${gridSettings.noteHeight}px`,
                  }}
                />
              );
            })}

            {/* Vertical grid lines for beats */}
            {Array.from({ length: totalBeats * gridSettings.gridDivision }, (_, i) => {
              const beat = i / gridSettings.gridDivision;
              const x = beat * gridSettings.pixelsPerBeat;
              const isMeasure = i % (gridSettings.gridDivision * 4) === 0;

              return (
                <div
                  key={`vline-${i}`}
                  className={`absolute top-0 bottom-0 ${
                    isMeasure
                      ? 'bg-gray-400 dark:bg-gray-600 w-px opacity-40'
                      : 'bg-gray-300 dark:bg-gray-700 w-px opacity-30'
                  }`}
                  style={{ left: `${x}px` }}
                />
              );
            })}

            {/* Notes */}
            {notes.map((note) => {
              const y = pitchToY(note.pitch, gridSettings.noteHeight, 0);
              const track = tracks.find(t => t.id === note.trackId);
              return (
                <Note
                  key={note.id}
                  note={note}
                  noteHeight={gridSettings.noteHeight}
                  pixelsPerBeat={gridSettings.pixelsPerBeat}
                  yPosition={y}
                  isSelected={selectedNoteIds.has(note.id)}
                  selectedNoteIds={selectedNoteIds}
                  onSelect={onNoteSelect}
                  onMove={onNoteMove}
                  onMoveSelectedNotes={onMoveSelectedNotes}
                  onResize={handleNoteResize}
                  onDelete={onNoteDelete}
                  gridSettings={gridSettings}
                  trackColor={track?.color || '#6366f1'}
                />
              );
            })}

            {/* Playhead */}
            <Playhead
              currentBeat={currentBeat}
              pixelsPerBeat={gridSettings.pixelsPerBeat}
              height={rollHeight}
            />

            {/* Drag preview for note creation */}
            {isDragging && dragStart && (
              <div
                className="absolute bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60 rounded-sm pointer-events-none shadow-lg"
                style={{
                  left: `${dragStart.x}px`,
                  top: `${Math.floor(dragStart.y / gridSettings.noteHeight) * gridSettings.noteHeight}px`,
                  width: '20px',
                  height: `${gridSettings.noteHeight - 2}px`,
                }}
              />
            )}

            {/* Box selection visual */}
            {isBoxSelecting && boxSelectStart && boxSelectCurrent && (
              <div
                className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none rounded-sm"
                style={{
                  left: `${Math.min(boxSelectStart.x, boxSelectCurrent.x)}px`,
                  top: `${Math.min(boxSelectStart.y, boxSelectCurrent.y)}px`,
                  width: `${Math.abs(boxSelectCurrent.x - boxSelectStart.x)}px`,
                  height: `${Math.abs(boxSelectCurrent.y - boxSelectStart.y)}px`,
                }}
              />
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
