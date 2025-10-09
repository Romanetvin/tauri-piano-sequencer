// Core data structures for the piano player application

export interface Note {
  id: string;
  pitch: number;        // MIDI note number (0-127)
  startTime: number;    // In beats
  duration: number;     // In beats
  velocity: number;     // Volume (0-127)
  trackId: string;      // Track this note belongs to
}

export interface Track {
  id: string;
  name: string;
  tempo: number;        // BPM (beats per minute)
  color: string;        // Color for visual distinction
  volume: number;       // 0-1
  muted: boolean;
  solo: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;  // In beats
  volume: number;       // Master volume 0-1
}

export interface GridSettings {
  snapToGrid: boolean;
  gridDivision: number; // 4 = quarter note, 8 = eighth note, etc.
  pixelsPerBeat: number;
  noteHeight: number;   // Height of each note row in pixels
}

export interface ProjectData {
  notes: Note[];
  tracks: Track[];
  name: string;
  createdAt: string;
}

export interface ViewSettings {
  zoomHorizontal: number;  // Horizontal zoom level
  zoomVertical: number;    // Vertical zoom level
  scrollX: number;         // Horizontal scroll position
  scrollY: number;         // Vertical scroll position
  minOctave: number;       // Minimum visible octave
  maxOctave: number;       // Maximum visible octave
}
