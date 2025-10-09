import { Midi } from '@tonejs/midi';
import { Note, Track } from '../types';
import { ProjectFile } from './projectUtils';

// Color palette for auto-assigning track colors
const TRACK_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

/**
 * Parse a MIDI file and convert it to the app's ProjectFile format
 */
export async function parseMidiFile(file: File): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const midi = new Midi(arrayBuffer);

        // Convert MIDI tracks to app tracks
        const tracks: Track[] = [];
        const notes: Note[] = [];

        midi.tracks.forEach((midiTrack, index) => {
          // Skip empty tracks
          if (midiTrack.notes.length === 0) return;

          // Create track
          const trackId = crypto.randomUUID();
          const track: Track = {
            id: trackId,
            name: midiTrack.name || `Track ${index + 1}`,
            tempo: Math.round(midi.header.tempos[0]?.bpm || 120), // Use first tempo or default
            color: TRACK_COLORS[index % TRACK_COLORS.length],
            volume: 0.7,
            muted: false,
            solo: false,
          };
          tracks.push(track);

          // Convert MIDI notes to app notes
          midiTrack.notes.forEach((midiNote) => {
            const note: Note = {
              id: crypto.randomUUID(),
              pitch: midiNote.midi, // MIDI note number (0-127)
              startTime: timeToBeats(midiNote.time, track.tempo), // Convert seconds to beats
              duration: timeToBeats(midiNote.duration, track.tempo), // Convert seconds to beats
              velocity: Math.round(midiNote.velocity * 127), // Normalize 0-1 to 0-127
              trackId: trackId,
            };
            notes.push(note);
          });
        });

        // Ensure we have at least one track
        if (tracks.length === 0) {
          throw new Error('MIDI file contains no note data');
        }

        const projectFile: ProjectFile = {
          name: file.name.replace(/\.(mid|midi)$/i, ''),
          createdAt: new Date().toISOString(),
          tracks,
          notes,
          keyboardLayout: 'bepo', // Default layout
          keyMappings: [], // Will use default mappings
          version: '2.0.0',
        };

        resolve(projectFile);
      } catch (error) {
        reject(new Error(`Failed to parse MIDI file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read MIDI file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert time in seconds to beats based on tempo
 * @param timeInSeconds Time in seconds
 * @param tempo Tempo in BPM
 * @returns Time in beats
 */
function timeToBeats(timeInSeconds: number, tempo: number): number {
  // beats = (seconds * BPM) / 60
  return (timeInSeconds * tempo) / 60;
}

/**
 * Check if a file is a MIDI file based on extension
 */
export function isMidiFile(file: File): boolean {
  return /\.(mid|midi)$/i.test(file.name);
}
