use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use lru::LruCache;
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use std::num::NonZeroUsize;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Sample-based piano player using real piano recordings with lazy loading
pub struct SamplePlayer {
    stream_handle: Arc<OutputStreamHandle>,
    sample_paths: HashMap<(u8, u8), PathBuf>, // (MIDI pitch, velocity 1-16) -> file path
    sample_cache: Arc<Mutex<LruCache<(u8, u8), Vec<f32>>>>, // LRU cache for loaded samples
    sample_rate: u32,
    volume: f32,
}

unsafe impl Send for SamplePlayer {}

impl SamplePlayer {
    pub fn new() -> Result<(Self, OutputStream), String> {
        let (stream, stream_handle) = OutputStream::try_default()
            .map_err(|e| format!("Failed to create audio stream: {}", e))?;

        let mut player = Self {
            stream_handle: Arc::new(stream_handle),
            sample_paths: HashMap::new(),
            sample_cache: Arc::new(Mutex::new(LruCache::new(NonZeroUsize::new(100).unwrap()))), // Cache up to 100 samples
            sample_rate: 48000,
            volume: 0.8,
        };

        // Index sample files from the samples directory (no loading yet)
        player.index_samples()?;

        Ok((player, stream))
    }

    /// Convert MIDI pitch to note name (e.g., 60 -> "C4", 61 -> "C#4")
    fn midi_to_note_name(pitch: u8) -> String {
        let note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let octave = (pitch / 12) as i32 - 1;
        let note_index = (pitch % 12) as usize;
        format!("{}{}", note_names[note_index], octave)
    }

    /// Map MIDI velocity (0-127) to sample velocity (1-16)
    fn velocity_to_sample_layer(velocity: u8) -> u8 {
        // Map 0-127 to 1-16
        // 0-7 -> 1, 8-15 -> 2, ..., 120-127 -> 16
        ((velocity as u16 * 16) / 128).max(1).min(16) as u8
    }

    /// Index piano sample files from the samples directory (lazy loading - don't decode yet)
    fn index_samples(&mut self) -> Result<(), String> {
        // Get the samples directory path
        let samples_dir = self.get_samples_dir()?;

        if !samples_dir.exists() {
            return Err(format!(
                "Samples directory not found: {}. Please add piano samples to this directory.",
                samples_dir.display()
            ));
        }

        let mut indexed_count = 0;

        // Index all notes from A0 (21) to C8 (108)
        for midi_pitch in 21..=108 {
            let note_name = Self::midi_to_note_name(midi_pitch);

            // Index multiple velocity layers (prioritize middle velocities)
            let velocity_priorities = vec![8, 12, 4, 16, 6, 10, 14, 2, 1, 3, 5, 7, 9, 11, 13, 15];

            for sample_velocity in velocity_priorities {
                // Try different file name patterns
                let possible_names = vec![
                    format!("{}v{}.wav", note_name, sample_velocity),
                    format!("{}_v{}.wav", note_name, sample_velocity),
                ];

                for filename in &possible_names {
                    let file_path = samples_dir.join(filename);
                    if file_path.exists() {
                        // Just store the path, don't load yet
                        self.sample_paths.insert((midi_pitch, sample_velocity), file_path);
                        indexed_count += 1;
                        break; // Move to next velocity after successful index
                    }
                }
            }
        }

        if indexed_count == 0 {
            return Err(format!(
                "No piano samples found in {}. Please check sample files.",
                samples_dir.display()
            ));
        }

        println!("Indexed {} piano samples (lazy loading enabled)", indexed_count);
        Ok(())
    }

    /// Get the samples directory path
    fn get_samples_dir(&self) -> Result<PathBuf, String> {
        // Try to find the samples directory relative to the executable
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get executable path: {}", e))?;

        let exe_dir = exe_path
            .parent()
            .ok_or("Failed to get executable directory")?;

        // In development: src-tauri/samples
        // In production: next to the executable
        let dev_path = exe_dir
            .parent()
            .and_then(|p| p.parent())
            .map(|p| p.join("samples"));

        let prod_path = exe_dir.join("samples");

        // Try development path first, then production
        if let Some(ref path) = dev_path {
            if path.exists() {
                return Ok(path.clone());
            }
        }

        if prod_path.exists() {
            return Ok(prod_path.clone());
        }

        // Return development path as default (for error messages)
        Ok(dev_path.unwrap_or(prod_path))
    }

