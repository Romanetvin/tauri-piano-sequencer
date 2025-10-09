import React, { useState } from 'react';
import {
  KeyMapping,
  KeyboardLayout,
  getKeyboardLayout,
  getLayoutName,
  bepoLayout
} from '../utils/keyboardLayouts';

// Default to BÉPO for backwards compatibility
const keyMappings: KeyMapping[] = bepoLayout;

interface KeyboardGuideProps {
  activeKeys?: Set<string>;
  onClose?: () => void;
}

const KeyboardGuide: React.FC<KeyboardGuideProps> = ({ activeKeys = new Set(), onClose }) => {
  const [selectedLayout, setSelectedLayout] = useState<KeyboardLayout>('bepo');

  const currentMappings = getKeyboardLayout(selectedLayout);

  return (
    <div className="fixed bottom-6 right-6 z-50
                    bg-white/95 dark:bg-gray-900/95
                    backdrop-blur-xl
                    border border-gray-200 dark:border-gray-800
                    rounded-2xl shadow-glass-light dark:shadow-glass
                    p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Keyboard Controls
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800
                     text-gray-500 dark:text-gray-500
                     transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Layout Selector */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Keyboard Layout:
        </label>
        <div className="flex gap-2">
          {(['qwerty', 'azerty', 'bepo'] as KeyboardLayout[]).map((layout) => (
            <button
              key={layout}
              onClick={() => setSelectedLayout(layout)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedLayout === layout
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {getLayoutName(layout)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Optimized for real-time piano playing
      </p>

      {/* Keyboard Layout */}
      <div className="space-y-4">
        {/* Top Row (C5-A5) */}
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wider">
            Octave Supérieure (C5-A5)
          </div>
          <div className="flex flex-wrap gap-2">
            {currentMappings.filter(k => k.pitch >= 73).map(({ key, note, isBlack }) => (
              <div
                key={key}
                className={`
                  px-3 py-2 rounded-lg border-2 font-mono text-sm
                  transition-all duration-200
                  ${activeKeys.has(key.toLowerCase())
                    ? 'scale-95 bg-indigo-500 border-indigo-500 text-white shadow-lg'
                    : isBlack
                    ? 'bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-800 text-gray-300'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <div className="font-bold">{key}</div>
                <div className="text-xs opacity-75">{note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Home Row (C4-C5) */}
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wider">
            Octave Centrale (C4-C5) - Rangée d'Accueil
          </div>
          <div className="flex flex-wrap gap-2">
            {currentMappings.filter(k => k.pitch >= 60 && k.pitch < 73).map(({ key, note, isBlack }) => (
              <div
                key={key}
                className={`
                  px-3 py-2 rounded-lg border-2 font-mono text-sm
                  transition-all duration-200
                  ${activeKeys.has(key.toLowerCase())
                    ? 'scale-95 bg-indigo-500 border-indigo-500 text-white shadow-lg'
                    : isBlack
                    ? 'bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-800 text-gray-300'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <div className="font-bold">{key}</div>
                <div className="text-xs opacity-75">{note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row (C3-B3) */}
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wider">
            Octave Inférieure (C3-B3)
          </div>
          <div className="flex flex-wrap gap-2">
            {currentMappings.filter(k => k.pitch < 60).map(({ key, note, isBlack }) => (
              <div
                key={key}
                className={`
                  px-3 py-2 rounded-lg border-2 font-mono text-sm
                  transition-all duration-200
                  ${activeKeys.has(key.toLowerCase())
                    ? 'scale-95 bg-indigo-500 border-indigo-500 text-white shadow-lg'
                    : isBlack
                    ? 'bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-800 text-gray-300'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <div className="font-bold">{key}</div>
                <div className="text-xs opacity-75">{note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"></div>
          <span className="text-gray-500 dark:text-gray-500">White Key</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-gray-700 dark:border-gray-800 bg-gray-800 dark:bg-gray-900"></div>
          <span className="text-gray-500 dark:text-gray-500">Black Key</span>
        </div>
      </div>
    </div>
  );
};

export default KeyboardGuide;
export { keyMappings };
export type { KeyMapping };
