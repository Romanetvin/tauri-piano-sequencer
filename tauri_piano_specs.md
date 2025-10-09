# Tauri Piano Player - Project Specifications

## Project Overview
Build a desktop piano player application for macOS using Tauri (Rust backend) and React (frontend). The app displays a piano roll interface similar to music production software, where notes are represented as rectangles on a grid, with a time slider for playback.

## Technology Stack
- **Framework**: Tauri v1.x or v2.x
- **Frontend**: React 18+ with TypeScript
- **Backend**: Rust
- **Audio**: Use a Rust audio library (e.g., `rodio` or `cpal`)
- **Styling**: Tailwind CSS
- **Build Target**: macOS (Apple Silicon and Intel compatible)

## Core Features

### 1. Piano Roll Interface
- **Grid Display**:
  - Horizontal axis: Time (measures/beats)
  - Vertical axis: Notes (showing multiple octaves, e.g., C1 to C7)
  - Grid lines for beat divisions
  
- **Note Representation**:
  - Each note displayed as a colored rectangle
  - Rectangle width represents note duration
  - Rectangle position represents pitch (vertical) and timing (horizontal)
  - Hovering over a note shows its details (note name, octave, duration)

- **Visual Design**:
  - Piano keys on the left side showing note names (C, D, E, F, G, A, B)
  - Black keys (sharps/flats) visually distinguished
  - Alternating row colors for visual clarity
  - Zoom controls for horizontal (time) and vertical (octaves) scaling

### 2. Playback System
- **Time Slider/Playhead**:
  - Vertical line that moves across the piano roll during playback
  - Shows current playback position
  - Click anywhere on the timeline to jump to that position
  
- **Playback Controls**:
  - Play/Pause button
  - Stop button (returns to start)
  - Tempo control (BPM adjustment)
  - Volume control

- **Audio Engine** (Rust Backend):
  - Synthesize piano notes using sine waves or pre-loaded samples
  - Support simultaneous note playback (polyphony)
  - Accurate timing synchronized with visual playback

### 3. Note Management
- **Add Notes**:
  - Click and drag on the grid to create new notes
  - Snap to grid based on time division setting
  
- **Edit Notes**:
  - Click to select notes
  - Drag to move notes (change pitch or timing)
  - Resize handles to adjust duration
  - Delete key to remove selected notes

- **Multiple Octaves**:
  - Display at least 4-6 octaves
  - Scroll vertically to see all octaves
  - Ability to collapse/expand octave ranges

## Technical Requirements

### Frontend (React + TypeScript)

#### Components Structure
```
src/
├── components/
│   ├── PianoRoll.tsx          # Main piano roll canvas
│   ├── Note.tsx                # Individual note rectangle
│   ├── Playhead.tsx            # Time slider indicator
│   ├── PianoKeys.tsx           # Left sidebar with key names
│   ├── TimeRuler.tsx           # Top timeline ruler
│   ├── TransportControls.tsx  # Play/pause/stop buttons
│   └── SettingsPanel.tsx      # Tempo, volume controls
├── hooks/
│   ├── usePlayback.ts          # Playback state management
│   └── useNotes.ts             # Note data management
├── types/
│   └── index.ts                # TypeScript interfaces
└── utils/
    └── noteUtils.ts            # Helper functions
```

#### Key Data Structures
```typescript
interface Note {
  id: string;
  pitch: number;        // MIDI note number (0-127)
  startTime: number;    // In beats or milliseconds
  duration: number;     // In beats or milliseconds
  velocity: number;     // Volume (0-127)
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  tempo: number;        // BPM
  volume: number;       // 0-1
}
```

### Backend (Rust)

#### Tauri Commands
```rust
// Audio playback commands
#[tauri::command]
fn play_note(pitch: u8, duration: f32, velocity: u8) -> Result<(), String>

#[tauri::command]
fn stop_all_notes() -> Result<(), String>

#[tauri::command]
fn set_volume(volume: f32) -> Result<(), String>

// State management
#[tauri::command]
fn save_project(notes: Vec<Note>, path: String) -> Result<(), String>

#[tauri::command]
fn load_project(path: String) -> Result<Vec<Note>, String>
```

#### Audio Implementation
- Use `rodio` crate for audio playback
- Generate simple sine wave tones for each note
- Implement envelope (ADSR) for natural sound
- Handle multiple simultaneous notes
- Ensure low latency for responsive playback

### File Format
- Save/load projects as JSON files containing:
  - Array of notes
  - Tempo setting
  - Project metadata (name, creation date)

## UI/UX Requirements

### Layout
```
┌─────────────────────────────────────────────┐
│  Transport Controls  [♪ Tempo] [🔊 Volume] │
├──────┬──────────────────────────────────────┤
│      │    Time Ruler (measures/beats)       │
│ Piano├──────────────────────────────────────┤
│ Keys │                                       │
│      │      Piano Roll Grid                 │
│ C5   │  ┌──────┐    ┌───┐                  │
│ B4   │  │      │    │   │                  │
│ A4   │  └──────┘    └───┘    ┌────────┐   │
│ G4   │                        │        │   │
│ F4   │                        └────────┘   │
│ ...  │              │                       │
│      │              ▼ Playhead              │
└──────┴──────────────────────────────────────┘
```

### Styling Guidelines
- Modern, clean interface
- Dark mode preferred for music production aesthetic
- High contrast for note rectangles
- Smooth animations for playhead movement
- Responsive grid that adapts to window size

## Initial Development Roadmap

### Phase 1: Setup & Basic UI
1. Initialize Tauri + React project
2. Set up project structure and dependencies
3. Create basic piano roll grid layout
4. Implement piano keys sidebar
5. Add time ruler

### Phase 2: Note Display & Interaction
1. Render static notes on the grid
2. Implement note creation (click and drag)
3. Add note selection and deletion
4. Implement note editing (move and resize)

### Phase 3: Audio Engine
1. Set up Rust audio system with rodio
2. Implement note synthesis
3. Create Tauri commands for audio control
4. Test note playback from frontend

### Phase 4: Playback System
1. Implement playhead visual
2. Add play/pause/stop functionality
3. Synchronize audio with visual playback
4. Add tempo and volume controls

### Phase 5: Persistence & Polish
1. Implement save/load project functionality
2. Add keyboard shortcuts
3. Improve UI/UX and animations
4. Add zoom and scroll features
5. Testing and bug fixes

## Success Criteria
- [ ] Piano roll displays notes accurately across multiple octaves
- [ ] Users can create, edit, move, and delete notes
- [ ] Playback engine plays notes with accurate timing
- [ ] Playhead moves smoothly and shows current position
- [ ] Transport controls work reliably (play/pause/stop)
- [ ] Project can be saved and loaded
- [ ] App runs smoothly on macOS (both Intel and Apple Silicon)
- [ ] UI is intuitive and visually appealing

## Additional Notes for Claude Code
- Prioritize clean, maintainable code with proper TypeScript typing
- Include comments for complex logic
- Handle errors gracefully with user-friendly messages
- Consider performance optimization for rendering many notes
- Ensure cross-platform compatibility where possible
- Use Tauri's security best practices