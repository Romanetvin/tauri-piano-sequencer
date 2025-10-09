import React from 'react';
import { midiToNoteName, isBlackKey } from '../utils/noteUtils';

// Keyboard mapping from pitch to keyboard letter
const pitchToKey: Record<number, string> = {
  48: 'ê', 49: '"', 50: 'à', 51: '1', 52: 'y', 53: 'x', 54: '2', 55: '.', 56: '3', 57: 'k', 58: '4', 59: "'",
  60: 'a', 61: 'b', 62: 'u', 63: 'é', 64: 'i', 65: 'e', 66: 'p', 67: ',', 68: 'o', 69: 'c', 70: 'è', 71: 't', 72: 's',
  73: '^', 74: 'r', 75: 'v', 76: 'n', 77: 'm', 78: 'd', 79: 'ç', 80: 'l', 81: 'q',
};

interface VisualPianoProps {
  minPitch?: number;
  maxPitch?: number;
  activeNotes?: Set<number>;
  onNotePlay?: (pitch: number) => void;
  onNoteStop?: (pitch: number) => void;
}

const VisualPiano: React.FC<VisualPianoProps> = ({
  minPitch = 48,   // C3
  maxPitch = 84,   // C6 - 3 octaves
  activeNotes = new Set(),
  onNotePlay,
  onNoteStop,
}) => {
  const renderKey = (pitch: number) => {
    const isBlack = isBlackKey(pitch);
    const isActive = activeNotes.has(pitch);
    const noteName = midiToNoteName(pitch);
    const noteOnly = noteName.replace(/\d/, ''); // Remove octave number
    const showLabel = noteOnly === 'C'; // Only show labels on C keys
    const keyboardKey = pitchToKey[pitch];

    if (isBlack) {
      return (
        <div
          key={pitch}
          className={`
            absolute z-20 cursor-pointer
            transition-all duration-100
            ${isActive
              ? 'bg-gradient-to-b from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-500/50 scale-95'
              : 'bg-gradient-to-b from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800'
            }
            border-2 border-gray-900 rounded-b-md
            shadow-md
            flex items-end justify-center pb-2
          `}
          style={{
            width: '32px',
            height: '120px',
            left: `${getBlackKeyPosition(pitch, minPitch)}px`,
          }}
          onMouseDown={() => onNotePlay?.(pitch)}
          onMouseUp={() => onNoteStop?.(pitch)}
          onMouseLeave={() => onNoteStop?.(pitch)}
          title={noteName}
        >
          {keyboardKey && (
            <div className={`text-xs font-mono ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>
              {keyboardKey}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={pitch}
        className={`
          relative cursor-pointer
          transition-all duration-100
          ${isActive
            ? 'bg-gradient-to-b from-indigo-300 to-indigo-400 shadow-inner shadow-indigo-500/50'
            : 'bg-gradient-to-b from-white to-gray-100 hover:from-gray-50 hover:to-gray-200'
          }
          border-r border-gray-300
          shadow-md
        `}
        style={{
          width: '48px',
          height: '200px',
        }}
        onMouseDown={() => onNotePlay?.(pitch)}
        onMouseUp={() => onNoteStop?.(pitch)}
        onMouseLeave={() => onNoteStop?.(pitch)}
        title={noteName}
      >
        {keyboardKey && (
          <div className={`
            absolute top-4 left-1/2 transform -translate-x-1/2
            text-xs font-mono
            ${isActive ? 'text-indigo-600' : 'text-gray-400'}
          `}>
            {keyboardKey}
          </div>
        )}
        {showLabel && (
          <div className={`
            absolute bottom-4 left-1/2 transform -translate-x-1/2
            text-xs font-bold
            ${isActive ? 'text-white' : 'text-gray-700'}
          `}>
            {noteName}
          </div>
        )}
      </div>
    );
  };

  // Calculate position for black keys
  const getBlackKeyPosition = (pitch: number, minPitch: number): number => {
    const whiteKeyWidth = 48;
    let whiteKeyCount = 0;

    for (let p = minPitch; p < pitch; p++) {
      if (!isBlackKey(p)) {
        whiteKeyCount++;
      }
    }

    // Adjust position based on the note within the octave
    const noteInOctave = pitch % 12;
    let offset = 0;

    switch (noteInOctave) {
      case 1: offset = -16; break;  // C#
      case 3: offset = -16; break;  // D#
      case 6: offset = -16; break;  // F#
      case 8: offset = -16; break;  // G#
      case 10: offset = -16; break; // A#
    }

    return whiteKeyCount * whiteKeyWidth + offset + whiteKeyWidth;
  };

  // Generate all pitches
  const pitches: number[] = [];
  for (let i = minPitch; i <= maxPitch; i++) {
    pitches.push(i);
  }

  // Separate white and black keys for proper layering
  const whiteKeys = pitches.filter(p => !isBlackKey(p));
  const blackKeys = pitches.filter(p => isBlackKey(p));

  return (
    <div className="relative bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 border-t-4 border-gray-300 dark:border-gray-700 shadow-2xl p-4 flex justify-center items-center overflow-x-auto">
      <div className="relative flex mx-auto" style={{ height: '200px', minWidth: `${whiteKeys.length * 48}px` }}>
        {/* White keys */}
        {whiteKeys.map((pitch) => renderKey(pitch))}

        {/* Black keys (rendered on top) */}
        {blackKeys.map((pitch) => renderKey(pitch))}
      </div>
    </div>
  );
};

export default VisualPiano;
