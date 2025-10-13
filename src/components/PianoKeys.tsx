import React from 'react';
import { midiToNoteName, isBlackKey } from '../utils/noteUtils';

interface PianoKeysProps {
  minPitch?: number;
  maxPitch?: number;
  noteHeight: number;
  onKeyClick?: (pitch: number) => void;
  highlightedNotes?: Set<number>;
}

const PianoKeys: React.FC<PianoKeysProps> = ({
  minPitch = 21,   // A0
  maxPitch = 108,  // C8
  noteHeight,
  onKeyClick,
  highlightedNotes,
}) => {
  const pitches: number[] = [];
  for (let i = maxPitch; i >= minPitch; i--) {
    pitches.push(i);
  }

  return (
    <div className="flex flex-col border-r-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
      {pitches.map((pitch) => {
        const noteName = midiToNoteName(pitch);
        const isBlack = isBlackKey(pitch);
        const noteOnly = noteName.replace(/\d/, ''); // Get note without octave
        const octave = noteName.match(/\d/)?.[0]; // Get octave number
        const isC = noteOnly === 'C'; // Highlight C notes
        const isInScale = highlightedNotes?.has(pitch);
        const hasScaleSelected = highlightedNotes && highlightedNotes.size > 0;

        // When scale is selected: use 2 tints (in-scale = lighter, out-of-scale = darker)
        // When no scale: use standard colors (white keys lighter, black keys darker)
        let bgClasses = '';
        if (hasScaleSelected) {
          if (isInScale) {
            // In scale: light gray (same for both white and black keys)
            bgClasses = 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-925 text-gray-800 dark:text-gray-300 hover:from-white hover:to-gray-100 dark:hover:from-gray-850 dark:hover:to-gray-875';
          } else {
            // Out of scale: darker gray (same for both white and black keys)
            bgClasses = 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-850 text-gray-600 dark:text-gray-500 hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-700 dark:hover:to-gray-750';
          }
        } else {
          // No scale selected: standard appearance
          if (isBlack) {
            bgClasses = 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-850 text-gray-700 dark:text-gray-400 hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-700 dark:hover:to-gray-750';
          } else {
            bgClasses = 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-925 text-gray-800 dark:text-gray-300 hover:from-white hover:to-gray-100 dark:hover:from-gray-850 dark:hover:to-gray-875';
          }
        }

        return (
          <div
            key={pitch}
            className={`
              flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-800
              cursor-pointer transition-all duration-200 relative
              ${bgClasses}
              ${isC ? 'border-l-4 border-l-indigo-500' : ''}
            `}
            style={{ height: `${noteHeight}px`, minWidth: '80px' }}
            onClick={() => onKeyClick?.(pitch)}
          >
            <div className="flex items-center gap-2">
              {isC && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                  <span className="text-[10px] font-bold text-indigo-500">C{octave}</span>
                </div>
              )}
            </div>
            <span className={`text-xs font-mono font-semibold ${isC ? 'text-indigo-500' : ''}`}>
              {noteName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PianoKeys;
