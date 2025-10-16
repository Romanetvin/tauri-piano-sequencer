mod audio;
mod sample_player;
mod ai_models;
mod ai_client;
mod ai_prompts;
mod api_key_storage;

use audio::{AudioEngine, SoundMode};
use sample_player::SamplePlayer;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;
use ai_models::{AIProvider, MelodyRequest, MelodyResponse, Scale as AIScale};
use ai_client::create_client;
use api_key_storage::ApiKeyManager;
use validator::Validate;

// Wrapper for OutputStream to make it Send + Sync
// SAFETY: OutputStream is thread-safe but doesn't implement Send/Sync on macOS due to CoreAudio FFI
// We ensure it's only accessed from the main thread
#[allow(dead_code)]
struct StreamWrapper(rodio::OutputStream);
unsafe impl Send for StreamWrapper {}
unsafe impl Sync for StreamWrapper {}

// Audio playback mode - wrapped in Arc for shared access
enum AudioPlayer {
    Samples(Arc<SamplePlayer>),
    Synthesized(Arc<Mutex<AudioEngine>>),
}

// Audio engine state
struct AppState {
    audio_player: AudioPlayer,
    _stream: Arc<StreamWrapper>,
    api_key_manager: Arc<Mutex<ApiKeyManager>>,
}

#[derive(Serialize, Deserialize)]
struct Note {
    id: String,
    pitch: u8,
    start_time: f32,
    duration: f32,
    velocity: u8,
}

#[derive(Serialize, Deserialize)]
struct ProjectData {
    notes: Vec<Note>,
    tempo: u16,
    name: String,
    created_at: String,
}

/// Play a single note
#[tauri::command]
fn play_note(pitch: u8, duration: f32, velocity: u8, state: State<AppState>) -> Result<(), String> {
    // Use Arc to allow concurrent playback - no mutex needed for read-only operations
    match &state.audio_player {
        AudioPlayer::Samples(sample_player) => {
            // SamplePlayer is read-only during playback, Arc allows concurrent access
            sample_player.play_note(pitch, duration, velocity)
        },
        AudioPlayer::Synthesized(audio_engine) => {
            // AudioEngine needs mutex only for reading volume/mode, not for sample generation
            let engine = audio_engine.lock().unwrap();
            engine.play_note(pitch, duration, velocity)
        }
    }
}

/// Stop all currently playing notes
#[tauri::command]
fn stop_all_notes(state: State<AppState>) -> Result<(), String> {
    match &state.audio_player {
        AudioPlayer::Samples(_) => Ok(()), // Sample player doesn't support stop yet
        AudioPlayer::Synthesized(audio_engine) => {
            let engine = audio_engine.lock().unwrap();
            engine.stop_all_notes()
        }
    }
}

/// Set the master volume (0.0 to 1.0)
#[tauri::command]
fn set_volume(volume: f32, state: State<AppState>) -> Result<(), String> {
    match &state.audio_player {
        AudioPlayer::Samples(_) => {
            // Sample player volume is immutable after creation
            // Would need to redesign to support dynamic volume
            Err("Volume control not supported for sample playback".to_string())
        },
        AudioPlayer::Synthesized(audio_engine) => {
            let mut engine = audio_engine.lock().unwrap();
            engine.set_volume(volume)
        }
    }
}

/// Set the sound mode (piano or synthesizer)
#[tauri::command]
fn set_sound_mode(mode: String, state: State<AppState>) -> Result<(), String> {
    match &state.audio_player {
        AudioPlayer::Samples(_) => Err("Cannot change sound mode when using samples".to_string()),
        AudioPlayer::Synthesized(audio_engine) => {
            let mut engine = audio_engine.lock().unwrap();
            let sound_mode = match mode.as_str() {
                "piano" => SoundMode::Piano,
                "synthesizer" => SoundMode::Synthesizer,
                _ => return Err(format!("Invalid sound mode: {}", mode)),
            };
            engine.set_sound_mode(sound_mode)
        }
    }
}

/// Get the current sound mode
#[tauri::command]
fn get_sound_mode(state: State<AppState>) -> Result<String, String> {
    match &state.audio_player {
        AudioPlayer::Samples(_) => Ok("samples".to_string()),
        AudioPlayer::Synthesized(audio_engine) => {
            let engine = audio_engine.lock().unwrap();
            let mode = match engine.get_sound_mode() {
                SoundMode::Piano => "piano",
                SoundMode::Synthesizer => "synthesizer",
            };
            Ok(mode.to_string())
        }
    }
}

