use crate::ai_models::{MelodyRequest, Scale};

/// Style information extracted from user prompt
#[derive(Debug)]
struct PromptStyle {
    mood: Option<&'static str>,
    dynamics: Option<&'static str>,
    rhythm: Option<&'static str>,
    genre: Option<&'static str>,
    articulation: Option<&'static str>,
    texture: Option<&'static str>,
    direction: Option<&'static str>,
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

    // Articulation keywords
    let articulation = if prompt_lower.contains("staccato") || prompt_lower.contains("detached") || prompt_lower.contains("short") {
        Some("staccato articulation (short, detached notes with duration 0.25-0.5)")
    } else if prompt_lower.contains("legato") || prompt_lower.contains("connected") || prompt_lower.contains("smooth") {
        Some("legato articulation (smooth, connected notes with longer durations)")
    } else if prompt_lower.contains("marcato") || prompt_lower.contains("accented") {
        Some("marcato articulation (accented notes with higher velocity)")
    } else {
        None
    };

    // Texture keywords
    let texture = if prompt_lower.contains("arpeggiated") || prompt_lower.contains("broken") {
        Some("arpeggiated texture (spread chord notes across time)")
    } else if prompt_lower.contains("minimalist") || prompt_lower.contains("sparse") {
        Some("minimalist texture (fewer notes, more space between them)")
    } else if prompt_lower.contains("dense") || prompt_lower.contains("rich") || prompt_lower.contains("layered") {
        Some("dense texture (more simultaneous notes and activity)")
    } else if prompt_lower.contains("lyrical") {
        Some("lyrical texture (song-like, expressive melodic lines)")
    } else {
        None
    };

    // Direction keywords
    let direction = if prompt_lower.contains("ascending") || prompt_lower.contains("rising") || prompt_lower.contains("upward") {
        Some("ascending melodic motion (notes generally move upward)")
    } else if prompt_lower.contains("descending") || prompt_lower.contains("falling") || prompt_lower.contains("downward") {
        Some("descending melodic motion (notes generally move downward)")
    } else if prompt_lower.contains("stepwise") || prompt_lower.contains("scalar") {
        Some("stepwise motion (notes move by small intervals)")
    } else if prompt_lower.contains("leaping") || prompt_lower.contains("angular") || prompt_lower.contains("wide intervals") {
        Some("leaping motion (notes move by larger intervals)")
    } else {
        None
    };