    /// Load a single sample file on-demand and cache it
    fn load_sample_on_demand(&self, key: (u8, u8)) -> Result<Vec<f32>, String> {
        // Check if already in cache
        {
            let mut cache = self.sample_cache.lock().unwrap();
            if let Some(samples) = cache.get(&key) {
                return Ok(samples.clone());
            }
        }

        // Not in cache, load from disk
        let path = self.sample_paths.get(&key)
            .ok_or_else(|| format!("Sample not found for pitch {} velocity {}", key.0, key.1))?;

        let file = File::open(path)
            .map_err(|e| format!("Failed to open file: {}", e))?;

        let reader = BufReader::new(file);
        let source = Decoder::new(reader)
            .map_err(|e| format!("Failed to decode audio file: {}", e))?;

        // Convert to mono and collect samples
        let samples: Vec<f32> = source
            .convert_samples()
            .collect();

        // Cache the loaded sample
        {
            let mut cache = self.sample_cache.lock().unwrap();
            cache.put(key, samples.clone());
        }

        Ok(samples)
    }

    /// Play a note using samples with pitch shifting
    pub fn play_note(&self, pitch: u8, duration: f32, velocity: u8) -> Result<(), String> {
        // Map MIDI velocity to sample velocity layer
        let target_velocity = Self::velocity_to_sample_layer(velocity);

        // Find the closest sample key (pitch and velocity)
        let (closest_pitch, closest_velocity) = self.find_closest_sample_key(pitch, target_velocity)?;

        // Load the sample on-demand (with caching)
        let sample_data = self.load_sample_on_demand((closest_pitch, closest_velocity))?;

        // Calculate pitch shift ratio (minimize shifting by using exact notes when possible)
        let semitone_diff = pitch as f32 - closest_pitch as f32;
        let pitch_ratio = 2.0_f32.powf(semitone_diff / 12.0);

        // Apply velocity scaling only if we don't have the exact velocity layer
        // If we have the right velocity layer, let the sample speak for itself
        let velocity_factor = if closest_velocity == target_velocity {
            self.volume
        } else {
            // Light adjustment if we're using a different velocity layer
            let velocity_diff = (target_velocity as f32 - closest_velocity as f32) / 16.0;
            (self.volume * (1.0 + velocity_diff * 0.3)).max(0.1).min(1.0)
        };

        // Create a velocity-adjusted source
        let adjusted_samples: Vec<f32> = sample_data
            .iter()
            .map(|&s| s * velocity_factor)
            .collect();

        // Create source with pitch shifting via sample rate manipulation
        let adjusted_sample_rate = (self.sample_rate as f32 * pitch_ratio) as u32;
        let source = rodio::buffer::SamplesBuffer::new(1, adjusted_sample_rate, adjusted_samples);

        // Limit duration by taking only the needed samples
        let limited_source = source.take_duration(std::time::Duration::from_secs_f32(duration));

        // Create a sink and play
        let sink = Sink::try_new(&*self.stream_handle)
            .map_err(|e| format!("Failed to create sink: {}", e))?;

        sink.append(limited_source);
        sink.detach();

        Ok(())
    }

    /// Find the closest indexed sample to the requested pitch and velocity
    fn find_closest_sample_key(&self, pitch: u8, velocity: u8) -> Result<(u8, u8), String> {
        if self.sample_paths.is_empty() {
            return Err("No samples indexed".to_string());
        }

        // First, check if we have the exact pitch and velocity
        if self.sample_paths.contains_key(&(pitch, velocity)) {
            return Ok((pitch, velocity));
        }

        // If not exact match, find the closest pitch and velocity combination
        let mut best_key = *self.sample_paths.keys().next().unwrap();
        let mut min_distance = i16::MAX;

        for &(sample_pitch, sample_velocity) in self.sample_paths.keys() {
            // Prioritize pitch accuracy (semitones are more important than velocity)
            let pitch_distance = (pitch as i16 - sample_pitch as i16).abs();
            let velocity_distance = (velocity as i16 - sample_velocity as i16).abs();

            // Weighted distance: pitch is 4x more important than velocity
            let total_distance = pitch_distance * 4 + velocity_distance;

            if total_distance < min_distance {
                min_distance = total_distance;
                best_key = (sample_pitch, sample_velocity);
            }
        }

        Ok(best_key)
    }

    /// Get the number of indexed samples
    pub fn sample_count(&self) -> usize {
        self.sample_paths.len()
    }
}
