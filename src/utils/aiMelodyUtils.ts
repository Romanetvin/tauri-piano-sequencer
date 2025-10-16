import { Note, MelodyGenerationResponse, GridSettings } from '../types';
import { generateNoteId } from './noteUtils';

/**
 * Convert AI-generated melody response to Note[] format and merge with existing notes
 */
export function importAIMelody(
  response: MelodyGenerationResponse,
  trackId: string,
  overlay: boolean,
  existingNotes: Note[]
): Note[] {
  // Convert AI notes to app Note format with proper IDs
  const aiNotes: Note[] = response.notes.map(note => ({
    id: generateNoteId(),
    pitch: note.pitch,
    startTime: note.startTime,
    duration: note.duration,
    velocity: note.velocity,
    trackId,
  }));

  // Validate notes
  const validatedNotes = validateAIMelody(aiNotes);

  if (overlay) {
    // Overlay: Add to existing notes
    return [...existingNotes, ...validatedNotes];
  } else {
    // Replace: Use only AI notes
    return validatedNotes;
  }
}

/**
 * Validate AI-generated melody notes
 */
export function validateAIMelody(notes: Note[]): Note[] {
  return notes.filter(note => {
    // Check pitch range
    if (note.pitch < 0 || note.pitch > 127) {
      console.warn(`Invalid pitch ${note.pitch}, skipping note`);
      return false;
    }

    // Check start time
    if (note.startTime < 0) {
      console.warn(`Invalid start time ${note.startTime}, skipping note`);
      return false;
    }

    // Check duration
    if (note.duration <= 0) {
      console.warn(`Invalid duration ${note.duration}, skipping note`);
      return false;
    }

    // Check velocity
    if (note.velocity < 0 || note.velocity > 127) {
      console.warn(`Invalid velocity ${note.velocity}, clamping to 0-127`);
      note.velocity = Math.max(0, Math.min(127, note.velocity));
    }

    return true;
  });
}

/**
 * Quantize notes to the grid
 */
export function quantizeToGrid(notes: Note[], gridSettings: GridSettings): Note[] {
  if (!gridSettings.snapToGrid) {
    return notes;
  }

  const beatsPerDivision = 4 / gridSettings.gridDivision;

  return notes.map(note => {
    // Quantize start time
    const quantizedStartTime =
      Math.round(note.startTime / beatsPerDivision) * beatsPerDivision;

    // Quantize duration
    const quantizedDuration =
      Math.max(1, Math.round(note.duration / beatsPerDivision)) * beatsPerDivision;

    return {
      ...note,
      startTime: quantizedStartTime,
      duration: quantizedDuration,
    };
  });
}

/**
 * Calculate total duration of a melody in beats
 */
export function calculateMelodyDuration(notes: Note[]): number {
  if (notes.length === 0) return 0;

  return Math.max(...notes.map(note => note.startTime + note.duration));
}

/**
 * Check if melody fits within specified measures
 */
export function melodyFitsInMeasures(notes: Note[], measures: number): boolean {
  const totalBeats = measures * 4; // Assuming 4/4 time
  const melodyDuration = calculateMelodyDuration(notes);
  return melodyDuration <= totalBeats;
}

/**
 * Get statistics about the melody
 */
export interface MelodyStats {
  noteCount: number;
  duration: number;
  lowestNote: number;
  highestNote: number;
  averageVelocity: number;
}

export function getMelodyStats(notes: Note[]): MelodyStats {
  if (notes.length === 0) {
    return {
      noteCount: 0,
      duration: 0,
      lowestNote: 0,
      highestNote: 0,
      averageVelocity: 0,
    };
  }

  const pitches = notes.map(n => n.pitch);
  const velocities = notes.map(n => n.velocity);

  return {
    noteCount: notes.length,
    duration: calculateMelodyDuration(notes),
    lowestNote: Math.min(...pitches),
    highestNote: Math.max(...pitches),
    averageVelocity: Math.round(
      velocities.reduce((sum, v) => sum + v, 0) / velocities.length
    ),
  };
}
