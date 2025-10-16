import { useState, useCallback } from 'react';
import { Note } from '../types';
import { generateNoteId } from '../utils/noteUtils';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [copiedNotes, setCopiedNotes] = useState<Note[]>([]);

  const addNote = useCallback((pitch: number, startTime: number, duration: number, velocity: number = 100, trackId: string = 'track_default') => {
    const newNote: Note = {
      id: generateNoteId(),
      pitch,
      startTime,
      duration,
      velocity,
      trackId,
    };
    setNotes(prev => [...prev, newNote]);
    return newNote.id;
  }, []);

  const removeNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    setSelectedNoteIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(noteId);
      return newSet;
    });
  }, []);

  const removeSelectedNotes = useCallback(() => {
    setNotes(prev => prev.filter(note => !selectedNoteIds.has(note.id)));
    setSelectedNoteIds(new Set());
  }, [selectedNoteIds]);

  const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, ...updates } : note
    ));
  }, []);

  const moveNote = useCallback((noteId: string, newPitch: number, newStartTime: number) => {
    updateNote(noteId, { pitch: newPitch, startTime: Math.max(0, newStartTime) });
  }, [updateNote]);

  const moveSelectedNotes = useCallback((pitchDelta: number, timeDelta: number) => {
    setNotes(prev => prev.map(note => {
      if (selectedNoteIds.has(note.id)) {
        const newPitch = Math.max(21, Math.min(108, note.pitch + pitchDelta));
        const newStartTime = Math.max(0, note.startTime + timeDelta);
        return { ...note, pitch: newPitch, startTime: newStartTime };
      }
      return note;
    }));
  }, [selectedNoteIds]);

  const resizeNote = useCallback((noteId: string, newDuration: number) => {
    updateNote(noteId, { duration: Math.max(0.25, newDuration) });
  }, [updateNote]);

  const selectNote = useCallback((noteId: string, addToSelection: boolean = false) => {
    setSelectedNoteIds(prev => {
      if (addToSelection) {
        const newSet = new Set(prev);
        if (newSet.has(noteId)) {
          newSet.delete(noteId);
        } else {
          newSet.add(noteId);
        }
        return newSet;
      }
      return new Set([noteId]);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNoteIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedNoteIds(new Set(notes.map(note => note.id)));
  }, [notes]);

  const clearAllNotes = useCallback(() => {
    setNotes([]);
    setSelectedNoteIds(new Set());
  }, []);

  const getNoteById = useCallback((noteId: string) => {
    return notes.find(note => note.id === noteId);
  }, [notes]);

  const getNotesInRange = useCallback((startTime: number, endTime: number) => {
    return notes.filter(note =>
      note.startTime < endTime && (note.startTime + note.duration) > startTime
    );
  }, [notes]);

  const copySelectedNotes = useCallback(() => {
    const selectedNotes = notes.filter(note => selectedNoteIds.has(note.id));
    setCopiedNotes(selectedNotes);
    return selectedNotes.length;
  }, [notes, selectedNoteIds]);

  const pasteNotes = useCallback((pasteAtTime?: number) => {
    if (copiedNotes.length === 0) return [];

    // Find the earliest start time among copied notes
    const minStartTime = Math.min(...copiedNotes.map(n => n.startTime));

    // Calculate paste position
    let pasteTime: number;
    if (pasteAtTime !== undefined) {
      // Use provided paste time
      pasteTime = pasteAtTime;
    } else {
      // Default: paste one beat after the last selected note
      const selectedNotes = notes.filter(note => selectedNoteIds.has(note.id));
      if (selectedNotes.length > 0) {
        const maxEndTime = Math.max(...selectedNotes.map(n => n.startTime + n.duration));
        pasteTime = maxEndTime + 1;
      } else {
        // If no selection, paste at beat 0
        pasteTime = 0;
      }
    }

    // Calculate the time offset for pasting
    const timeOffset = pasteTime - minStartTime;

    // Create new notes with new IDs and adjusted start times
    const newNotes: Note[] = copiedNotes.map(note => ({
      ...note,
      id: generateNoteId(),
      startTime: note.startTime + timeOffset,
    }));

    // Add the new notes
    setNotes(prev => [...prev, ...newNotes]);

    // Select the newly pasted notes
    setSelectedNoteIds(new Set(newNotes.map(n => n.id)));

    return newNotes.map(n => n.id);
  }, [copiedNotes, notes, selectedNoteIds]);

  const duplicateSelectedNotes = useCallback(() => {
    copySelectedNotes();
    return pasteNotes();
  }, [copySelectedNotes, pasteNotes]);

  return {
    notes,
    selectedNoteIds,
    copiedNotes,
    addNote,
    removeNote,
    removeSelectedNotes,
    updateNote,
    moveNote,
    moveSelectedNotes,
    resizeNote,
    selectNote,
    clearSelection,
    selectAll,
    clearAllNotes,
    getNoteById,
    getNotesInRange,
    setNotes,
    copySelectedNotes,
    pasteNotes,
    duplicateSelectedNotes,
  };
};
