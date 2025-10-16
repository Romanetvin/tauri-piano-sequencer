import React from 'react';

interface SettingsPanelProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  volume,
  onVolumeChange,
}) => {
  return (
    <div className="flex items-center gap-6">
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
