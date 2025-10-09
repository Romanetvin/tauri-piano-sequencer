import { Note, ProjectData, Track } from '../types';
import { KeyMapping } from '../components/KeyboardGuide';
import { isMidiFile, parseMidiFile } from './midiParser';
import { exportToMidi } from './midiExporter';

export interface ProjectFile {
  name: string;
  createdAt: string;
  tracks: Track[];
  notes: Note[];
  keyboardLayout: string;
  keyMappings: KeyMapping[];
  version: string;
}

export type ExportFormat = 'midi' | 'json';

/**
 * Export project data to JSON file
 */
export function exportToJson(
  notes: Note[],
  tracks: Track[],
  keyMappings: KeyMapping[],
  projectName?: string
): void {
  const project: ProjectFile = {
    name: projectName || `Piano Project ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    tracks,
    notes,
    keyboardLayout: 'bepo',
    keyMappings,
    version: '2.0.0',
  };

  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export project with format selection (MIDI is default)
 */
export function exportProject(
  notes: Note[],
  tracks: Track[],
  keyMappings: KeyMapping[],
  projectName?: string,
  format: ExportFormat = 'midi'
): void {
  if (format === 'json') {
    exportToJson(notes, tracks, keyMappings, projectName);
  } else {
    exportToMidi(notes, tracks, projectName);
  }
}

/**
 * Import project from JSON or MIDI file
 */
export async function importProject(file: File): Promise<ProjectFile> {
  // Check if it's a MIDI file
  if (isMidiFile(file)) {
    return parseMidiFile(file);
  }

  // Otherwise, parse as JSON
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const project = JSON.parse(content) as ProjectFile;

        // Validate project structure
        if (!project.notes || !Array.isArray(project.notes)) {
          throw new Error('Invalid project file: missing notes array');
        }

        if (!project.tracks || !Array.isArray(project.tracks)) {
          throw new Error('Invalid project file: missing tracks array');
        }

        // Validate each track
        project.tracks.forEach((track, index) => {
          if (
            typeof track.id !== 'string' ||
            typeof track.name !== 'string' ||
            typeof track.tempo !== 'number' ||
            typeof track.color !== 'string' ||
            typeof track.volume !== 'number'
          ) {
            throw new Error(`Invalid track at index ${index}`);
          }
        });

        // Validate each note
        project.notes.forEach((note, index) => {
          if (
            typeof note.pitch !== 'number' ||
            typeof note.startTime !== 'number' ||
            typeof note.duration !== 'number' ||
            typeof note.velocity !== 'number' ||
            typeof note.trackId !== 'string'
          ) {
            throw new Error(`Invalid note at index ${index}`);
          }
        });

        resolve(project);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate imported project data
 */
export function validateProject(project: ProjectFile): boolean {
  if (!project.notes || !Array.isArray(project.notes)) return false;
  if (!project.tracks || !Array.isArray(project.tracks)) return false;

  // Validate tracks
  const tracksValid = project.tracks.every(track =>
    typeof track.id === 'string' &&
    typeof track.name === 'string' &&
    typeof track.tempo === 'number' &&
    typeof track.color === 'string' &&
    typeof track.volume === 'number' &&
    track.tempo > 0 &&
    track.volume >= 0 && track.volume <= 1
  );

  if (!tracksValid) return false;

  // Validate notes
  return project.notes.every(note =>
    typeof note.pitch === 'number' &&
    typeof note.startTime === 'number' &&
    typeof note.duration === 'number' &&
    typeof note.velocity === 'number' &&
    typeof note.trackId === 'string' &&
    note.pitch >= 0 && note.pitch <= 127 &&
    note.startTime >= 0 &&
    note.duration > 0 &&
    note.velocity >= 0 && note.velocity <= 127
  );
}
