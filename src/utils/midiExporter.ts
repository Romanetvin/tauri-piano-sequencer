import { Midi } from '@tonejs/midi';
import { Note, Track } from '../types';

/**
 * Convert beats to time in seconds based on tempo
 * @param beats Time in beats
 * @param tempo Tempo in BPM
 * @returns Time in seconds
 */
function beatsToTime(beats: number, tempo: number): number {
  // seconds = (beats * 60) / BPM
  return (beats * 60) / tempo;
}

/**
 * Export project to MIDI file
 * @param notes Array of notes to export
 * @param tracks Array of tracks
 * @param projectName Optional project name for the file
 */
export function exportToMidi(
  notes: Note[],
  tracks: Track[],
  projectName?: string
): void {
  // Create a new MIDI file
  const midi = new Midi();

  // Set header info - use the first track's tempo or default to 120
  const defaultTempo = tracks[0]?.tempo || 120;
  midi.header.setTempo(defaultTempo);

  // Group notes by track
  const notesByTrack = new Map<string, Note[]>();
  notes.forEach(note => {
    if (!notesByTrack.has(note.trackId)) {
      notesByTrack.set(note.trackId, []);
    }
    notesByTrack.get(note.trackId)!.push(note);
  });

  // Create MIDI tracks
  tracks.forEach(track => {
    const trackNotes = notesByTrack.get(track.id) || [];

    // Skip empty tracks
    if (trackNotes.length === 0) return;

    // Add track to MIDI
    const midiTrack = midi.addTrack();
    midiTrack.name = track.name;

    // Add notes to track
    trackNotes.forEach(note => {
      // Convert beats to time using the track's tempo
      const time = beatsToTime(note.startTime, track.tempo);
      const duration = beatsToTime(note.duration, track.tempo);

      // Add note to MIDI track
      midiTrack.addNote({
        midi: note.pitch, // MIDI note number (0-127)
        time: time, // Start time in seconds
        duration: duration, // Duration in seconds
        velocity: note.velocity / 127, // Normalize 0-127 to 0-1
      });
    });
  });

  // Convert MIDI to array buffer
  const arrayBuffer = midi.toArray();

  // Create blob and download
  const blob = new Blob([arrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);

  const fileName = projectName
    ? `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.mid`
    : `piano_project_${Date.now()}.mid`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
