use crate::ai_models::{MelodyRequest, Scale};

/// Build the system prompt for AI melody generation
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
            "IMPORTANT: Only use notes from the {} {} scale. Allowed MIDI notes: {:?}\n\n",
            scale.root, scale.mode, midi_notes
        ));
    }

    // Add timing constraints
    let total_beats = request.measures * 4; // Assuming 4/4 time signature
    prompt.push_str(&format!(
        "Generate a melody that fits within {} measures ({} beats total in 4/4 time).\n\
        Notes should start between beat 0 and beat {}.\n\
        Notes can have durations like 0.25 (16th note), 0.5 (8th note), 1.0 (quarter note), 2.0 (half note), etc.\n\n",
        request.measures, total_beats, total_beats
    ));

    // Add style guidance based on prompt keywords
    prompt.push_str(
        "Create a musically coherent melody that:\n\
        - Has a clear melodic contour (rise and fall)\n\
        - Uses appropriate rhythmic variety\n\
        - Fits the requested style and mood\n\
        - Sounds natural and expressive\n\n"
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

/// Extract JSON from AI response, handling various formats
pub fn extract_json(response: &str) -> Option<String> {
    let response = response.trim();

    // Try to find JSON object in markdown code blocks
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
