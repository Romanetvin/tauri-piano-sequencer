use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::Arc;

/// Sample-based piano player using real piano recordings
pub struct SamplePlayer {
    stream_handle: Arc<OutputStreamHandle>,
    samples: HashMap<(u8, u8), Vec<f32>>, // (MIDI pitch, velocity 1-16) -> sample data
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
            samples: HashMap::new(),
            sample_rate: 48000,
            volume: 0.8,
        };

        // Load samples from the samples directory
        player.load_samples()?;

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

    /// Load piano samples from the samples directory
    fn load_samples(&mut self) -> Result<(), String> {
        // Get the samples directory path
        let samples_dir = self.get_samples_dir()?;

        if !samples_dir.exists() {
            return Err(format!(
                "Samples directory not found: {}. Please add piano samples to this directory.",
                samples_dir.display()
            ));
        }

        let mut loaded_count = 0;

        // Try to load all notes from A0 (21) to C8 (108)
        for midi_pitch in 21..=108 {
            let note_name = Self::midi_to_note_name(midi_pitch);

            // Try to load multiple velocity layers (prioritize middle velocities)
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
                        match self.load_sample_file(&file_path, midi_pitch, sample_velocity) {
                            Ok(_) => {
                                loaded_count += 1;
                            }
                            Err(e) => {
                                eprintln!("Warning: Failed to load {}: {}", filename, e);
                            }
                        }
                        break; // Move to next velocity after successful load
                    }
                }
            }
        }

        if loaded_count == 0 {
            return Err(format!(
                "No piano samples found in {}. Please check sample files.",
                samples_dir.display()
            ));
        }

        println!("Loaded {} piano samples", loaded_count);
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

    /// Load a single sample file
    fn load_sample_file(&mut self, path: &PathBuf, midi_pitch: u8, sample_velocity: u8) -> Result<(), String> {
        let file = File::open(path)
            .map_err(|e| format!("Failed to open file: {}", e))?;

        let reader = BufReader::new(file);
        let source = Decoder::new(reader)
            .map_err(|e| format!("Failed to decode audio file: {}", e))?;

        // Store the sample rate
        self.sample_rate = source.sample_rate();

        // Convert to mono and collect samples
        let samples: Vec<f32> = source
            .convert_samples()
            .collect();

        self.samples.insert((midi_pitch, sample_velocity), samples);
        Ok(())
    }

    /// Play a note using samples with pitch shifting
    pub fn play_note(&self, pitch: u8, duration: f32, velocity: u8) -> Result<(), String> {
        // Map MIDI velocity to sample velocity layer
        let target_velocity = Self::velocity_to_sample_layer(velocity);

        // Find the closest sample (pitch and velocity)
        let ((closest_pitch, closest_velocity), sample_data) = self.find_closest_sample(pitch, target_velocity)?;

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

    /// Find the closest loaded sample to the requested pitch and velocity
    fn find_closest_sample(&self, pitch: u8, velocity: u8) -> Result<((u8, u8), &Vec<f32>), String> {
        if self.samples.is_empty() {
            return Err("No samples loaded".to_string());
        }

        // First, check if we have the exact pitch and velocity
        if let Some(sample_data) = self.samples.get(&(pitch, velocity)) {
            return Ok(((pitch, velocity), sample_data));
        }

        // If not exact match, find the closest pitch and velocity combination
        let mut best_key = *self.samples.keys().next().unwrap();
        let mut min_distance = i16::MAX;

        for &(sample_pitch, sample_velocity) in self.samples.keys() {
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

        let sample_data = self.samples.get(&best_key)
            .ok_or("Sample not found")?;

        Ok((best_key, sample_data))
    }

    /// Set master volume
    pub fn set_volume(&mut self, volume: f32) -> Result<(), String> {
        self.volume = volume.max(0.0).min(1.0);
        Ok(())
    }

    /// Check if samples are loaded
    pub fn has_samples(&self) -> bool {
        !self.samples.is_empty()
    }

    /// Get the number of loaded samples
    pub fn sample_count(&self) -> usize {
        self.samples.len()
    }
}
