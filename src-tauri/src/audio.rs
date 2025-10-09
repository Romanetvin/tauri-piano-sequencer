use rodio::{OutputStream, OutputStreamHandle, Sink};
use std::sync::Arc;

/// Sound generation mode
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum SoundMode {
    Synthesizer,
    Piano,
}

/// ADSR (Attack, Decay, Sustain, Release) envelope parameters
#[derive(Clone, Copy)]
pub struct Envelope {
    attack: f32,  // seconds
    decay: f32,   // seconds
    sustain: f32, // level 0.0-1.0
    release: f32, // seconds
}

impl Default for Envelope {
    fn default() -> Self {
        Self {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.7,
            release: 0.2,
        }
    }
}

/// Audio engine for playing piano notes
pub struct AudioEngine {
    stream_handle: Arc<OutputStreamHandle>,
    volume: f32,
    sound_mode: SoundMode,
}

// Manual Send implementation - we ensure thread safety through Arc
unsafe impl Send for AudioEngine {}

impl AudioEngine {
    pub fn new() -> Result<(Self, OutputStream), String> {
        let (stream, stream_handle) = OutputStream::try_default()
            .map_err(|e| format!("Failed to create audio stream: {}", e))?;

        let engine = Self {
            stream_handle: Arc::new(stream_handle),
            volume: 0.8,
            sound_mode: SoundMode::Piano, // Default to piano mode
        };

        Ok((engine, stream))
    }

    /// Convert MIDI note number to frequency in Hz
    fn midi_to_frequency(pitch: u8) -> f32 {
        440.0 * 2.0_f32.powf((pitch as f32 - 69.0) / 12.0)
    }

    /// Generate piano-like sound with harmonics
    fn generate_piano_sample(t: f32, frequency: f32, envelope_amp: f32, velocity_amplitude: f32, volume: f32) -> f32 {
        // Piano harmonics with decreasing amplitudes
        // Fundamental + overtones at 2x, 3x, 4x, 5x, 6x frequencies
        let harmonics = [
            (1.0, 1.0),      // Fundamental
            (2.0, 0.5),      // 2nd harmonic
            (3.0, 0.25),     // 3rd harmonic
            (4.0, 0.15),     // 4th harmonic
            (5.0, 0.1),      // 5th harmonic
            (6.0, 0.05),     // 6th harmonic
        ];

        let mut sample = 0.0;
        for (harmonic_num, amplitude) in harmonics.iter() {
            let harmonic_freq = frequency * harmonic_num;
            // Add slight detuning for warmth
            let detune = 1.0 + (harmonic_num - 1.0) * 0.001;
            sample += (t * harmonic_freq * detune * 2.0 * std::f32::consts::PI).sin() * amplitude;
        }

        // Normalize and apply envelope
        sample * 0.2 * envelope_amp * velocity_amplitude * volume
    }

    /// Generate simple synthesizer sine wave
    fn generate_synth_sample(t: f32, frequency: f32, envelope_amp: f32, velocity_amplitude: f32, volume: f32) -> f32 {
        let sine_wave = (t * frequency * 2.0 * std::f32::consts::PI).sin();
        sine_wave * envelope_amp * velocity_amplitude * volume
    }

    /// Generate a note with ADSR envelope (supports both piano and synth modes)
    pub fn play_note(&self, pitch: u8, duration: f32, velocity: u8) -> Result<(), String> {
        let frequency = Self::midi_to_frequency(pitch);
        let sample_rate = 44100;

        // Use different envelope for piano vs synth
        let envelope = match self.sound_mode {
            SoundMode::Piano => Envelope {
                attack: 0.002,   // Very fast attack for piano
                decay: 0.3,      // Longer decay
                sustain: 0.3,    // Lower sustain
                release: 0.5,    // Longer release for piano resonance
            },
            SoundMode::Synthesizer => Envelope::default(),
        };

        // Calculate total duration including release
        let total_duration = duration + envelope.release;
        let total_samples = (total_duration * sample_rate as f32) as usize;

        // Velocity to amplitude (0-127 -> 0.0-1.0)
        let velocity_amplitude = (velocity as f32 / 127.0) * 0.5; // Max 0.5 to prevent clipping

        let volume = self.volume;
        let sound_mode = self.sound_mode;

        // Generate samples with ADSR envelope
        let samples: Vec<f32> = (0..total_samples)
            .map(|i| {
                let t = i as f32 / sample_rate as f32;

                // Calculate envelope amplitude
                let envelope_amp = if t < envelope.attack {
                    // Attack phase: ramp from 0 to 1
                    t / envelope.attack
                } else if t < envelope.attack + envelope.decay {
                    // Decay phase: ramp from 1 to sustain level
                    let decay_t = (t - envelope.attack) / envelope.decay;
                    1.0 - (1.0 - envelope.sustain) * decay_t
                } else if t < duration {
                    // Sustain phase: hold at sustain level
                    envelope.sustain
                } else {
                    // Release phase: ramp from sustain to 0
                    let release_t = (t - duration) / envelope.release;
                    envelope.sustain * (1.0 - release_t).max(0.0)
                };

                // Generate sample based on sound mode
                match sound_mode {
                    SoundMode::Piano => Self::generate_piano_sample(t, frequency, envelope_amp, velocity_amplitude, volume),
                    SoundMode::Synthesizer => Self::generate_synth_sample(t, frequency, envelope_amp, velocity_amplitude, volume),
                }
            })
            .collect();

        // Create a source from the samples
        let source = rodio::buffer::SamplesBuffer::new(1, sample_rate, samples);

        // Create a new sink and play the note
        let sink = Sink::try_new(&*self.stream_handle)
            .map_err(|e| format!("Failed to create sink: {}", e))?;

        sink.append(source);
        sink.detach(); // Let it play independently

        Ok(())
    }

    /// Stop all currently playing notes (simplified - just for compatibility)
    pub fn stop_all_notes(&self) -> Result<(), String> {
        // With detached sinks, we can't easily stop all notes
        // This is a limitation of the simplified design
        Ok(())
    }

    /// Set the master volume (0.0 to 1.0)
    pub fn set_volume(&mut self, volume: f32) -> Result<(), String> {
        self.volume = volume.max(0.0).min(1.0);
        Ok(())
    }

    /// Set the sound mode (Piano or Synthesizer)
    pub fn set_sound_mode(&mut self, mode: SoundMode) -> Result<(), String> {
        self.sound_mode = mode;
        Ok(())
    }

    /// Get the current sound mode
    pub fn get_sound_mode(&self) -> SoundMode {
        self.sound_mode
    }
}
