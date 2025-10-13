// Utility functions for musical scales

// Available root notes
export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type RootNote = typeof ROOT_NOTES[number];
export type ScaleMode = 'major' | 'minor';

// Scale intervals (semitones from root)
const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],  // Ionian mode (W-W-H-W-W-W-H)
  minor: [0, 2, 3, 5, 7, 8, 10],  // Natural minor (W-H-W-W-H-W-W)
};

/**
 * Convert note name to semitone offset (0-11)
 * @param noteName Note name (e.g., "C", "C#", "D")
 * @returns Semitone offset from C (0-11)
 */
function noteNameToSemitone(noteName: string): number {
  return ROOT_NOTES.indexOf(noteName as RootNote);
}

/**
 * Get all MIDI pitches in a given scale across the piano range
 * @param root Root note of the scale (e.g., "C", "D#")
 * @param mode Scale mode ("major" or "minor")
 * @returns Set of MIDI pitch numbers (21-108) that belong to the scale
 */
export function getScaleNotes(root: RootNote, mode: ScaleMode): Set<number> {
  const rootSemitone = noteNameToSemitone(root);
  const intervals = SCALE_INTERVALS[mode];
  const scaleNotes = new Set<number>();

  // Piano range: A0 (21) to C8 (108)
  const minPitch = 21;
  const maxPitch = 108;

  // Generate all scale notes across the piano range
  for (let pitch = minPitch; pitch <= maxPitch; pitch++) {
    const pitchClass = pitch % 12; // Get note within octave (0-11)
    const relativeToRoot = (pitchClass - rootSemitone + 12) % 12; // Offset from root

    if (intervals.includes(relativeToRoot)) {
      scaleNotes.add(pitch);
    }
  }

  return scaleNotes;
}

/**
 * Get a human-readable name for a scale
 * @param root Root note
 * @param mode Scale mode
 * @returns Scale name (e.g., "C Major", "D# Minor")
 */
export function getScaleName(root: RootNote, mode: ScaleMode): string {
  const modeName = mode.charAt(0).toUpperCase() + mode.slice(1);
  return `${root} ${modeName}`;
}
