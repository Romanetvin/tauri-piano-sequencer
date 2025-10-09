import React, { useState, useEffect } from 'react';
import { Note as NoteType, GridSettings } from '../types';
import { beatsToPixels, midiToNoteName, durationToString, pixelsToBeats, snapToGrid } from '../utils/noteUtils';

interface NoteProps {
  note: NoteType;
  noteHeight: number;
  pixelsPerBeat: number;
  yPosition: number;
  isSelected?: boolean;
  onSelect?: (noteId: string) => void;
  onMove?: (noteId: string, newPitch: number, newStartTime: number) => void;
  onResize?: (noteId: string, newDuration: number) => void;
  gridSettings?: GridSettings;
  trackColor?: string;
}

const Note: React.FC<NoteProps> = ({
  note,
  noteHeight,
  pixelsPerBeat,
  yPosition,
  isSelected = false,
  onSelect,
  onMove,
  onResize,
  gridSettings,
  trackColor = '#6366f1',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [originalDuration, setOriginalDuration] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [originalStartTime, setOriginalStartTime] = useState(0);
  const [originalPitch, setOriginalPitch] = useState(0);

  const x = beatsToPixels(note.startTime, pixelsPerBeat);
  const width = beatsToPixels(note.duration, pixelsPerBeat);

  // Handle resize mouse events
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      const deltaDuration = pixelsToBeats(deltaX, pixelsPerBeat);
      let newDuration = originalDuration + deltaDuration;

      // Apply grid snapping if enabled
      if (gridSettings?.snapToGrid) {
        newDuration = snapToGrid(newDuration, gridSettings.gridDivision);
      }

      // Minimum duration
      newDuration = Math.max(newDuration, 0.25);

      if (onResize && newDuration !== note.duration) {
        onResize(note.id, newDuration);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, originalDuration, note.id, note.duration, pixelsPerBeat, onResize, gridSettings]);

  // Handle drag (move) mouse events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      // Calculate new startTime (horizontal movement)
      const deltaTime = pixelsToBeats(deltaX, pixelsPerBeat);
      let newStartTime = originalStartTime + deltaTime;

      // Apply grid snapping if enabled
      if (gridSettings?.snapToGrid) {
        newStartTime = snapToGrid(newStartTime, gridSettings.gridDivision);
      }

      // Ensure non-negative start time
      newStartTime = Math.max(0, newStartTime);

      // Calculate new pitch (vertical movement)
      const pitchDelta = -Math.round(deltaY / noteHeight); // Negative because Y axis is inverted
      let newPitch = originalPitch + pitchDelta;

      // Constrain pitch to valid range
      newPitch = Math.max(21, Math.min(108, newPitch));

      if (onMove && (newStartTime !== note.startTime || newPitch !== note.pitch)) {
        onMove(note.id, newPitch, newStartTime);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartY, originalStartTime, originalPitch, note.id, note.startTime, note.pitch, pixelsPerBeat, noteHeight, onMove, gridSettings]);

  // Use track color with velocity-based intensity
  const velocityPercent = (note.velocity / 127) * 100;
  const opacity = 0.7 + (velocityPercent / 100) * 0.3; // 0.7 to 1.0

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      setIsResizing(true);
    } else {
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setOriginalStartTime(note.startTime);
      setOriginalPitch(note.pitch);
      setIsDragging(true);
      onSelect?.(note.id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(note.id);
  };

  const tooltip = (
    <div className="absolute z-10 bg-gray-800 border border-gray-700 text-gray-100 text-xs px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap shadow-lg backdrop-blur-sm">
      <span className="font-semibold">{midiToNoteName(note.pitch)}</span> • {durationToString(note.duration)} • vel: {note.velocity}
    </div>
  );

  return (
    <>
      <div
        className={`
          absolute rounded-md cursor-move transition-all duration-200
          ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/50' : 'shadow-md'}
          ${isDragging || isResizing ? 'opacity-70 scale-95' : 'opacity-95 hover:opacity-100 hover:shadow-lg'}
        `}
        style={{
          left: `${x}px`,
          top: `${yPosition}px`,
          width: `${Math.max(width, 4)}px`,
          height: `${noteHeight - 2}px`,
          backgroundColor: trackColor,
          opacity: opacity,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-md pointer-events-none" />

        {/* Resize handle on the right edge */}
        <div
          className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30 rounded-r-md transition-colors"
          onMouseDown={(e) => {
            e.stopPropagation();
            setResizeStartX(e.clientX);
            setOriginalDuration(note.duration);
            setIsResizing(true);
          }}
        />

        {/* Tooltip */}
        {showTooltip && !isDragging && !isResizing && (
          <div
            className="absolute left-0 whitespace-nowrap"
            style={{
              top: `${-noteHeight - 8}px`,
            }}
          >
            {tooltip}
          </div>
        )}
      </div>
    </>
  );
};

export default Note;
