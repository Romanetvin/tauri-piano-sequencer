export interface KeyMapping {
  key: string;
  note: string;
  pitch: number;
  isBlack: boolean;
}

export type KeyboardLayout = 'qwerty' | 'azerty' | 'bepo';

// QWERTY keyboard layout
export const qwertyLayout: KeyMapping[] = [
  // Bottom row (lower octave C3-B3)
  { key: 'z', note: 'C3', pitch: 48, isBlack: false },
  { key: 's', note: 'C#3', pitch: 49, isBlack: true },
  { key: 'x', note: 'D3', pitch: 50, isBlack: false },
  { key: 'd', note: 'D#3', pitch: 51, isBlack: true },
  { key: 'c', note: 'E3', pitch: 52, isBlack: false },
  { key: 'v', note: 'F3', pitch: 53, isBlack: false },
  { key: 'g', note: 'F#3', pitch: 54, isBlack: true },
  { key: 'b', note: 'G3', pitch: 55, isBlack: false },
  { key: 'h', note: 'G#3', pitch: 56, isBlack: true },
  { key: 'n', note: 'A3', pitch: 57, isBlack: false },
  { key: 'j', note: 'A#3', pitch: 58, isBlack: true },
  { key: 'm', note: 'B3', pitch: 59, isBlack: false },

  // Home row (middle octave C4-C5)
  { key: 'q', note: 'C4', pitch: 60, isBlack: false },
  { key: '2', note: 'C#4', pitch: 61, isBlack: true },
  { key: 'w', note: 'D4', pitch: 62, isBlack: false },
  { key: '3', note: 'D#4', pitch: 63, isBlack: true },
  { key: 'e', note: 'E4', pitch: 64, isBlack: false },
  { key: 'r', note: 'F4', pitch: 65, isBlack: false },
  { key: '5', note: 'F#4', pitch: 66, isBlack: true },
  { key: 't', note: 'G4', pitch: 67, isBlack: false },
  { key: '6', note: 'G#4', pitch: 68, isBlack: true },
  { key: 'y', note: 'A4', pitch: 69, isBlack: false },
  { key: '7', note: 'A#4', pitch: 70, isBlack: true },
  { key: 'u', note: 'B4', pitch: 71, isBlack: false },
  { key: 'i', note: 'C5', pitch: 72, isBlack: false },

  // Top row extended (upper octave C5-A5)
  { key: '9', note: 'C#5', pitch: 73, isBlack: true },
  { key: 'o', note: 'D5', pitch: 74, isBlack: false },
  { key: '0', note: 'D#5', pitch: 75, isBlack: true },
  { key: 'p', note: 'E5', pitch: 76, isBlack: false },
  { key: '[', note: 'F5', pitch: 77, isBlack: false },
  { key: '=', note: 'F#5', pitch: 78, isBlack: true },
  { key: ']', note: 'G5', pitch: 79, isBlack: false },
];

// AZERTY keyboard layout
export const azertyLayout: KeyMapping[] = [
  // Bottom row (lower octave C3-B3)
  { key: 'w', note: 'C3', pitch: 48, isBlack: false },
  { key: 's', note: 'C#3', pitch: 49, isBlack: true },
  { key: 'x', note: 'D3', pitch: 50, isBlack: false },
  { key: 'd', note: 'D#3', pitch: 51, isBlack: true },
  { key: 'c', note: 'E3', pitch: 52, isBlack: false },
  { key: 'v', note: 'F3', pitch: 53, isBlack: false },
  { key: 'g', note: 'F#3', pitch: 54, isBlack: true },
  { key: 'b', note: 'G3', pitch: 55, isBlack: false },
  { key: 'h', note: 'G#3', pitch: 56, isBlack: true },
  { key: 'n', note: 'A3', pitch: 57, isBlack: false },
  { key: 'j', note: 'A#3', pitch: 58, isBlack: true },
  { key: ',', note: 'B3', pitch: 59, isBlack: false },

  // Home row (middle octave C4-C5)
  { key: 'a', note: 'C4', pitch: 60, isBlack: false },
  { key: 'é', note: 'C#4', pitch: 61, isBlack: true },
  { key: 'z', note: 'D4', pitch: 62, isBlack: false },
  { key: '"', note: 'D#4', pitch: 63, isBlack: true },
  { key: 'e', note: 'E4', pitch: 64, isBlack: false },
  { key: 'r', note: 'F4', pitch: 65, isBlack: false },
  { key: '(', note: 'F#4', pitch: 66, isBlack: true },
  { key: 't', note: 'G4', pitch: 67, isBlack: false },
  { key: '-', note: 'G#4', pitch: 68, isBlack: true },
  { key: 'y', note: 'A4', pitch: 69, isBlack: false },
  { key: 'è', note: 'A#4', pitch: 70, isBlack: true },
  { key: 'u', note: 'B4', pitch: 71, isBlack: false },
  { key: 'i', note: 'C5', pitch: 72, isBlack: false },

  // Top row extended (upper octave C5-A5)
  { key: 'ç', note: 'C#5', pitch: 73, isBlack: true },
  { key: 'o', note: 'D5', pitch: 74, isBlack: false },
  { key: 'à', note: 'D#5', pitch: 75, isBlack: true },
  { key: 'p', note: 'E5', pitch: 76, isBlack: false },
  { key: '^', note: 'F5', pitch: 77, isBlack: false },
  { key: '=', note: 'F#5', pitch: 78, isBlack: true },
  { key: '$', note: 'G5', pitch: 79, isBlack: false },
];

