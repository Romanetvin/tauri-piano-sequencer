import React, { useState, useEffect } from 'react';
import { Note as NoteType, GridSettings } from '../types';
import { beatsToPixels, midiToNoteName, durationToString, pixelsToBeats, snapToGrid } from '../utils/noteUtils';

interface NoteProps {
  note: NoteType;
  noteHeight: number;
  pixelsPerBeat: number;
  yPosition: number;
  isSelected?: boolean;
  selectedNoteIds?: Set<string>;
  onSelect?: (noteId: string, addToSelection?: boolean) => void;
  onMove?: (noteId: string, newPitch: number, newStartTime: number) => void;
  onMoveSelectedNotes?: (pitchDelta: number, timeDelta: number) => void;
  onResize?: (noteId: string, newDuration: number) => void;
  onDelete?: (noteId: string) => void;
  gridSettings?: GridSettings;
  trackColor?: string;
}

const Note: React.FC<NoteProps> = ({
  note,
  noteHeight,
  pixelsPerBeat,
  yPosition,
  isSelected = false,
  selectedNoteIds,
  onSelect,
  onMove,
  onMoveSelectedNotes,
  onResize,
  onDelete,
  gridSettings,
  trackColor = '#6366f1',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isRightClicking, setIsRightClicking] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [originalDuration, setOriginalDuration] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [originalStartTime, setOriginalStartTime] = useState(0);
  const [originalPitch, setOriginalPitch] = useState(0);
  const [lastAppliedPitchDelta, setLastAppliedPitchDelta] = useState(0);
  const [lastAppliedTimeDelta, setLastAppliedTimeDelta] = useState(0);

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

    const isMultiSelect = selectedNoteIds && selectedNoteIds.size > 1;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      // Calculate time delta from original position
      let deltaTime = pixelsToBeats(deltaX, pixelsPerBeat);

      // Calculate pitch delta from original position
      const pitchDelta = -Math.round(deltaY / noteHeight); // Negative because Y axis is inverted

      if (isMultiSelect && onMoveSelectedNotes) {
        // Move all selected notes together
        if (gridSettings?.snapToGrid) {
          // For multi-select, calculate the new position of this note and snap it
          let newStartTime = originalStartTime + deltaTime;
          newStartTime = snapToGrid(newStartTime, gridSettings.gridDivision);
          deltaTime = newStartTime - originalStartTime;
        }

        // Only apply if delta changed from last application
        if (pitchDelta !== lastAppliedPitchDelta || deltaTime !== lastAppliedTimeDelta) {
          // Calculate incremental delta (difference from last applied)
          const incrementalPitchDelta = pitchDelta - lastAppliedPitchDelta;
          const incrementalTimeDelta = deltaTime - lastAppliedTimeDelta;

          onMoveSelectedNotes(incrementalPitchDelta, incrementalTimeDelta);
          setLastAppliedPitchDelta(pitchDelta);
          setLastAppliedTimeDelta(deltaTime);
        }
      } else if (onMove) {
        // Move single note
        let newStartTime = originalStartTime + deltaTime;

        // Apply grid snapping if enabled
        if (gridSettings?.snapToGrid) {
          newStartTime = snapToGrid(newStartTime, gridSettings.gridDivision);
        }

        // Ensure non-negative start time
        newStartTime = Math.max(0, newStartTime);

        let newPitch = originalPitch + pitchDelta;

        // Constrain pitch to valid range
        newPitch = Math.max(21, Math.min(108, newPitch));

        if (newStartTime !== note.startTime || newPitch !== note.pitch) {
          onMove(note.id, newPitch, newStartTime);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setLastAppliedPitchDelta(0);
      setLastAppliedTimeDelta(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartY, originalStartTime, originalPitch, note.id, note.startTime, note.pitch, pixelsPerBeat, noteHeight, onMove, onMoveSelectedNotes, gridSettings, selectedNoteIds, lastAppliedPitchDelta, lastAppliedTimeDelta]);

  // Use track color with velocity-based intensity
  const velocityPercent = (note.velocity / 127) * 100;
  const opacity = 0.7 + (velocityPercent / 100) * 0.3; // 0.7 to 1.0

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Right mouse button - prepare for delete
    if (e.button === 2) {
      setIsRightClicking(true);
      return;
    }

    // Left mouse button - normal interaction
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      setIsResizing(true);
    } else {
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setOriginalStartTime(note.startTime);
      setOriginalPitch(note.pitch);
      setIsDragging(true);

      // If note is not selected, select it (with or without Cmd)
      // If note is already selected and Cmd is pressed, deselect it
      // If note is already selected and Cmd is not pressed, keep selection (allow dragging all selected)
      if (!isSelected || e.metaKey) {
        onSelect?.(note.id, e.metaKey);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(note.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRightClicking(false);
    onDelete?.(note.id);
  };

  // Add window-level listener for mouse up to clear right-click state
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsRightClicking(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const tooltip = (
    <div className="absolute z-10 bg-gray-800 border border-gray-700 text-gray-100 text-xs px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap shadow-lg backdrop-blur-sm">
      <span className="font-semibold">{midiToNoteName(note.pitch)}</span> • {durationToString(note.duration)} • vel: {note.velocity}
    </div>
  );

  return (
    <>
      <div
        className={`
          absolute rounded-md transition-all duration-200
          ${isRightClicking ? 'cursor-not-allowed' : 'cursor-move hover:cursor-pointer'}
          ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/50' : 'shadow-md'}
          ${isDragging || isResizing ? 'opacity-70 scale-95' : 'opacity-95 hover:opacity-100 hover:shadow-lg'}
          ${isRightClicking ? 'ring-2 ring-red-500 opacity-50' : ''}
        `}
        title="Left-click to select/move • Right-click to delete"
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
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          setShowTooltip(false);
          setIsRightClicking(false);
        }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-md pointer-events-none" />

        {/* Trash icon when right-clicking */}
        {isRightClicking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg className="w-6 h-6 text-red-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}

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
