mod audio;
mod sample_player;

use audio::{AudioEngine, SoundMode};
use sample_player::SamplePlayer;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

// Wrapper for OutputStream to make it Send + Sync
// SAFETY: OutputStream is thread-safe but doesn't implement Send/Sync on macOS due to CoreAudio FFI
// We ensure it's only accessed from the main thread
#[allow(dead_code)]
struct StreamWrapper(rodio::OutputStream);
unsafe impl Send for StreamWrapper {}
unsafe impl Sync for StreamWrapper {}

// Audio playback mode
enum AudioPlayer {
    Samples(SamplePlayer),
    Synthesized(AudioEngine),
}

// Audio engine state
struct AppState {
    audio_player: Mutex<AudioPlayer>,
    _stream: Arc<StreamWrapper>,
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
    let player = state.audio_player.lock().unwrap();
    match &*player {
        AudioPlayer::Samples(sample_player) => sample_player.play_note(pitch, duration, velocity),
        AudioPlayer::Synthesized(audio_engine) => audio_engine.play_note(pitch, duration, velocity),
    }
}

/// Stop all currently playing notes
#[tauri::command]
fn stop_all_notes(state: State<AppState>) -> Result<(), String> {
    let player = state.audio_player.lock().unwrap();
    match &*player {
        AudioPlayer::Samples(_) => Ok(()), // Sample player doesn't support stop yet
        AudioPlayer::Synthesized(audio_engine) => audio_engine.stop_all_notes(),
    }
}

/// Set the master volume (0.0 to 1.0)
#[tauri::command]
fn set_volume(volume: f32, state: State<AppState>) -> Result<(), String> {
    let mut player = state.audio_player.lock().unwrap();
    match &mut *player {
        AudioPlayer::Samples(sample_player) => sample_player.set_volume(volume),
        AudioPlayer::Synthesized(audio_engine) => audio_engine.set_volume(volume),
    }
}

/// Set the sound mode (piano or synthesizer)
#[tauri::command]
fn set_sound_mode(mode: String, state: State<AppState>) -> Result<(), String> {
    let mut player = state.audio_player.lock().unwrap();
    match &mut *player {
        AudioPlayer::Samples(_) => Err("Cannot change sound mode when using samples".to_string()),
        AudioPlayer::Synthesized(audio_engine) => {
            let sound_mode = match mode.as_str() {
                "piano" => SoundMode::Piano,
                "synthesizer" => SoundMode::Synthesizer,
                _ => return Err(format!("Invalid sound mode: {}", mode)),
            };
            audio_engine.set_sound_mode(sound_mode)
        }
    }
}

/// Get the current sound mode
#[tauri::command]
fn get_sound_mode(state: State<AppState>) -> Result<String, String> {
    let player = state.audio_player.lock().unwrap();
    match &*player {
        AudioPlayer::Samples(_) => Ok("samples".to_string()),
        AudioPlayer::Synthesized(audio_engine) => {
            let mode = match audio_engine.get_sound_mode() {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Try to load sample player first, fall back to synthesized audio
    let (audio_player, stream) = match SamplePlayer::new() {
        Ok((sample_player, stream)) => {
            (AudioPlayer::Samples(sample_player), stream)
        }
        Err(_) => {
            let (audio_engine, stream) = AudioEngine::new().expect("Failed to initialize audio engine");
            (AudioPlayer::Synthesized(audio_engine), stream)
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            audio_player: Mutex::new(audio_player),
            _stream: Arc::new(StreamWrapper(stream)),
        })
        .invoke_handler(tauri::generate_handler![
            play_note,
            stop_all_notes,
            set_volume,
            set_sound_mode,
            get_sound_mode,
            save_project,
            load_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
