# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Tauri-based desktop piano player application with a React frontend and Rust backend.

```
piano-app/
├── src/                         # React frontend
│   ├── components/              # UI components
│   ├── hooks/                   # React hooks (usePlayback, useNotes, useTracks)
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Helper functions
│   └── context/                 # React context providers
├── src-tauri/                   # Rust backend
│   └── src/
│       ├── lib.rs               # Tauri commands and state management
│       └── audio.rs             # Audio engine with rodio
└── tauri_piano_specs.md         # Project specifications
```

## Development Commands

Working directory for all commands: root directory (`piano-app/`)

### Development
- **Start dev server**: `npm run dev` (Vite dev server at localhost:1420)
- **Start Tauri app**: `npm run tauri dev` (launches desktop app with hot reload)
- **Build for production**: `npm run build` (TypeScript + Vite build)
- **Build Tauri app**: `npm run tauri build`

### Rust Backend
- Navigate to `src-tauri/` for Rust-specific commands
- **Check Rust code**: `cargo check`
- **Run tests**: `cargo test`
- **Format code**: `cargo fmt`

## Architecture Overview

### Frontend Architecture

**State Management**: Custom React hooks provide centralized state management:
- `useNotes()` - Note CRUD operations, selection, moving, resizing
- `useTracks()` - Multi-track management with independent tempos
- `usePlayback()` - Playback engine with track-aware timing

**Key Components**:
- `PianoRoll` - Main canvas for note display and interaction
- `PianoKeys` - Left sidebar showing note names
- `TimeRuler` - Top timeline showing measures/beats
- `Playhead` - Moving vertical line during playback
- `TransportControls` - Play/pause/stop buttons
- `TrackPanel` - Multi-track controls (mute/solo/tempo)
- `VisualPiano` - Interactive piano keyboard at bottom

**Data Flow**:
1. User interaction in components → Hook functions
2. Hook updates state → Re-renders affected components
3. Playback triggers → `usePlayback` calls `onNotePlay` callback
4. Callback invokes Tauri command → Rust audio engine plays sound

### Backend Architecture

**Audio Engine** (`src-tauri/src/audio.rs`):
- Uses `rodio` for audio output
- Generates notes with ADSR envelope
- Supports two sound modes:
  - **Piano**: Harmonics-based synthesis with overtones (more realistic)
  - **Synthesizer**: Simple sine wave synthesis
- MIDI pitch to frequency conversion (A4 = 440Hz)

**Tauri Commands** (`src-tauri/src/lib.rs`):
- `play_note(pitch, duration, velocity)` - Play a single note
- `stop_all_notes()` - Stop all playing notes
- `set_volume(volume)` - Set master volume (0.0-1.0)
- `set_sound_mode(mode)` - Switch between "piano" and "synthesizer"
- `get_sound_mode()` - Get current sound mode
- `save_project(notes, tempo, name, path)` - Save to JSON
- `load_project(path)` - Load from JSON

**Thread Safety**:
- Audio engine wrapped in `Mutex` for thread-safe access
- `OutputStream` wrapped in custom `StreamWrapper` with unsafe Send/Sync impl (safe because accessed only from main thread)

### Multi-Track System

Each track has independent:
- Tempo (BPM)
- Volume
- Mute/Solo state
- Color for visual distinction

Playback engine (`usePlayback.ts:62-141`):
- Maintains separate time counters per track
- Calculates delta beats based on each track's tempo
- Respects mute/solo states when triggering notes
- Loops automatically when all tracks finish

## Key Data Structures

```typescript
interface Note {
  id: string;
  pitch: number;        // MIDI (0-127)
  startTime: number;    // In beats
  duration: number;     // In beats
  velocity: number;     // Volume (0-127)
  trackId: string;
}

interface Track {
  id: string;
  name: string;
  tempo: number;        // BPM
  color: string;
  volume: number;       // 0-1
  muted: boolean;
  solo: boolean;
}
```

## Important Implementation Details

### Grid System
- Time is measured in **beats**, not seconds
- `gridSettings.pixelsPerBeat` controls horizontal zoom
- `gridSettings.noteHeight` controls vertical spacing
- `gridSettings.snapToGrid` enables quantization
- `gridSettings.gridDivision` sets snap resolution (4 = quarter notes, 8 = eighth notes)

### Keyboard Controls
- **QWERTY keys** mapped to piano notes (see `KeyboardGuide.tsx`)
- **Space** - Play/pause
- **Delete/Backspace** - Remove selected notes
- **Escape** - Clear selection
- Real-time keyboard playback bypasses the sequencer

### Project Import/Export
- Projects saved as JSON with notes, tracks, metadata
- Export: `projectUtils.ts:exportProject()` - creates downloadable JSON
- Import: `projectUtils.ts:importProject()` - validates and loads JSON
- Validation: `projectUtils.ts:validateProject()` - checks structure

### Sound Generation
Piano mode uses 6 harmonics (1x, 2x, 3x, 4x, 5x, 6x fundamental) with decreasing amplitudes and slight detuning for warmth. Different ADSR envelopes for piano (fast attack, long release) vs synthesizer (balanced envelope).

## Common Pitfalls

1. **Time Units**: Always use beats for note timing, not seconds. Tempo conversion happens in playback engine.

2. **Track Association**: Every note must have a valid `trackId`. Creating notes without selecting a track will cause issues.

3. **Audio Thread Safety**: Never access audio engine outside Tauri commands. Always use `State<AppState>` parameter.

4. **Vite Port**: Dev server must run on port 1420 (hardcoded in `vite.config.ts`). Don't change this without updating Tauri config.

5. **Note IDs**: Use `crypto.randomUUID()` for note IDs (see `useNotes.ts:28`). Ensures uniqueness for playback tracking.

## Testing the App

When making changes:
1. Test keyboard playback (QWERTY keys)
2. Test mouse note creation (click & drag on piano roll)
3. Test playback with multiple tracks at different tempos
4. Test mute/solo functionality
5. Test export/import cycle
6. Test sound mode switching (piano vs synthesizer)

## Building for macOS

The app is configured for macOS (Apple Silicon and Intel):
- Tauri v2.x with React 19
- Tailwind CSS v4 for styling
- TypeScript for type safety
- Rust dependencies: rodio 0.19, cpal 0.15, serde, chrono
- don’t run the app yourself i already have it running myself
- when completing a phase in a todo file, don’t create a summary file. It’s enough with your cli output