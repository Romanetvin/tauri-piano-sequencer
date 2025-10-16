use crate::ai_models::MelodyRequest;

/// Style information extracted from user prompt
#[derive(Debug)]
struct PromptStyle {
    mood: Option<&'static str>,
    dynamics: Option<&'static str>,
    rhythm: Option<&'static str>,
    genre: Option<&'static str>,
}

/// Analyze the user's prompt to extract style keywords
///
/// This function scans the user's natural language prompt for musical style keywords
/// and categorizes them into mood, dynamics, rhythm, and genre. These extracted
/// styles are then used to provide specific guidance to the AI model, ensuring
/// the generated melody matches the user's intent.
///
/// # Arguments
/// * `prompt` - The user's natural language description of the desired melody
///
/// # Returns
/// A `PromptStyle` struct containing detected style attributes (if any)
///
/// # Examples
/// - "happy jazz melody" → mood: uplifting, genre: jazz
/// - "soft and slow" → dynamics: soft, rhythm: slow
fn analyze_prompt_style(prompt: &str) -> PromptStyle {
    let prompt_lower = prompt.to_lowercase();

    // Mood keywords
    let mood = if prompt_lower.contains("happy") || prompt_lower.contains("cheerful") || prompt_lower.contains("joyful") {
        Some("uplifting and bright")
    } else if prompt_lower.contains("sad") || prompt_lower.contains("melancholic") || prompt_lower.contains("somber") {
        Some("melancholic and contemplative")
    } else if prompt_lower.contains("dark") || prompt_lower.contains("mysterious") || prompt_lower.contains("ominous") {
        Some("dark and mysterious")
    } else if prompt_lower.contains("calm") || prompt_lower.contains("peaceful") || prompt_lower.contains("serene") {
        Some("calm and peaceful")
    } else if prompt_lower.contains("energetic") || prompt_lower.contains("exciting") || prompt_lower.contains("upbeat") {
        Some("energetic and exciting")
    } else {
        None
    };

    // Dynamics keywords
    let dynamics = if prompt_lower.contains("soft") || prompt_lower.contains("quiet") || prompt_lower.contains("gentle") {
        Some("soft dynamics (velocity 40-70)")
    } else if prompt_lower.contains("loud") || prompt_lower.contains("powerful") || prompt_lower.contains("forte") {
        Some("loud dynamics (velocity 90-120)")
    } else if prompt_lower.contains("dynamic") || prompt_lower.contains("expressive") {
        Some("varied dynamics (velocity 50-110)")
    } else {
        None
    };

    // Rhythm keywords
    let rhythm = if prompt_lower.contains("fast") || prompt_lower.contains("quick") || prompt_lower.contains("rapid") {
        Some("fast-paced with shorter note durations")
    } else if prompt_lower.contains("slow") || prompt_lower.contains("leisurely") {
        Some("slow-paced with longer note durations")
    } else if prompt_lower.contains("syncopated") || prompt_lower.contains("rhythmic") {
        Some("syncopated rhythms with off-beat emphasis")
    } else if prompt_lower.contains("flowing") || prompt_lower.contains("smooth") {
        Some("smooth, flowing rhythms")
    } else {
        None
    };

    // Genre keywords
    let genre = if prompt_lower.contains("jazz") {
        Some("jazz (swing rhythms, chromatic passing notes)")
    } else if prompt_lower.contains("classical") {
        Some("classical (balanced phrases, clear melodic structure)")
    } else if prompt_lower.contains("pop") {
        Some("pop (catchy, repetitive patterns)")
    } else if prompt_lower.contains("ambient") {
        Some("ambient (sparse, atmospheric)")
    } else if prompt_lower.contains("blues") {
        Some("blues (use blue notes, call-and-response patterns)")
    } else {
        None
    };

    PromptStyle { mood, dynamics, rhythm, genre }
}

