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
  onNoteResize: (noteId: string, newDuration: number) => void;
  onNoteAdd: (pitch: number, startTime: number, duration: number, velocity: number, trackId: string) => void;
  onSeek: (beat: number) => void;
  tracks: Track[];
  selectedTrackId: string;
}

const PianoRoll: React.FC<PianoRollProps> = ({
  notes,
  selectedNoteIds,
  currentBeat,
  gridSettings,
  onNoteSelect,
  onNoteMove,
  onNoteResize,
  onNoteAdd,
  onSeek,
  tracks,
  selectedTrackId,
}) => {
  const rollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

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

    setDragStart({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const rect = rollRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Visual feedback for note creation could be added here
  }, [isDragging, dragStart]);

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const rect = rollRef.current?.getBoundingClientRect();
    if (!rect) return;

    const endX = e.clientX - rect.left;
    const startX = Math.min(dragStart.x, endX);
    const width = Math.abs(endX - dragStart.x);

    const pitch = yToPitch(dragStart.y, gridSettings.noteHeight, 0);
    let startTime = pixelsToBeats(startX, gridSettings.pixelsPerBeat);
    let duration = pixelsToBeats(width, gridSettings.pixelsPerBeat);

    // Apply grid snapping
    if (gridSettings.snapToGrid) {
      startTime = snapToGrid(startTime, gridSettings.gridDivision);
      duration = snapToGrid(duration, gridSettings.gridDivision);
    }

    // Minimum duration
    duration = Math.max(duration, 0.25);

    // Add note if duration is valid
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
          <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin" id="time-ruler-scroll">
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
            />
          </div>

          {/* Piano Roll Grid Container - scrolls horizontally */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin" id="piano-roll-scroll" style={{ height: `${rollHeight}px` }}>
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
              }}
            >
            {/* Grid lines */}
            {Array.from({ length: maxPitch - minPitch + 1 }, (_, i) => {
              const pitch = maxPitch - i;
              const y = i * gridSettings.noteHeight;
              const isBlack = isBlackKey(pitch);

              return (
                <div
                  key={pitch}
                  className={`absolute left-0 right-0 border-b ${
                    isBlack
                      ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700'
                  }`}
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
                  onSelect={onNoteSelect}
                  onMove={onNoteMove}
                  onResize={onNoteResize}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
