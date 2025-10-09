# Piano Player

A modern desktop piano roll application for macOS built with Tauri, React, and Rust. Create, edit, and play musical compositions with an intuitive interface similar to professional music production software.

![Piano Player](https://img.shields.io/badge/Tauri-2.x-blue)
![React](https://img.shields.io/badge/React-19.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Rust](https://img.shields.io/badge/Rust-Edition_2021-orange)

## Features

### 🎹 Piano Roll Interface
- Visual grid-based note editor with time and pitch axes
- Click and drag to create notes
- Move and resize notes with mouse
- Piano keys sidebar showing note names
- Time ruler with measures and beats
- Smooth playback with animated playhead

### 🎵 Multi-Track Support
- Create and manage multiple tracks
- Independent tempo control per track (BPM)
- Mute/Solo functionality
- Color-coded tracks for easy identification
- Track volume controls

### 🎼 Audio Engine
- High-quality audio synthesis powered by Rust (rodio)
- Two sound modes:
  - **Piano**: Realistic piano sound with harmonics and overtones
  - **Synthesizer**: Clean sine wave synthesis
- ADSR envelope for natural note dynamics
- Low-latency playback

### ⌨️ Keyboard Controls
- Play notes in real-time using QWERTY keyboard
- Visual keyboard guide with note mappings
- Spacebar to play/pause playback
- Delete/Backspace to remove selected notes
- Escape to clear selection

### 💾 Project Management
- Export projects as JSON files
- Import previously saved projects
- Preserves all notes, tracks, and settings

### 🎨 Modern UI
- Dark/Light theme support
- Smooth animations and transitions
- Responsive layout
- Visual piano keyboard at bottom
- Real-time key press notifications

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** 1.70+ (install from [rustup.rs](https://rustup.rs))
- **macOS** (Apple Silicon or Intel)

### Installation

1. Clone the repository and navigate to the piano-player directory:
```bash
cd piano-player
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run tauri dev
```

This will:
- Start the Vite dev server
- Compile the Rust backend
- Launch the desktop application with hot reload

### Building for Production

Build the application bundle:
```bash
npm run tauri build
```

The compiled app will be available in `src-tauri/target/release/bundle/`.

## Usage

### Creating Notes
1. Select a track from the track panel
2. Click and drag on the piano roll grid to create a note
3. Drag notes to change pitch or timing
4. Drag note edges to adjust duration
5. Click to select notes, Delete/Backspace to remove

### Playing Music
- **Play/Pause**: Click transport controls or press Spacebar
- **Stop**: Returns playback to start
- **Seek**: Click anywhere on the timeline to jump to that position

### Real-Time Keyboard
- Press keys on your QWERTY keyboard to play piano notes
- Visual feedback shows which keys are active
- See the keyboard guide (music note icon) for key mappings

### Managing Tracks
1. Click the tracks icon (≡) to open track panel
2. Add/remove tracks
3. Adjust tempo, volume, mute, and solo per track
4. Each track can have different tempo for polyrhythmic compositions

### Exporting/Importing
- **Export**: Click the download icon to save project as JSON
- **Import**: Click the upload icon to load a saved project

## Development

### Project Structure
```
piano-player/
├── src/                        # React frontend
│   ├── components/             # UI components
│   ├── hooks/                  # React hooks
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Helper functions
│   └── context/                # React contexts
├── src-tauri/                  # Rust backend
│   └── src/
│       ├── lib.rs              # Tauri commands
│       └── audio.rs            # Audio engine
└── package.json
```

### Available Scripts

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run tauri dev` - Start full Tauri development environment
- `npm run build` - Build frontend (TypeScript + Vite)
- `npm run tauri build` - Build production application

### Technology Stack

**Frontend:**
- React 19.1 with TypeScript
- Vite for fast development and building
- Tailwind CSS 4 for styling
- @tauri-apps/api for Rust communication

**Backend:**
- Tauri 2.x for native application framework
- Rust with rodio for audio synthesis
- serde for JSON serialization
- chrono for timestamps

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Spacebar** | Play/Pause |
| **Delete/Backspace** | Remove selected notes |
| **Escape** | Clear selection |
| **QWERTY keys** | Play piano notes (see keyboard guide) |

## Configuration

### Grid Settings
Adjust in `App.tsx`:
```typescript
gridSettings: {
  snapToGrid: true,        // Enable grid snapping
  gridDivision: 4,         // 4 = quarter notes
  pixelsPerBeat: 80,       // Horizontal zoom
  noteHeight: 20,          // Vertical spacing
}
```

### Audio Settings
Modify in `src-tauri/src/audio.rs`:
- ADSR envelope parameters
- Harmonic overtones for piano mode
- Sample rate (default: 44100 Hz)

## Troubleshooting

### Audio Not Playing
- Check system volume and permissions
- Ensure no other audio applications are blocking the audio device
- Try switching between Piano and Synthesizer modes

### Build Failures
- Ensure Rust is up to date: `rustup update`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Rust build cache: `cd src-tauri && cargo clean`

### Port Already in Use
The Vite dev server uses port 1420. If blocked:
- Stop other instances: `lsof -ti:1420 | xargs kill -9`
- Or change the port in `vite.config.ts` and `src-tauri/tauri.conf.json`

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

This project is built as part of a learning exercise. See project specifications for more details.

## Acknowledgments

- Built with [Tauri](https://tauri.app) - Native desktop framework
- Audio synthesis powered by [rodio](https://github.com/RustAudio/rodio)
- UI components styled with [Tailwind CSS](https://tailwindcss.com)
