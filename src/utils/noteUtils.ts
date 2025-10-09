// Utility functions for note and MIDI conversions

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert MIDI note number to note name with octave
 * @param pitch MIDI note number (0-127)
 * @returns Note name with octave (e.g., "C4", "A#5")
 */
export function midiToNoteName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  const noteIndex = pitch % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Convert note name with octave to MIDI note number
 * @param noteName Note name with octave (e.g., "C4", "A#5")
 * @returns MIDI note number (0-127)
 */
export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60; // Default to middle C

  const [, note, octave] = match;
  const noteIndex = NOTE_NAMES.indexOf(note);
  return (parseInt(octave) + 1) * 12 + noteIndex;
}

/**
 * Get the frequency of a MIDI note
 * @param pitch MIDI note number (0-127)
 * @returns Frequency in Hz
 */
export function midiToFrequency(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

/**
 * Check if a MIDI note is a black key (sharp/flat)
 * @param pitch MIDI note number (0-127)
 * @returns true if black key, false if white key
 */
export function isBlackKey(pitch: number): boolean {
  const noteIndex = pitch % 12;
  return [1, 3, 6, 8, 10].includes(noteIndex);
}

/**
 * Snap a time value to the nearest grid division
 * @param time Time in beats
 * @param gridDivision Grid division (4 = quarter note, 8 = eighth note, etc.)
 * @returns Snapped time value
 */
export function snapToGrid(time: number, gridDivision: number): number {
  const snapValue = 1 / gridDivision;
  return Math.round(time / snapValue) * snapValue;
}

/**
 * Convert beats to pixels based on zoom level
 * @param beats Time in beats
 * @param pixelsPerBeat Zoom level (pixels per beat)
 * @returns Position in pixels
 */
export function beatsToPixels(beats: number, pixelsPerBeat: number): number {
  return beats * pixelsPerBeat;
}

/**
 * Convert pixels to beats based on zoom level
 * @param pixels Position in pixels
 * @param pixelsPerBeat Zoom level (pixels per beat)
 * @returns Time in beats
 */
export function pixelsToBeats(pixels: number, pixelsPerBeat: number): number {
  return pixels / pixelsPerBeat;
}

/**
 * Convert MIDI pitch to Y position in piano roll
 * @param pitch MIDI note number (0-127)
 * @param noteHeight Height of each note row
 * @param minPitch Minimum visible pitch (default 21 = A0)
 * @returns Y position in pixels
 */
export function pitchToY(pitch: number, noteHeight: number, minPitch: number = 21): number {
  const maxPitch = 108; // C8
  // Invert Y axis (higher notes at top)
  return (maxPitch - pitch) * noteHeight;
}

/**
 * Convert Y position to MIDI pitch
 * @param y Y position in pixels
 * @param noteHeight Height of each note row
 * @param minPitch Minimum visible pitch (default 21 = A0)
 * @returns MIDI note number
 */
export function yToPitch(y: number, noteHeight: number, minPitch: number = 21): number {
  const maxPitch = 108; // C8
  const pitch = maxPitch - Math.floor(y / noteHeight);
  return Math.max(minPitch, Math.min(maxPitch, pitch));
}

/**
 * Generate a unique ID for a note
 * @returns Unique ID string
 */
export function generateNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert beats to time string (measures:beats)
 * @param beats Time in beats
 * @param beatsPerMeasure Number of beats per measure (usually 4)
 * @returns Time string (e.g., "1:3")
 */
export function beatsToTimeString(beats: number, beatsPerMeasure: number = 4): string {
  const measure = Math.floor(beats / beatsPerMeasure) + 1;
  const beat = Math.floor(beats % beatsPerMeasure) + 1;
  return `${measure}:${beat}`;
}

/**
 * Convert duration in beats to a readable string
 * @param duration Duration in beats
 * @returns Duration string (e.g., "1/4", "1/2", "1 bar")
 */
export function durationToString(duration: number): string {
  if (duration >= 4) return `${duration / 4} bar${duration > 4 ? 's' : ''}`;
  if (duration >= 1) return `${duration} beat${duration > 1 ? 's' : ''}`;
  const fraction = 1 / duration;
  return `1/${fraction}`;
}
