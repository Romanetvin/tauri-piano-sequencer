import { useState, useCallback } from 'react';
import { Note } from '../types';
import { generateNoteId } from '../utils/noteUtils';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  const addNote = useCallback((pitch: number, startTime: number, duration: number, velocity: number = 100, trackId: string = 'track_right_hand') => {
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

  return {
    notes,
    selectedNoteIds,
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
  };
};
