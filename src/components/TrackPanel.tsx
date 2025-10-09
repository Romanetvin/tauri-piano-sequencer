import React from 'react';
import { Track } from '../types';

interface TrackPanelProps {
  tracks: Track[];
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
}

const TrackPanel: React.FC<TrackPanelProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onUpdateTrack,
  onToggleMute,
  onToggleSolo,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-4 overflow-x-auto">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`min-w-[200px] p-3 rounded-lg border-2 transition-all cursor-pointer ${
              selectedTrackId === track.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
            onClick={() => onSelectTrack(track.id)}
          >
            {/* Track Header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: track.color }}
              />
              <input
                type="text"
                value={track.name}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateTrack(track.id, { name: e.target.value });
                }}
                className="flex-1 bg-transparent border-none outline-none font-semibold text-sm text-gray-900 dark:text-gray-100"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Tempo Control */}
            <div className="mb-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Tempo</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={track.tempo}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateTrack(track.id, { tempo: parseInt(e.target.value) });
                  }}
                  min="40"
                  max="240"
                  className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">BPM</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="mb-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={track.volume * 100}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateTrack(track.id, { volume: parseInt(e.target.value) / 100 });
                }}
                className="w-full"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Mute/Solo Buttons */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute(track.id);
                }}
                className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${
                  track.muted
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                M
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSolo(track.id);
                }}
                className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${
                  track.solo
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                S
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackPanel;
