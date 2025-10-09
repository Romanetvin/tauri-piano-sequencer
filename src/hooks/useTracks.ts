import { useState, useCallback } from 'react';
import { Track } from '../types';

const generateTrackId = () => `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useTracks = () => {
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 'track_right_hand',
      name: 'Right Hand',
      tempo: 120,
      color: '#6366f1', // indigo
      volume: 0.8,
      muted: false,
      solo: false,
    },
    {
      id: 'track_left_hand',
      name: 'Left Hand',
      tempo: 120,
      color: '#8b5cf6', // purple
      volume: 0.8,
      muted: false,
      solo: false,
    },
  ]);

  const [selectedTrackId, setSelectedTrackId] = useState<string>('track_right_hand');

  const addTrack = useCallback((name?: string) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    const newTrack: Track = {
      id: generateTrackId(),
      name: name || `Track ${tracks.length + 1}`,
      tempo: 120,
      color: colors[tracks.length % colors.length],
      volume: 0.8,
      muted: false,
      solo: false,
    };
    setTracks(prev => [...prev, newTrack]);
    return newTrack.id;
  }, [tracks.length]);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
    if (selectedTrackId === trackId) {
      setSelectedTrackId(tracks[0]?.id || '');
    }
  }, [selectedTrackId, tracks]);

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, ...updates } : track
    ));
  }, []);

  const setTrackTempo = useCallback((trackId: string, tempo: number) => {
    updateTrack(trackId, { tempo: Math.max(40, Math.min(240, tempo)) });
  }, [updateTrack]);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    updateTrack(trackId, { volume: Math.max(0, Math.min(1, volume)) });
  }, [updateTrack]);

  const toggleMute = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ));
  }, []);

  const toggleSolo = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, solo: !track.solo } : track
    ));
  }, []);

  const getTrackById = useCallback((trackId: string) => {
    return tracks.find(track => track.id === trackId);
  }, [tracks]);

  const hasSoloTracks = useCallback(() => {
    return tracks.some(track => track.solo);
  }, [tracks]);

  return {
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    addTrack,
    removeTrack,
    updateTrack,
    setTrackTempo,
    setTrackVolume,
    toggleMute,
    toggleSolo,
    getTrackById,
    hasSoloTracks,
    setTracks,
  };
};
