import React from 'react';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
}) => {
  return (
    <div className="flex items-center gap-3">
      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="relative p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500
                   hover:shadow-lg hover:shadow-indigo-500/50
                   transition-all duration-300 transform hover:scale-105 active:scale-95
                   group"
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        {isPlaying ? (
          // Pause icon
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Stop Button */}
      <button
        onClick={onStop}
        className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                   border border-gray-200 dark:border-gray-800
                   transition-all duration-300 transform hover:scale-105 active:scale-95"
        title="Stop"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>
    </div>
  );
};

export default TransportControls;