/// Build the system prompt for AI melody generation
///
/// This is the core prompt engineering function that constructs detailed instructions
/// for the AI model. The prompt includes:
/// 1. Role definition and output format (JSON schema)
/// 2. Scale constraints (if user selected a scale)
/// 3. Timing constraints (measures, beats, note boundaries)
/// 4. Style-specific guidance (based on prompt analysis)
/// 5. Musical best practices (structure, variety, expression)
///
/// The prompt is designed to balance creativity with musical validity. We use
/// explicit constraints (like allowed MIDI notes) alongside softer guidance
/// (like "create a clear melodic contour") to give the AI room for creativity
/// while ensuring the output is musically coherent and valid.
///
/// # Arguments
/// * `request` - The user's melody generation request with all parameters
///
/// # Returns
/// A complete system prompt string to be sent to the AI provider
pub fn build_system_prompt(request: &MelodyRequest) -> String {
    let mut prompt = String::from(
        "You are a professional melody composer. Generate musical melodies as structured JSON data.\n\n\
        Your output must be a JSON object with a 'notes' array. Each note must have:\n\
        - pitch: MIDI note number (0-127, where 60 is middle C)\n\
        - startTime: Start time in beats (floating point)\n\
        - duration: Note duration in beats (floating point, minimum 0.25)\n\
        - velocity: Note loudness (0-127, where 64 is normal, 100 is forte)\n\n"
    );

    // Add scale constraints if specified
    if let Some(scale) = &request.scale {
        let midi_notes = scale.get_midi_notes();
        prompt.push_str(&format!(
            "IMPORTANT: Only use notes from the {} {} scale. Allowed MIDI notes: {:?}\n\
            You may use any octave of these notes, but stick to the scale notes only.\n\n",
            scale.root, scale.mode, midi_notes
        ));
    }

    // Add timing constraints
    let total_beats = request.measures * 4; // Assuming 4/4 time signature
    prompt.push_str(&format!(
        "Generate a melody that fits within {} measures ({} beats total in 4/4 time).\n\
        CRITICAL: All notes must start at or before beat {} and end by beat {} at the latest.\n\
        Calculate: startTime + duration must be <= {}\n\
        Notes can have durations like 0.25 (16th note), 0.5 (8th note), 1.0 (quarter note), 2.0 (half note), etc.\n\n",
        request.measures, total_beats, total_beats, total_beats, total_beats
    ));

    // Analyze prompt for style keywords and add specific guidance
    let style = analyze_prompt_style(&request.prompt);
    prompt.push_str("Musical guidelines:\n");

    if let Some(mood) = style.mood {
        prompt.push_str(&format!("- Mood: Create a {} melody\n", mood));
    }

    if let Some(dynamics) = style.dynamics {
        prompt.push_str(&format!("- Dynamics: Use {}\n", dynamics));
    } else {
        prompt.push_str("- Dynamics: Use moderate dynamics (velocity 60-90) with some variation\n");
    }

    if let Some(rhythm) = style.rhythm {
        prompt.push_str(&format!("- Rhythm: Use {}\n", rhythm));
    }

    if let Some(genre) = style.genre {
        prompt.push_str(&format!("- Genre: Follow {} style conventions\n", genre));
    }

    prompt.push_str(
        "- Structure: Create a clear melodic contour with rises and falls\n\
        - Variety: Use rhythmic variety while maintaining coherence\n\
        - Expression: Make it sound natural and musically expressive\n\n"
    );

    // Add JSON format instructions
    prompt.push_str(
        "Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):\n\
        {\n  \
          \"notes\": [\n    \
            {\"pitch\": 60, \"startTime\": 0.0, \"duration\": 1.0, \"velocity\": 80},\n    \
            {\"pitch\": 62, \"startTime\": 1.0, \"duration\": 1.0, \"velocity\": 80}\n  \
          ]\n\
        }"
    );

    prompt
}

/// Build the user prompt combining the system prompt with the user's request
pub fn build_user_prompt(request: &MelodyRequest) -> String {
    format!(
        "Create a melody based on this description: {}\n\n\
        Requirements:\n\
        - Measures: {}\n\
        - Scale: {}\n\
        - Style: Match the mood and character described above\n\n\
        Generate the melody as JSON.",
        request.prompt,
        request.measures,
        if let Some(scale) = &request.scale {
            format!("{} {}", scale.root, scale.mode)
        } else {
            "Any (chromatic)".to_string()
        }
    )
}

