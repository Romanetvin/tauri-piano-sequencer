import React, { useRef, useState, useCallback } from 'react';
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
  const [currentPage, setCurrentPage] = useState(0); // Track which 4-beat page we're viewing

  const minPitch = 21; // A0
  const maxPitch = 108; // C8
  const totalBeats = 256; // 64 measures at 4/4
  const beatsPerPage = 16; // Show 4 measures (4 measures × 4 beats = 16 beats)
  const totalPages = Math.ceil(totalBeats / beatsPerPage);
  const rollHeight = (maxPitch - minPitch + 1) * gridSettings.noteHeight;

  // Calculate the visible beat range for the current page
  const visibleStartBeat = currentPage * beatsPerPage;
  const visibleEndBeat = Math.min(visibleStartBeat + beatsPerPage, totalBeats);

  // Navigation functions - cycle through 4-measure pages
  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    const rect = rollRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Adjust x position to account for the current page offset
    const x = e.clientX - rect.left + (visibleStartBeat * gridSettings.pixelsPerBeat);
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

      // Adjust x position to account for the current page offset
      const x = e.clientX - rect.left + (visibleStartBeat * gridSettings.pixelsPerBeat);
      const y = e.clientY - rect.top;
      setBoxSelectCurrent({ x, y });
    }
    // Visual feedback for note creation could be added here for normal drag
  }, [isBoxSelecting, boxSelectStart, visibleStartBeat, gridSettings.pixelsPerBeat]);

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
        {/* Time Ruler - shows only current 4-beat page */}
        <div className="flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          {/* Empty space for piano keys alignment */}
          <div style={{ width: '80px', flexShrink: 0 }} className="bg-gray-50 dark:bg-gray-950"></div>
          {/* Time Ruler Container - expands to fill space */}
          <div className="flex-1 min-w-0">
            <TimeRuler
              totalBeats={beatsPerPage}
              pixelsPerBeat={gridSettings.pixelsPerBeat}
              startBeat={visibleStartBeat}
              onSeek={(beat) => onSeek(beat + visibleStartBeat)}
            />
          </div>
          {/* Page Navigation */}
          <div className="flex items-center gap-1 px-2 bg-gray-50 dark:bg-gray-950 flex-shrink-0">
            <button
              onClick={goToPreviousPage}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Previous 4 measures"
            >
              <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextPage}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Next 4 measures"
            >
              <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Piano Roll Grid with Keys - scrolls vertically only */}
        <div className="relative flex-1 flex overflow-y-auto overflow-x-hidden">
          {/* Piano Keys Sidebar - Fixed on left */}
          <div style={{ width: '80px', flexShrink: 0, height: `${rollHeight}px` }} className="bg-gray-50 dark:bg-gray-950 z-10">
            <PianoKeys
              minPitch={minPitch}
              maxPitch={maxPitch}
              noteHeight={gridSettings.noteHeight}
              highlightedNotes={highlightedNotes}
            />
          </div>

          {/* Piano Roll Grid Container - expands to fill space */}
          <div
            className="flex-1 min-w-0"
            style={{
              height: `${rollHeight}px`,
            }}
          >
            <div
              ref={rollRef}
              className="relative"
              style={{
                width: `${beatsPerPage * gridSettings.pixelsPerBeat}px`,
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

            {/* Vertical grid lines for beats - only visible beats */}
            {Array.from({ length: beatsPerPage * gridSettings.gridDivision }, (_, i) => {
              const beat = i / gridSettings.gridDivision;
              const absoluteBeat = visibleStartBeat + beat;
              const x = beat * gridSettings.pixelsPerBeat;
              const absoluteGridIndex = Math.floor(absoluteBeat * gridSettings.gridDivision);
              const isMeasure = absoluteGridIndex % (gridSettings.gridDivision * 4) === 0;

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

            {/* Notes - only render notes in visible range */}
            {notes
              .filter((note) => {
                // Check if note is visible in current page
                const noteEnd = note.startTime + note.duration;
                return noteEnd > visibleStartBeat && note.startTime < visibleEndBeat;
              })
              .map((note) => {
                const y = pitchToY(note.pitch, gridSettings.noteHeight, 0);
                const track = tracks.find(t => t.id === note.trackId);
                // Adjust x position relative to visible start
                const adjustedNote = {
                  ...note,
                  startTime: note.startTime - visibleStartBeat,
                };
                return (
                  <Note
                    key={note.id}
                    note={adjustedNote}
                    noteHeight={gridSettings.noteHeight}
                    pixelsPerBeat={gridSettings.pixelsPerBeat}
                    yPosition={y}
                    isSelected={selectedNoteIds.has(note.id)}
                    selectedNoteIds={selectedNoteIds}
                    onSelect={onNoteSelect}
                    onMove={(noteId, newPitch, newStartTime) =>
                      onNoteMove(noteId, newPitch, newStartTime + visibleStartBeat)
                    }
                    onMoveSelectedNotes={onMoveSelectedNotes}
                    onResize={handleNoteResize}
                    onDelete={onNoteDelete}
                    gridSettings={gridSettings}
                    trackColor={track?.color || '#6366f1'}
                  />
                );
              })}

            {/* Playhead - only show if in visible range */}
            {currentBeat >= visibleStartBeat && currentBeat < visibleEndBeat && (
              <Playhead
                currentBeat={currentBeat - visibleStartBeat}
                pixelsPerBeat={gridSettings.pixelsPerBeat}
                height={rollHeight}
              />
            )}

            {/* Drag preview for note creation */}
            {isDragging && dragStart && (
              <div
                className="absolute bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60 rounded-sm pointer-events-none shadow-lg"
                style={{
                  left: `${dragStart.x - (visibleStartBeat * gridSettings.pixelsPerBeat)}px`,
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
                  left: `${Math.min(boxSelectStart.x, boxSelectCurrent.x) - (visibleStartBeat * gridSettings.pixelsPerBeat)}px`,
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
