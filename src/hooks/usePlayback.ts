import { useState, useCallback, useEffect, useRef } from 'react';
import { PlaybackState, Note, Track } from '../types';

interface UsePlaybackOptions {
  initialVolume?: number;
  onNotePlay?: (note: Note) => void;
  tracks?: Track[];
}

export const usePlayback = (notes: Note[], options: UsePlaybackOptions = {}) => {
  const {
    initialVolume = 0.8,
    onNotePlay,
    tracks = [],
  } = options;

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    volume: initialVolume,
  });

  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const playedNotesRef = useRef<Set<string>>(new Set());
  const trackTimesRef = useRef<Map<string, number>>(new Map());

  const play = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: true }));
    lastTimeRef.current = performance.now();
  }, []);

  const pause = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const stop = useCallback(() => {
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
    }));
    playedNotesRef.current.clear();
    trackTimesRef.current.clear();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const seek = useCallback((time: number) => {
    setPlaybackState(prev => ({ ...prev, currentTime: Math.max(0, time) }));
    playedNotesRef.current.clear();
  }, []);

  const setVolume = useCallback((volume: number) => {
    setPlaybackState(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  // Playback loop - handles multiple tracks with independent tempos
  useEffect(() => {
    if (!playbackState.isPlaying) return;

    // Initialize track times
    tracks.forEach(track => {
      if (!trackTimesRef.current.has(track.id)) {
        trackTimesRef.current.set(track.id, 0);
      }
    });

    const animate = (currentTime: number) => {
      if (!playbackState.isPlaying) return;

      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;

      // Update each track's time based on its own tempo
      tracks.forEach(track => {
        const beatsPerSecond = track.tempo / 60;
        const deltaBeats = deltaTime * beatsPerSecond;
        const currentTrackTime = trackTimesRef.current.get(track.id) || 0;
        const newTrackTime = currentTrackTime + deltaBeats;
        trackTimesRef.current.set(track.id, newTrackTime);

        // Check for notes to play in this track
        const hasSolo = tracks.some(t => t.solo);
        const shouldPlay = !track.muted && (!hasSolo || track.solo);

        if (shouldPlay) {
          notes
            .filter(note => note.trackId === track.id)
            .forEach(note => {
              const noteKey = note.id;
              if (
                note.startTime <= newTrackTime &&
                note.startTime > currentTrackTime &&
                !playedNotesRef.current.has(noteKey)
              ) {
                playedNotesRef.current.add(noteKey);
                onNotePlay?.(note);
              }
            });
        }
      });

      // Update global playback time (use average or primary track)
      const avgTime = tracks.length > 0
        ? Array.from(trackTimesRef.current.values()).reduce((a, b) => a + b, 0) / tracks.length
        : 0;
      setPlaybackState(prev => ({ ...prev, currentTime: avgTime }));

      // Find the last note's end time across all tracks
      const lastNoteEnd = notes.reduce((max, note) => {
        const track = tracks.find(t => t.id === note.trackId);
        if (!track) return max;
        // Convert note time to real time based on track tempo
        const noteEndInBeats = note.startTime + note.duration;
        return Math.max(max, noteEndInBeats);
      }, 0);

      // Loop back to start if all tracks have reached the end
      const allTracksFinished = Array.from(trackTimesRef.current.values()).every(time => time >= lastNoteEnd);
      if (allTracksFinished && lastNoteEnd > 0) {
        playedNotesRef.current.clear();
        trackTimesRef.current.clear();
        tracks.forEach(track => trackTimesRef.current.set(track.id, 0));
        setPlaybackState(prev => ({ ...prev, currentTime: 0 }));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState.isPlaying, tracks, notes, onNotePlay]);

  return {
    playbackState,
    play,
    pause,
    stop,
    seek,
    setVolume,
  };
};