// BÉPO keyboard layout
export const bepoLayout: KeyMapping[] = [
  // Bottom row (lower octave C3-B3)
  { key: 'ê', note: 'C3', pitch: 48, isBlack: false },
  { key: '"', note: 'C#3', pitch: 49, isBlack: true },
  { key: 'à', note: 'D3', pitch: 50, isBlack: false },
  { key: '1', note: 'D#3', pitch: 51, isBlack: true },
  { key: 'y', note: 'E3', pitch: 52, isBlack: false },
  { key: 'x', note: 'F3', pitch: 53, isBlack: false },
  { key: '2', note: 'F#3', pitch: 54, isBlack: true },
  { key: '.', note: 'G3', pitch: 55, isBlack: false },
  { key: '3', note: 'G#3', pitch: 56, isBlack: true },
  { key: 'k', note: 'A3', pitch: 57, isBlack: false },
  { key: '4', note: 'A#3', pitch: 58, isBlack: true },
  { key: "'", note: 'B3', pitch: 59, isBlack: false },

  // Home row (middle octave C4-C5)
  { key: 'a', note: 'C4', pitch: 60, isBlack: false },
  { key: 'b', note: 'C#4', pitch: 61, isBlack: true },
  { key: 'u', note: 'D4', pitch: 62, isBlack: false },
  { key: 'é', note: 'D#4', pitch: 63, isBlack: true },
  { key: 'i', note: 'E4', pitch: 64, isBlack: false },
  { key: 'e', note: 'F4', pitch: 65, isBlack: false },
  { key: 'p', note: 'F#4', pitch: 66, isBlack: true },
  { key: ',', note: 'G4', pitch: 67, isBlack: false },
  { key: 'o', note: 'G#4', pitch: 68, isBlack: true },
  { key: 'c', note: 'A4', pitch: 69, isBlack: false },
  { key: 'è', note: 'A#4', pitch: 70, isBlack: true },
  { key: 't', note: 'B4', pitch: 71, isBlack: false },
  { key: 's', note: 'C5', pitch: 72, isBlack: false },

  // Top row extended (upper octave C5-A5)
  { key: '^', note: 'C#5', pitch: 73, isBlack: true },
  { key: 'r', note: 'D5', pitch: 74, isBlack: false },
  { key: 'v', note: 'D#5', pitch: 75, isBlack: true },
  { key: 'n', note: 'E5', pitch: 76, isBlack: false },
  { key: 'm', note: 'F5', pitch: 77, isBlack: false },
  { key: 'd', note: 'F#5', pitch: 78, isBlack: true },
  { key: 'ç', note: 'G5', pitch: 79, isBlack: false },
  { key: 'l', note: 'G#5', pitch: 80, isBlack: true },
  { key: 'q', note: 'A5', pitch: 81, isBlack: false },
];

export function getKeyboardLayout(layout: KeyboardLayout): KeyMapping[] {
  switch (layout) {
    case 'qwerty':
      return qwertyLayout;
    case 'azerty':
      return azertyLayout;
    case 'bepo':
      return bepoLayout;
    default:
      return bepoLayout;
  }
}

export function getLayoutName(layout: KeyboardLayout): string {
  switch (layout) {
    case 'qwerty':
      return 'QWERTY';
    case 'azerty':
      return 'AZERTY';
    case 'bepo':
      return 'BÉPO';
    default:
      return 'BÉPO';
  }
}