    PromptStyle { mood, dynamics, rhythm, genre, articulation, texture, direction }
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
        OUTPUT FORMAT:\n\
        Your output must be a JSON object with a 'notes' array. Each note must have:\n\
        - pitch: MIDI note number (0-127, where 60 is middle C)\n\
        - startTime: Start time in beats (floating point)\n\
        - duration: Note duration in beats (floating point, minimum 0.25)\n\
        - velocity: Note loudness (0-127, where 64 is normal, 100 is forte)\n\n"
    );

    // Add scale constraints if specified
    if let Some(scale) = &request.scale {
        let octave = scale.octave.unwrap_or(4);
        let chord_octave_start = octave;
        let chord_octave_end = octave + 1;
        let melody_octave_start = octave + 2;
        let melody_octave_end = octave + 3;

        // Calculate MIDI note of root in each octave range
        // MIDI formula: octave starts at (octave-1)*12, C4=60, C5=72, etc.
        let root_offset = Scale::note_to_offset(&scale.root);
        let chord_root_midi = ((chord_octave_start + 1) * 12 + root_offset as u8) as i32;
        let melody_root_midi = ((melody_octave_start + 1) * 12 + root_offset as u8) as i32;

        let midi_notes = scale.get_midi_notes();

        // Filter notes by octave range for examples
        let chord_example_notes: Vec<u8> = midi_notes.iter()
            .filter(|&&n| n >= chord_root_midi as u8 && n < (chord_root_midi + 24) as u8)
            .copied()
            .take(7)
            .collect();
        let melody_example_notes: Vec<u8> = midi_notes.iter()
            .filter(|&&n| n >= melody_root_midi as u8 && n < (melody_root_midi + 24) as u8)
            .copied()
            .take(7)
            .collect();

        prompt.push_str(&format!(
            "SCALE REQUIREMENTS:\n\
            - Use only notes from the {} {} scale\n\
            - Allowed MIDI notes: {:?}\n\n\
            REGISTER GUIDELINES:\n\
            - Harmony (chords): Use octaves {} to {} - MIDI examples: {:?}\n\
            - Melody (lead line): Use octaves {} to {} - MIDI examples: {:?}\n\
            - Create contrast by placing melody in higher register (MIDI {}+) and chords in lower register (MIDI {}+)\n\n\
            ARRANGEMENT SUGGESTIONS:\n\
            - Build a complete musical arrangement with both harmonic foundation and melodic line\n\
            - Chords: Consider using 3+ simultaneous notes for harmonic support\n\
            - Chord durations can vary (1.0, 2.0, or 4.0 beats) based on desired harmonic rhythm\n\
            - Melody: Craft an expressive single-note line that stands out above the harmony\n\
            - For sparse or minimalist styles, chords are optional - focus on the melodic line\n\
            - Balance: Ensure the melody is distinct and the chords provide support without overwhelming\n\n",
            scale.root, scale.mode, midi_notes,
            chord_octave_start, chord_octave_end,
            chord_example_notes,
            melody_octave_start, melody_octave_end,
            melody_example_notes,
            melody_root_midi,
            chord_root_midi
        ));
    }

    // Add timing constraints
    let total_beats = request.measures * 4; // Assuming 4/4 time signature
    prompt.push_str(&format!(
        "TIMING CONSTRAINTS:\n\
        - Duration: {} measures ({} beats total in 4/4 time)\n\
        - All notes must fit within this timeframe: startTime + duration <= {}\n\
        - Note durations: 0.25 (16th), 0.5 (8th), 1.0 (quarter), 2.0 (half), 4.0 (whole)\n\n",
        request.measures, total_beats, total_beats
    ));

    // Analyze prompt for style keywords and add specific guidance
    let style = analyze_prompt_style(&request.prompt);
    prompt.push_str("MUSICAL GUIDELINES:\n");

    if let Some(mood) = style.mood {
        prompt.push_str(&format!("- Mood: Create a {} melody\n", mood));
    }

    if let Some(dynamics) = style.dynamics {
        prompt.push_str(&format!("- Dynamics: Use {}\n", dynamics));
    } else {
        prompt.push_str("- Dynamics: Use moderate dynamics (velocity 60-90) with some variation\n");
    }

    if let Some(rhythm) = style.rhythm {
        prompt.push_str(&format!("- Rhythm: {}\n", rhythm));
    }

    if let Some(genre) = style.genre {
        prompt.push_str(&format!("- Genre: Follow {} style conventions\n", genre));
    }

    if let Some(articulation) = style.articulation {
        prompt.push_str(&format!("- Articulation: Use {}\n", articulation));
    }

    if let Some(texture) = style.texture {
        prompt.push_str(&format!("- Texture: Create {}\n", texture));
    }

    if let Some(direction) = style.direction {
        prompt.push_str(&format!("- Direction: Use {}\n", direction));
    }

    prompt.push_str("\n");

    // Add temperature-based creativity guidance
    if let Some(temperature) = request.temperature {
        if temperature < 0.5 {
            prompt.push_str(
                "CREATIVE APPROACH:\n\
                - Focus on conventional melodic patterns and traditional harmonic progressions\n\
                - Use predictable phrase lengths and standard rhythmic divisions\n\
                - Prefer stepwise motion and common chord progressions\n\
                - Create a safe, familiar-sounding composition\n\n"
            );
        } else if temperature > 1.5 {
            prompt.push_str(
                "CREATIVE APPROACH:\n\
                - Feel free to experiment with unexpected intervals and surprising rhythms\n\
                - Try unconventional phrase lengths and asymmetric structures\n\
                - Explore unusual melodic leaps and unexpected harmonic moves\n\
                - Take creative risks to make a unique, distinctive composition\n\n"
            );
        } else {
            prompt.push_str(
                "CREATIVE APPROACH:\n\
                - Balance familiar patterns with moments of surprise\n\
                - Mix conventional structures with creative variations\n\
                - Combine predictable and unexpected elements for interest\n\n"
            );
        }
    }

    // Add musical pattern guidance
    prompt.push_str(
        "MELODIC DEVELOPMENT:\n\
        - Create memorable themes using repetition and variation\n\
        - Use phrase structure (typically 2-4 measure phrases that create musical sentences)\n\
        - Build a melodic arc with a clear contour: gradual rise, climax, and resolution\n\
        - Add rhythmic interest through varied note lengths and occasional syncopation\n\
        - Balance stepwise motion (small intervals) with occasional leaps for drama\n\
        - Create coherence by repeating motifs while introducing subtle variations\n\n"
    );

    // Add JSON format instructions
    prompt.push_str(
        "OUTPUT FORMAT:\n\
        Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):\n\
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
        let json_start = start + 7; // Length of "```json"
        if let Some(end) = response[json_start..].find("```") {
            let json_end = json_start + end;
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
    use crate::ai_models::Scale;

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
                octave: Some(4),
            }),
            measures: 4,
            model_provider: crate::ai_models::AIProvider::OpenAI,
            temperature: Some(1.0),
        };

        let prompt = build_system_prompt(&request);
        assert!(prompt.contains("C major"));
        assert!(prompt.contains("16 beats"));
        assert!(prompt.contains("SCALE REQUIREMENTS"));
        assert!(prompt.contains("MUSICAL GUIDELINES"));
        assert!(prompt.contains("MELODIC DEVELOPMENT"));
    }

    #[test]
    fn test_prompt_style_detection() {
        let prompt = "Fast staccato ascending jazz melody";
        let style = analyze_prompt_style(prompt);

        assert!(style.rhythm.is_some());
        assert!(style.articulation.is_some());
        assert!(style.direction.is_some());
        assert!(style.genre.is_some());
    }

    #[test]
    fn test_temperature_guidance_low() {
        let request = MelodyRequest {
            prompt: "Simple melody".to_string(),
            scale: None,
            measures: 4,
            model_provider: crate::ai_models::AIProvider::OpenAI,
            temperature: Some(0.3),
        };

        let prompt = build_system_prompt(&request);
        assert!(prompt.contains("conventional"));
        assert!(prompt.contains("CREATIVE APPROACH"));
    }

    #[test]
    fn test_temperature_guidance_high() {
        let request = MelodyRequest {
            prompt: "Experimental melody".to_string(),
            scale: None,
            measures: 4,
            model_provider: crate::ai_models::AIProvider::OpenAI,
            temperature: Some(1.8),
        };

        let prompt = build_system_prompt(&request);
        assert!(prompt.contains("experiment"));
        assert!(prompt.contains("creative risks"));
    }
}
