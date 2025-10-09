import React from 'react';

interface SettingsPanelProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  soundMode: 'piano' | 'synthesizer';
  onSoundModeChange: (mode: 'piano' | 'synthesizer') => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  volume,
  onVolumeChange,
  soundMode,
  onSoundModeChange,
}) => {
  return (
    <div className="flex items-center gap-6">
      {/* Sound Mode Toggle */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
          Sound
        </label>
        <button
          onClick={() => onSoundModeChange(soundMode === 'piano' ? 'synthesizer' : 'piano')}
          className="relative w-24 h-8 bg-gray-100 dark:bg-gray-800 rounded-full p-1 transition-colors duration-300"
          title={`Current mode: ${soundMode === 'piano' ? 'Piano' : 'Synthesizer'}`}
        >
          <div
            className={`absolute top-1 left-1 w-10 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg transition-transform duration-300 ${
              soundMode === 'synthesizer' ? 'translate-x-12' : 'translate-x-0'
            }`}
          />
          <div className="relative flex justify-between items-center h-full px-2">
            <span className={`text-xs font-bold transition-colors ${soundMode === 'piano' ? 'text-white' : 'text-gray-500 dark:text-gray-600'}`}>
              🎹
            </span>
            <span className={`text-xs font-bold transition-colors ${soundMode === 'synthesizer' ? 'text-white' : 'text-gray-500 dark:text-gray-600'}`}>
              🎛️
            </span>
          </div>
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-500 font-medium w-24">
          {soundMode === 'piano' ? 'Piano' : 'Synthesizer'}
        </span>
      </div>

      {/* Master Volume Control */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
          Volume
        </label>
        <div className="relative w-28">
          <input
            type="range"
            value={volume * 100}
            onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
            min="0"
            max="100"
            className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-gradient-to-r
                       [&::-webkit-slider-thumb]:from-indigo-500
                       [&::-webkit-slider-thumb]:to-purple-500
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:transition-transform
                       [&::-webkit-slider-thumb]:hover:scale-110
                       [&::-moz-range-thumb]:w-4
                       [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-gradient-to-r
                       [&::-moz-range-thumb]:from-indigo-500
                       [&::-moz-range-thumb]:to-purple-500
                       [&::-moz-range-thumb]:shadow-lg
                       [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:transition-transform
                       [&::-moz-range-thumb]:hover:scale-110"
            style={{
              background: `linear-gradient(to right, rgb(99 102 241) ${volume * 100}%, rgb(26 26 36) ${volume * 100}%)`
            }}
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-500 font-mono w-10 text-right font-medium">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
};

export default SettingsPanel;
