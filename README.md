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

### 🤖 AI Melody Generation
- Generate melodies using AI models (OpenAI, Gemini, Anthropic, Cohere)
- Natural language prompts (e.g., "cheerful melody in C major")
- Scale-aware generation with automatic validation
- Adjustable parameters: measures, temperature, track assignment
- Secure encrypted API key storage
- Rate limiting and cost estimation
- Import generated melodies directly into piano roll

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

### AI Melody Generation
Use AI to generate melodies with natural language prompts.

#### Setup
1. Click the AI button (✨) in the top toolbar or press `Cmd/Ctrl + Shift + G`
2. Click "Settings" to configure API keys
3. Enter API key for your preferred provider:
   - **OpenAI**: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Google Gemini**: Get from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - **Anthropic**: Get from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   - **Cohere**: Get from [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys)
4. Click "Test Connection" to verify the API key
5. Save the API key (stored encrypted on your machine)

#### Generating Melodies
1. Open AI Generator (✨ button or `Cmd/Ctrl + Shift + G`)
2. Select an AI provider (must have API key configured)
3. Enter a prompt describing your desired melody:
   - "A cheerful melody in C major"
   - "Dark and mysterious ambient progression"
   - "Upbeat jazz melody with syncopation"
   - "Calm, peaceful melody for meditation"
4. Configure generation parameters:
   - **Scale**: Select key and mode (major, minor, etc.)
   - **Measures**: Number of measures to generate (1-16)
   - **Temperature**: Creativity level (0.0-2.0, default 1.0)
   - **Track**: Which track to add notes to
   - **Overlay**: Add to existing notes or replace them
5. Click "Generate" and wait 5-10 seconds
6. Review generated melody and click "Import" to add to piano roll

#### Example Prompts
- **Mood-based**: "Happy and energetic", "Sad and melancholic", "Mysterious"
- **Genre-specific**: "Classical piano etude", "Jazz improvisation", "Pop melody"
- **Technical**: "Ascending arpeggio in C major", "Chromatic descent with dynamics"
- **Compound**: "Fast-paced energetic melody in E minor with staccato notes"

#### Best Practices
- **Be specific**: Include mood, tempo hints (fast/slow), and dynamics (loud/soft)
- **Use scale constraints**: Selecting a scale ensures notes fit your composition
- **Start small**: Generate 2-4 measures first, then expand
- **Iterate**: Use temperature to control creativity (lower = safer, higher = experimental)
- **Review before importing**: Check generated notes match your intent
- **Combine with editing**: Use AI as a starting point, then refine manually

#### Cost and Rate Limits
- **Rate limit**: 10 requests per minute (client-side)
- **Cost estimate**: Displayed before generation (typically $0.001-0.01 per request)
- **Large requests**: Generating 8+ measures may cost more
- **API usage**: You are charged by the AI provider based on their pricing

#### Security Notes
- API keys are encrypted using AES-256-GCM before storage
- Keys are stored locally in app data directory (never sent to any server except the AI provider)
- Each API key is tied to your machine's unique ID
- Delete API keys anytime from Settings
- Input prompts are sanitized to prevent injection attacks

## Development

### Project Structure
```
piano-player/
├── src/                        # React frontend
│   ├── components/             # UI components
│   │   ├── AIMelodyGenerator.tsx    # AI generation UI
│   │   ├── AISettings.tsx           # API key management
│   │   └── ...
│   ├── hooks/                  # React hooks
│   │   ├── useAI.ts                 # AI generation hooks
│   │   └── ...
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Helper functions
│   │   ├── aiMelodyUtils.ts         # AI melody import logic
│   │   ├── costEstimator.ts         # Token/cost estimation
│   │   ├── rateLimiter.ts           # Client-side rate limiting
│   │   └── ...
│   └── context/                # React contexts
├── src-tauri/                  # Rust backend
│   └── src/
│       ├── lib.rs              # Tauri commands
│       ├── audio.rs            # Audio engine
│       ├── ai_models.rs        # AI data structures
│       ├── ai_client.rs        # AI provider implementations
│       ├── ai_prompts.rs       # System prompts & templates
│       └── api_key_storage.rs  # Encrypted key storage
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
| **Cmd/Ctrl + Shift + G** | Open AI Generator |
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

### AI Generation Issues

#### "API key not configured"
- Open AI Settings and enter your API key for the selected provider
- Click "Test Connection" to verify the key is valid
- Save the key before generating

#### "Rate limit exceeded"
- **Client-side limit**: Wait for the cooldown timer (max 60 seconds)
- **Provider rate limit**: Wait for the time specified in the error message
- Consider using a different AI provider
- Upgrade your API plan with the provider

#### "Invalid response from AI"
- Try regenerating with a clearer, more specific prompt
- Reduce temperature for more predictable results
- Try a different AI provider
- Check if the provider's service is operational

#### "Generation timeout (>30s)"
- Check your internet connection
- Verify the AI provider's API status
- Try reducing the number of measures (generate fewer notes)
- Retry with a simpler prompt

#### "Notes don't fit within measures"
- This is a validation error - the AI generated notes outside the requested time range
- Try regenerating (the system will retry automatically once)
- Reduce the complexity of your prompt
- Use a different AI provider

#### "Notes not in selected scale"
- The AI generated notes outside your selected scale
- Try regenerating with a more explicit scale instruction in the prompt
- Example: "melody using only C, D, E, F, G, A, B notes"

#### "Cost estimate seems high"
- Large generations (8+ measures) require more tokens
- Complex prompts increase input token count
- Consider generating fewer measures at a time
- OpenAI and Gemini are typically cheaper than Anthropic

#### API Keys Security
- Keys are encrypted with AES-256-GCM before storage
- Keys are stored in: `~/Library/Application Support/com.piano-app.dev/api_keys.json` (macOS)
- Each key is tied to your machine ID
- To completely remove keys: Delete the file above or use "Delete" in Settings
- Never share your API keys with others

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

This project is built as part of a learning exercise. See project specifications for more details.

## Acknowledgments

- Built with [Tauri](https://tauri.app) - Native desktop framework
- Audio synthesis powered by [rodio](https://github.com/RustAudio/rodio)
- UI components styled with [Tailwind CSS](https://tailwindcss.com)
