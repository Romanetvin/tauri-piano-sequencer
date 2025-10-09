use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::Arc;

/// Sample-based piano player using real piano recordings
pub struct SamplePlayer {
    stream_handle: Arc<OutputStreamHandle>,
    samples: HashMap<u8, Vec<f32>>, // MIDI pitch -> sample data
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

        // Define the MIDI notes we want to load (one per octave: A notes)
        // We'll pitch-shift these to cover all notes
        let base_notes = vec![
            (21, "A0"),  // A0
            (33, "A1"),  // A1
            (45, "A2"),  // A2
            (57, "A3"),  // A3
            (69, "A4"),  // A4
            (81, "A5"),  // A5
            (93, "A6"),  // A6
            (105, "A7"), // A7
        ];

        let mut loaded_count = 0;

        for (midi_note, note_name) in base_notes {
            // Try different file name patterns
            let possible_names = vec![
                format!("{}v8.wav", note_name),
                format!("{}v4.wav", note_name),
                format!("{}.wav", note_name),
                format!("{}_v8.wav", note_name),
                format!("{}_v4.wav", note_name),
            ];

            for filename in possible_names {
                let file_path = samples_dir.join(&filename);
                if file_path.exists() {
                    match self.load_sample_file(&file_path, midi_note) {
                        Ok(_) => {
                            loaded_count += 1;
                            break;
                        }
                        Err(e) => {
                            eprintln!("Warning: Failed to load {}: {}", filename, e);
                        }
                    }
                }
            }
        }

        if loaded_count == 0 {
            return Err(format!(
                "No piano samples found in {}. Please download samples (see samples/README.md)",
                samples_dir.display()
            ));
        }

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
    fn load_sample_file(&mut self, path: &PathBuf, midi_note: u8) -> Result<(), String> {
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

        self.samples.insert(midi_note, samples);
        Ok(())
    }

    /// Play a note using samples with pitch shifting
    pub fn play_note(&self, pitch: u8, duration: f32, velocity: u8) -> Result<(), String> {
        // Find the closest sample
        let (closest_pitch, sample_data) = self.find_closest_sample(pitch)?;

        // Calculate pitch shift ratio
        let semitone_diff = pitch as f32 - closest_pitch as f32;
        let pitch_ratio = 2.0_f32.powf(semitone_diff / 12.0);

        // Apply velocity
        let velocity_factor = (velocity as f32 / 127.0).max(0.1);

        // Create a pitch-shifted and velocity-adjusted source
        let adjusted_samples: Vec<f32> = sample_data
            .iter()
            .map(|&s| s * velocity_factor * self.volume)
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

    /// Find the closest loaded sample to the requested pitch
    fn find_closest_sample(&self, pitch: u8) -> Result<(u8, &Vec<f32>), String> {
        if self.samples.is_empty() {
            return Err("No samples loaded".to_string());
        }

        let mut closest_pitch = *self.samples.keys().next().unwrap();
        let mut min_distance = (pitch as i16 - closest_pitch as i16).abs();

        for &sample_pitch in self.samples.keys() {
            let distance = (pitch as i16 - sample_pitch as i16).abs();
            if distance < min_distance {
                min_distance = distance;
                closest_pitch = sample_pitch;
            }
        }

        let sample_data = self.samples.get(&closest_pitch)
            .ok_or("Sample not found")?;

        Ok((closest_pitch, sample_data))
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