/// Build an adjusted prompt for retry after validation failure
pub fn build_retry_prompt(request: &MelodyRequest, error_message: &str) -> String {
    let base_prompt = build_user_prompt(request);
    format!(
        "{}\n\n\
        IMPORTANT: The previous attempt failed validation with this error:\n\
        \"{}\"\n\n\
        Please carefully correct this issue and generate a valid melody that passes all constraints.",
        base_prompt,
        error_message
    )
}

/// Extract JSON from AI response, handling various formats
///
/// AI models often wrap JSON in markdown code blocks or include explanatory text.
/// This function handles multiple common formats:
/// 1. Markdown code blocks: ```json\n{...}\n```
/// 2. Generic code blocks: ```\n{...}\n```
/// 3. Text with embedded JSON: "Here's your melody: {...}"
/// 4. Plain JSON: {...}
///
/// The extraction uses a fallback strategy: try each format in order of specificity,
/// returning the first successful match.
///
/// # Arguments
/// * `response` - Raw text response from the AI provider
///
/// # Returns
/// `Some(String)` containing extracted JSON, or `None` if no valid JSON found
pub fn extract_json(response: &str) -> Option<String> {
    let response = response.trim();

    // Try to find JSON object in markdown code blocks (e.g., ```json\n{...}\n```)
    if let Some(start) = response.find("```json") {
        if let Some(end) = response[start..].find("```") {
            let json_start = start + 7; // Length of "```json"
            let json_end = start + end;
            return Some(response[json_start..json_end].trim().to_string());
        }
    }

    // Try to find JSON object in generic code blocks
    if let Some(start) = response.find("```") {
        if let Some(end) = response[start + 3..].find("```") {
            let json_start = start + 3;
            let json_end = start + 3 + end;
            let content = response[json_start..json_end].trim();
            // Skip the language identifier if present (e.g., "json\n{...}")
            let content = if let Some(newline) = content.find('\n') {
                content[newline..].trim()
            } else {
                content
            };
            return Some(content.to_string());
        }
    }

    // Try to find JSON object directly
    if let Some(start) = response.find('{') {
        if let Some(end) = response.rfind('}') {
            if end > start {
                return Some(response[start..=end].to_string());
            }
        }
    }

    // Return the whole response if it looks like JSON
    if response.starts_with('{') && response.ends_with('}') {
        return Some(response.to_string());
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_json_from_markdown() {
        let response = r#"
Here's your melody:

```json
{"notes": [{"pitch": 60, "startTime": 0.0, "duration": 1.0, "velocity": 80}]}
```
        "#;

        let json = extract_json(response).unwrap();
        assert!(json.contains("\"notes\""));
    }

    #[test]
    fn test_extract_json_plain() {
        let response = r#"{"notes": [{"pitch": 60, "startTime": 0.0, "duration": 1.0, "velocity": 80}]}"#;

        let json = extract_json(response).unwrap();
        assert!(json.contains("\"notes\""));
    }

    #[test]
    fn test_extract_json_with_text() {
        let response = r#"
Here is the melody: {"notes": [{"pitch": 60, "startTime": 0.0, "duration": 1.0, "velocity": 80}]}
        "#;

        let json = extract_json(response).unwrap();
        assert!(json.contains("\"notes\""));
    }

    #[test]
    fn test_build_system_prompt_with_scale() {
        let request = MelodyRequest {
            prompt: "Happy melody".to_string(),
            scale: Some(Scale {
                root: "C".to_string(),
                mode: "major".to_string(),
            }),
            measures: 4,
            model_provider: crate::ai_models::AIProvider::OpenAI,
            temperature: Some(1.0),
        };

        let prompt = build_system_prompt(&request);
        assert!(prompt.contains("C major"));
        assert!(prompt.contains("16 beats"));
    }
}