/// Save project to a JSON file
#[tauri::command]
fn save_project(notes: Vec<Note>, tempo: u16, name: String, path: String) -> Result<(), String> {
    use std::fs;

    let project_data = ProjectData {
        notes,
        tempo,
        name,
        created_at: chrono::Local::now().to_rfc3339(),
    };

    let json = serde_json::to_string_pretty(&project_data)
        .map_err(|e| format!("Failed to serialize project: {}", e))?;

    fs::write(&path, json)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

/// Load project from a JSON file
#[tauri::command]
fn load_project(path: String) -> Result<ProjectData, String> {
    use std::fs;

    let json = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let project_data: ProjectData = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse project file: {}", e))?;

    Ok(project_data)
}

// ============================================================================
// AI Melody Generation Commands
// ============================================================================

/// Generate a melody using AI
#[tauri::command]
async fn generate_melody(
    prompt: String,
    scale: Option<AIScale>,
    measures: Option<u32>,
    provider: String,
    temperature: Option<f32>,
    state: State<'_, AppState>,
) -> Result<MelodyResponse, String> {
    // Parse provider
    let ai_provider = AIProvider::from_str(&provider)
        .ok_or_else(|| format!("Invalid AI provider: {}", provider))?;

    // Get API key (clone to avoid holding lock across await)
    let api_key = {
        let api_key_manager = state.api_key_manager.lock().unwrap();
        api_key_manager
            .get_api_key(&ai_provider)
            .map_err(|e| format!("Failed to get API key: {}", e))?
            .ok_or_else(|| format!("No API key configured for {}", provider))?
    };

    // Build request
    let mut request = MelodyRequest {
        prompt,
        scale,
        measures: measures.unwrap_or(4),
        model_provider: ai_provider.clone(),
        temperature,
    };

    // Sanitize inputs before validation
    request.sanitize_prompt();

    // Validate request
    request.validate()
        .map_err(|e| format!("Invalid request: {}", e))?;

    // Create client and generate melody with retry mechanism
    let client = create_client(&ai_provider);
    let response = client
        .generate_melody_with_retry(&request, &api_key)
        .await
        .map_err(|e| format!("Failed to generate melody: {}", e))?;

    Ok(response)
}

/// Save an API key for an AI provider
#[tauri::command]
fn save_ai_api_key(
    provider: String,
    api_key: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let ai_provider = AIProvider::from_str(&provider)
        .ok_or_else(|| format!("Invalid AI provider: {}", provider))?;

    // Validate and sanitize API key
    let sanitized_key = api_key.trim();
    if sanitized_key.is_empty() {
        return Err("API key cannot be empty".to_string());
    }
    if sanitized_key.len() > 500 {
        return Err("API key too long (max 500 characters)".to_string());
    }
    // Check for control characters (potential injection)
    if sanitized_key.chars().any(|c| c.is_control()) {
        return Err("API key contains invalid characters".to_string());
    }

    let api_key_manager = state.api_key_manager.lock().unwrap();
    api_key_manager
        .save_api_key(&ai_provider, sanitized_key)
        .map_err(|e| format!("Failed to save API key: {}", e))?;

    Ok(())
}

/// Delete an API key for an AI provider
#[tauri::command]
fn delete_ai_api_key(
    provider: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let ai_provider = AIProvider::from_str(&provider)
        .ok_or_else(|| format!("Invalid AI provider: {}", provider))?;

    let api_key_manager = state.api_key_manager.lock().unwrap();
    api_key_manager
        .delete_api_key(&ai_provider)
        .map_err(|e| format!("Failed to delete API key: {}", e))?;

    Ok(())
}

/// Get list of configured AI providers
#[tauri::command]
fn get_configured_ai_providers(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let api_key_manager = state.api_key_manager.lock().unwrap();
    let providers = api_key_manager
        .list_configured_providers()
        .map_err(|e| format!("Failed to get providers: {}", e))?;

    let provider_names: Vec<String> = providers
        .iter()
        .map(|p| p.as_str().to_string())
        .collect();

    Ok(provider_names)
}

/// Test if an AI provider connection works
#[tauri::command]
async fn test_ai_connection(
    provider: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let ai_provider = AIProvider::from_str(&provider)
        .ok_or_else(|| format!("Invalid AI provider: {}", provider))?;

    // Get API key (clone to avoid holding lock across await)
    let api_key = {
        let api_key_manager = state.api_key_manager.lock().unwrap();
        api_key_manager
            .get_api_key(&ai_provider)
            .map_err(|e| format!("Failed to get API key: {}", e))?
            .ok_or_else(|| "No API key configured".to_string())?
    };

    // Try a simple test request
    let test_request = MelodyRequest {
        prompt: "Test connection".to_string(),
        scale: None,
        measures: 1,
        model_provider: ai_provider.clone(),
        temperature: Some(1.0),
    };

    let client = create_client(&ai_provider);
    match client.generate_melody(&test_request, &api_key).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Connection test failed: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Try to load piano samples first, fall back to synthesized audio if unavailable
    let (audio_player, stream) = match SamplePlayer::new() {
        Ok((sample_player, stream)) => {
            println!("✓ Using piano samples ({} loaded)", sample_player.sample_count());
            (AudioPlayer::Samples(Arc::new(sample_player)), stream)
        }
        Err(e) => {
            eprintln!("⚠ Failed to load piano samples: {}", e);
            eprintln!("→ Using synthesized audio instead");
            let (audio_engine, stream) = AudioEngine::new()
                .expect("Failed to initialize audio engine");
            (AudioPlayer::Synthesized(Arc::new(Mutex::new(audio_engine))), stream)
        }
    };

    // Initialize API key manager with default app data path
    let app_data_dir = std::env::current_dir()
        .expect("Failed to get current directory")
        .join(".piano-app-data");
    let api_key_manager = ApiKeyManager::new(app_data_dir)
        .expect("Failed to initialize API key manager");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            audio_player,
            _stream: Arc::new(StreamWrapper(stream)),
            api_key_manager: Arc::new(Mutex::new(api_key_manager)),
        })
        .invoke_handler(tauri::generate_handler![
            play_note,
            stop_all_notes,
            set_volume,
            set_sound_mode,
            get_sound_mode,
            save_project,
            load_project,
            generate_melody,
            save_ai_api_key,
            delete_ai_api_key,
            get_configured_ai_providers,
            test_ai_connection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
