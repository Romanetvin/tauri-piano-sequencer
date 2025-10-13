import React, { useState, useRef, useEffect } from 'react';
import { ROOT_NOTES, RootNote, ScaleMode, getScaleName } from '../utils/scaleUtils';

interface ScaleSelectorProps {
  selectedScale: { root: RootNote; mode: ScaleMode } | null;
  onScaleChange: (scale: { root: RootNote; mode: ScaleMode } | null) => void;
}

const ScaleSelector: React.FC<ScaleSelectorProps> = ({ selectedScale, onScaleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleScaleSelect = (root: RootNote, mode: ScaleMode) => {
    onScaleChange({ root, mode });
    setIsOpen(false);
  };

  const handleClear = () => {
    onScaleChange(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Scale Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                   border border-gray-300 dark:border-gray-700
                   transition-all duration-300 flex items-center gap-2 min-w-[140px] justify-between"
        title="Select scale"
      >
        <div className="flex items-center gap-2">
          {/* Music Note Icon */}
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedScale ? getScaleName(selectedScale.root, selectedScale.mode) : 'No Scale'}
          </span>
        </div>
        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl
                        border border-gray-200 dark:border-gray-700 z-50 min-w-[280px] max-h-[400px] overflow-y-auto">
          {/* None Option */}
          <button
            onClick={handleClear}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
          >
            <span className="font-medium">None</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(No scale highlighting)</span>
          </button>

          {/* Scale Options - Grouped by Root Note */}
          {ROOT_NOTES.map((root) => (
            <div key={root} className="border-b border-gray-100 dark:border-gray-750 last:border-b-0">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-850">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{root}</span>
              </div>
              <div className="grid grid-cols-2">
                <button
                  onClick={() => handleScaleSelect(root, 'major')}
                  className={`px-4 py-2 text-left text-sm transition-colors
                    ${
                      selectedScale?.root === root && selectedScale?.mode === 'major'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  Major
                </button>
                <button
                  onClick={() => handleScaleSelect(root, 'minor')}
                  className={`px-4 py-2 text-left text-sm transition-colors border-l border-gray-100 dark:border-gray-750
                    ${
                      selectedScale?.root === root && selectedScale?.mode === 'minor'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  Minor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScaleSelector;
