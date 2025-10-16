use serde::{Deserialize, Serialize};
use validator::Validate;

/// Supported AI providers for melody generation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum AIProvider {
    OpenAI,
    Gemini,
    Anthropic,
    Cohere,
}

impl AIProvider {
    pub fn as_str(&self) -> &str {
        match self {
            AIProvider::OpenAI => "openai",
            AIProvider::Gemini => "gemini",
            AIProvider::Anthropic => "anthropic",
            AIProvider::Cohere => "cohere",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "openai" => Some(AIProvider::OpenAI),
            "gemini" => Some(AIProvider::Gemini),
            "anthropic" => Some(AIProvider::Anthropic),
            "cohere" => Some(AIProvider::Cohere),
            _ => None,
        }
    }
}

/// Musical scale definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scale {
    /// Root note (e.g., "C", "C#", "D", "Eb", etc.)
    pub root: String,
    /// Scale mode (e.g., "major", "minor")
    pub mode: String,
}

impl Scale {
    /// Get MIDI note numbers for this scale across all octaves (0-127)
    pub fn get_midi_notes(&self) -> Vec<u8> {
        let root_offset = Self::note_to_offset(&self.root);
        let intervals = match self.mode.to_lowercase().as_str() {
            "major" => vec![0, 2, 4, 5, 7, 9, 11],
            "minor" => vec![0, 2, 3, 5, 7, 8, 10],
            _ => vec![0, 2, 4, 5, 7, 9, 11], // Default to major
        };

        let mut notes = Vec::new();
        for octave in 0..11 {
            for &interval in &intervals {
                let midi_note = (octave * 12) + root_offset + interval;
                if midi_note <= 127 {
                    notes.push(midi_note as u8);
                }
            }
        }
        notes
    }

    /// Convert note name to MIDI offset (C=0, C#=1, D=2, etc.)
    fn note_to_offset(note: &str) -> i32 {
        match note.to_uppercase().as_str() {
            "C" => 0,
            "C#" | "DB" => 1,
            "D" => 2,
            "D#" | "EB" => 3,
            "E" => 4,
            "F" => 5,
            "F#" | "GB" => 6,
            "G" => 7,
            "G#" | "AB" => 8,
            "A" => 9,
            "A#" | "BB" => 10,
            "B" => 11,
            _ => 0, // Default to C
        }
    }
}

/// Request for AI melody generation
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct MelodyRequest {
    /// User's prompt describing the desired melody
    #[validate(length(min = 1, max = 1000))]
    pub prompt: String,

    /// Optional scale constraint
    pub scale: Option<Scale>,

    /// Number of measures to generate (default: 4)
    #[validate(range(min = 1, max = 16))]
    pub measures: u32,

    /// AI provider to use
    pub model_provider: AIProvider,

    /// Temperature for generation (0.0-2.0, default: 1.0)
    #[validate(range(min = 0.0, max = 2.0))]
    pub temperature: Option<f32>,
}

impl Default for MelodyRequest {
    fn default() -> Self {
        Self {
            prompt: String::new(),
            scale: None,
            measures: 4,
            model_provider: AIProvider::OpenAI,
            temperature: Some(1.0),
        }
    }
}

/// A single musical note
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct Note {
    /// Unique identifier
    pub id: String,

    /// MIDI pitch (0-127)
    #[validate(range(min = 0, max = 127))]
    pub pitch: u8,

    /// Start time in beats
    #[validate(range(min = 0.0))]
    #[serde(rename = "startTime")]
    pub start_time: f64,

    /// Duration in beats
    #[validate(range(min = 0.01))]
    pub duration: f64,

    /// Velocity (0-127)
    #[validate(range(min = 0, max = 127))]
    pub velocity: u8,

    /// Track ID this note belongs to
    #[serde(rename = "trackId")]
    pub track_id: String,
}

/// Metadata about the generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationMetadata {
    /// Model provider used
    pub provider: AIProvider,

    /// Timestamp of generation
    pub timestamp: String,

    /// Model name/version (e.g., "gpt-4", "gemini-pro")
    pub model_name: String,

    /// Temperature used
    pub temperature: f32,

    /// Scale used (if any)
    pub scale: Option<Scale>,
}

/// Response from AI melody generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MelodyResponse {
    /// Generated notes
    pub notes: Vec<Note>,

    /// Metadata about the generation
    pub metadata: GenerationMetadata,
}

impl MelodyResponse {
    /// Validate all notes in the response
    pub fn validate_notes(&self) -> Result<(), validator::ValidationErrors> {
        for note in &self.notes {
            note.validate()?;
        }
        Ok(())
    }

    /// Check if all notes are within the specified scale
    #[allow(dead_code)]
    pub fn notes_in_scale(&self, scale: &Scale) -> bool {
        let allowed_notes = scale.get_midi_notes();
        self.notes.iter().all(|note| allowed_notes.contains(&note.pitch))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scale_midi_notes() {
        let c_major = Scale {
            root: "C".to_string(),
            mode: "major".to_string(),
        };
        let notes = c_major.get_midi_notes();

        // C major scale in first octave: C(0), D(2), E(4), F(5), G(7), A(9), B(11)
        assert!(notes.contains(&0));
        assert!(notes.contains(&2));
        assert!(notes.contains(&4));
        assert!(notes.contains(&5));
        assert!(notes.contains(&7));
        assert!(notes.contains(&9));
        assert!(notes.contains(&11));

        // Should NOT contain C#(1)
        assert!(!notes.contains(&1));
    }

    #[test]
    fn test_provider_conversion() {
        assert_eq!(AIProvider::from_str("openai"), Some(AIProvider::OpenAI));
        assert_eq!(AIProvider::from_str("OpenAI"), Some(AIProvider::OpenAI));
        assert_eq!(AIProvider::from_str("GEMINI"), Some(AIProvider::Gemini));
        assert_eq!(AIProvider::from_str("invalid"), None);
    }
}
