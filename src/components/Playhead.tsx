import React from 'react';
import { beatsToPixels } from '../utils/noteUtils';

interface PlayheadProps {
  currentBeat: number;
  pixelsPerBeat: number;
  height: number;
}

const Playhead: React.FC<PlayheadProps> = ({
  currentBeat,
  pixelsPerBeat,
  height,
}) => {
  const x = beatsToPixels(currentBeat, pixelsPerBeat);

  return (
    <div
      className="absolute top-0 pointer-events-none z-20"
      style={{
        left: `${x}px`,
        height: `${height}px`,
      }}
    >
      {/* Glow effect behind the line */}
      <div className="absolute top-0 bottom-0 w-8 -left-3.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent blur-xl animate-pulse"></div>

      {/* Vertical line with enhanced gradient and shadow */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-amber-500 to-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.8)]"></div>

      {/* Additional shine line */}
      <div className="absolute top-0 bottom-0 w-px left-0.5 bg-gradient-to-b from-white/60 via-white/30 to-transparent"></div>

      {/* Enhanced playhead triangle at top with glow */}
      <div className="absolute top-0" style={{ left: '-8px' }}>
        {/* Glow */}
        <div
          className="absolute"
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '12px solid rgba(239, 68, 68, 0.4)',
            filter: 'blur(4px)',
            transform: 'scale(1.3)',
          }}
        />
        {/* Triangle */}
        <div
          className="relative drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '12px solid #ef4444',
          }}
        />
      </div>
    </div>
  );
};

export default Playhead;
