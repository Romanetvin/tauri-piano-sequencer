import React from 'react';
import { beatsToPixels, beatsToTimeString } from '../utils/noteUtils';

interface TimeRulerProps {
  totalBeats: number;
  pixelsPerBeat: number;
  beatsPerMeasure?: number;
  onSeek?: (beat: number) => void;
  startBeat?: number; // Starting beat offset for pagination
}

const TimeRuler: React.FC<TimeRulerProps> = ({
  totalBeats,
  pixelsPerBeat,
  beatsPerMeasure = 4,
  onSeek,
  startBeat = 0,
}) => {
  const rulerWidth = beatsToPixels(totalBeats, pixelsPerBeat);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const beat = (x / pixelsPerBeat);
    onSeek?.(beat);
  };

  return (
    <div
      className="relative bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 cursor-pointer select-none"
      style={{ width: `${rulerWidth}px`, height: '36px' }}
      onClick={handleClick}
    >
      {/* Measure markers - show only first 4 measures */}
      {Array.from({ length: 4 }, (_, i) => {
        const relativeBeat = i * beatsPerMeasure;
        if (relativeBeat >= totalBeats) return null;

        const absoluteBeat = startBeat + relativeBeat;
        const x = beatsToPixels(relativeBeat, pixelsPerBeat);
        const timeString = beatsToTimeString(absoluteBeat, beatsPerMeasure);

        return (
          <div
            key={`measure-${i}`}
            className="absolute top-0 h-full"
            style={{ left: `${x}px` }}
          >
            {/* Measure line */}
            <div className="absolute top-0 bottom-0 w-px bg-gray-500 dark:bg-gray-600"></div>
            {/* Measure number */}
            <div className="absolute top-1.5 left-2 text-xs text-gray-600 dark:text-gray-400 font-mono font-semibold">
              {timeString}
            </div>
          </div>
        );
      })}

      {/* Beat markers (subdivision lines) with beat numbers */}
      {Array.from({ length: Math.ceil(totalBeats) }, (_, i) => {
        // Skip measure boundaries (already drawn above)
        if (i % beatsPerMeasure === 0) return null;

        const x = beatsToPixels(i, pixelsPerBeat);
        const absoluteBeat = startBeat + i;
        const beatInMeasure = (absoluteBeat % beatsPerMeasure) + 1;

        return (
          <div
            key={`beat-${i}`}
            className="absolute top-0 h-full"
            style={{ left: `${x}px` }}
          >
            <div className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 opacity-50"></div>
            {/* Beat number within measure */}
            <div className="absolute top-1.5 left-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              {beatInMeasure}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimeRuler;
