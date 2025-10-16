# AI Melody Generation - Implementation TODO

## Overview
Add AI-powered melody generation to the piano app using pure Rust backend with multiple AI model support (OpenAI, Gemini, Anthropic, etc.). Generated melodies will be returned as JSON compatible with the existing import system.

---

## Phase 1: Backend Setup (Rust/Tauri)

### 1.1 Add Rust Dependencies
- [ ] Add to `src-tauri/Cargo.toml`:
  ```toml
  reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
  serde = { version = "1.0", features = ["derive"] }
  serde_json = "1.0"
  validator = { version = "0.18", features = ["derive"] }
  tokio = { version = "1", features = ["full"] }
  anyhow = "1.0"
  base64 = "0.22"
  aes-gcm = "0.10"
  rand = "0.8"
  ```

### 1.2 Create Data Structures
- [ ] Create `src-tauri/src/ai_models.rs`:
  - [ ] `AIProvider` enum (OpenAI, Gemini, Anthropic, Cohere, etc.)
  - [ ] `MelodyRequest` struct with validation:
    - `prompt: String` (1-1000 chars)
    - `scale: Option<Scale>` (root note + mode)
    - `measures: u32` (1-16, default: 4)
    - `model_provider: AIProvider`
    - `temperature: Option<f32>` (0.0-2.0)
  - [ ] `MelodyResponse` struct:
    - `notes: Vec<Note>`
    - `metadata: GenerationMetadata` (model used, timestamp, etc.)
  - [ ] `Scale` struct (root: String, mode: String)
  - [ ] `Note` struct matching frontend (pitch, startTime, duration, velocity, trackId)

### 1.3 Create AI Client Module
- [ ] Create `src-tauri/src/ai_client.rs`:
  - [ ] `AIClient` trait with method: `async fn generate_melody(&self, request: MelodyRequest) -> Result<MelodyResponse>`
  - [ ] `OpenAIClient` implementation
  - [ ] `GeminiClient` implementation
  - [ ] `AnthropicClient` implementation
  - [ ] Helper: Convert scale to MIDI note constraints
  - [ ] Helper: Validate generated notes (pitch 0-127, duration > 0, etc.)
  - [ ] Helper: Quantize notes to beat grid (optional)

### 1.4 Create API Key Storage
- [ ] Create `src-tauri/src/api_key_storage.rs`:
  - [ ] Encrypt API keys using AES-GCM before storing
  - [ ] Store encrypted keys in app data directory (use `tauri::api::path::app_data_dir()`)
  - [ ] `save_api_key(provider: AIProvider, key: String) -> Result<()>`
  - [ ] `get_api_key(provider: AIProvider) -> Result<Option<String>>`
  - [ ] `delete_api_key(provider: AIProvider) -> Result<()>`
  - [ ] `list_configured_providers() -> Result<Vec<AIProvider>>`
  - [ ] Generate/store encryption key in secure location (derive from machine ID)

### 1.5 Create Tauri Commands
- [ ] Add to `src-tauri/src/lib.rs`:
  - [ ] `#[tauri::command] async fn generate_melody(prompt: String, scale: Option<Scale>, measures: Option<u32>, provider: String, temperature: Option<f32>) -> Result<MelodyResponse, String>`
  - [ ] `#[tauri::command] async fn save_ai_api_key(provider: String, api_key: String) -> Result<(), String>`
  - [ ] `#[tauri::command] async fn delete_ai_api_key(provider: String) -> Result<(), String>`
  - [ ] `#[tauri::command] async fn get_configured_ai_providers() -> Result<Vec<String>, String>`
  - [ ] `#[tauri::command] async fn test_ai_connection(provider: String) -> Result<bool, String>`
  - [ ] Register all commands in Tauri builder

### 1.6 Implement AI Provider APIs
- [ ] **OpenAI Integration**:
  - [ ] Use Chat Completions API with structured outputs (response_format)
  - [ ] Define JSON schema for melody output
  - [ ] System prompt: "You are a melody composer. Generate melodies as JSON with MIDI notes."
  - [ ] Handle rate limits and errors

- [ ] **Gemini Integration**:
  - [ ] Use `generateContent` with JSON mode
  - [ ] Configure safety settings
  - [ ] Parse response and validate structure

- [ ] **Anthropic Integration**:
  - [ ] Use Messages API with JSON mode
  - [ ] System prompt for structured output
  - [ ] Parse and validate response

---

## Phase 2: Frontend UI (React/TypeScript)

### 2.1 Create Type Definitions
- [ ] Add to `src/types/index.ts`:
  - [ ] `AIProvider` enum matching Rust
  - [ ] `MelodyGenerationRequest` interface
  - [ ] `MelodyGenerationResponse` interface
  - [ ] `AIProviderStatus` interface (provider name, hasApiKey, isConfigured)

### 2.2 Create AI Settings Component
- [ ] Create `src/components/AISettings.tsx`:
  - [ ] Modal/panel for API key management
  - [ ] Input fields for each provider (OpenAI, Gemini, Anthropic)
  - [ ] "Test Connection" button for each provider
  - [ ] Visual indicator: green checkmark if API key is configured
  - [ ] "Delete" button to remove API key
  - [ ] Masked input fields (show/hide API key toggle)
  - [ ] Save button with loading state
  - [ ] Error handling and success messages

### 2.3 Create AI Melody Generator Component
- [ ] Create `src/components/AIMelodyGenerator.tsx`:
  - [ ] **Model Selector Dropdown**:
    - [ ] List all AI providers
    - [ ] Gray out/disable providers without API keys
    - [ ] Show tooltip: "Configure API key in settings" for disabled providers
    - [ ] Show checkmark icon for configured providers
  - [ ] **Prompt Input**:
    - [ ] Large textarea for melody description
    - [ ] Character counter (e.g., 0/1000)
    - [ ] Placeholder examples: "A cheerful melody in C major", "Dark ambient progression"
  - [ ] **Scale Selector**:
    - [ ] Reuse existing `ScaleSelector` component
    - [ ] Default: inherit from current scale selection
    - [ ] Override option: "Use different scale for generation"
  - [ ] **Measures Input**:
    - [ ] Number input (1-16 measures)
    - [ ] Default: 4 measures
    - [ ] Show duration in beats based on current tempo
  - [ ] **Advanced Settings** (collapsible):
    - [ ] Temperature slider (0.0-2.0, default: 1.0)
    - [ ] Track selection: which track to add notes to
    - [ ] "Overlay on existing notes" checkbox
  - [ ] **Generate Button**:
    - [ ] Disabled if no API key for selected provider
    - [ ] Loading spinner during generation
    - [ ] Error display if generation fails
  - [ ] **Preview Section**:
    - [ ] Show generated notes count
    - [ ] "Import" button to add to piano roll
    - [ ] "Regenerate" button
    - [ ] "Cancel" button

### 2.4 Create AI Button in Top Bar
- [ ] Add to `src/App.tsx`:
  - [ ] "AI Generate" button with sparkle/star icon
  - [ ] Click opens `AIMelodyGenerator` modal
  - [ ] Badge showing configured provider count
  - [ ] Keyboard shortcut: `Cmd/Ctrl + Shift + G`

### 2.5 Integrate with Existing Import System
- [ ] Create `src/utils/aiMelodyUtils.ts`:
  - [ ] `importAIMelody(response: MelodyGenerationResponse, trackId: string, overlay: boolean)`:
    - [ ] Convert AI response to `Note[]` format
    - [ ] Assign proper IDs using `generateNoteId()`
    - [ ] Assign to selected track
    - [ ] If overlay: merge with existing notes
    - [ ] If not overlay: replace existing notes (with confirmation)
  - [ ] `validateAIMelody(notes: Note[])`: validate pitch ranges, durations, etc.
  - [ ] `quantizeToGrid(notes: Note[], gridDivision: number)`: snap to grid if enabled

### 2.6 Create useAI Hook
- [ ] Create `src/hooks/useAI.ts`:
  - [ ] `generateMelody(request: MelodyGenerationRequest)` - calls Tauri command
  - [ ] `saveApiKey(provider: AIProvider, key: string)` - calls Tauri command
  - [ ] `deleteApiKey(provider: AIProvider)` - calls Tauri command
  - [ ] `getConfiguredProviders()` - calls Tauri command
  - [ ] `testConnection(provider: AIProvider)` - calls Tauri command
  - [ ] State management for loading, errors, responses
  - [ ] Caching for configured providers list

---

## Phase 3: AI Prompt Engineering

### 3.1 Design System Prompts
- [ ] Create `src-tauri/src/ai_prompts.rs`:
  - [ ] Base system prompt template
  - [ ] JSON schema definition for melody output
  - [ ] Scale-specific instructions (e.g., "Use only notes from C major scale: C, D, E, F, G, A, B")
  - [ ] Measure/timing instructions (e.g., "Generate exactly 16 beats (4 measures in 4/4 time)")
  - [ ] Musical style guidance based on prompt keywords

### 3.2 Response Parsing & Validation
- [ ] Parse JSON response from AI models
- [ ] Validate note structure:
  - [ ] All pitches are 0-127
  - [ ] All start times are >= 0
  - [ ] All durations are > 0
  - [ ] Notes fit within requested measures
  - [ ] If scale specified: all notes are in scale
- [ ] Fallback: if validation fails, retry with adjusted prompt
- [ ] Error handling: descriptive messages for common issues

---

## Phase 4: Polish & UX

### 4.1 Loading States
- [ ] Show spinner during AI generation
- [ ] Estimated time indicator (e.g., "This may take 5-10 seconds...")
- [ ] Cancel button to abort request
- [ ] Progress indicator if streaming available

### 4.2 Error Handling
- [ ] API key invalid/expired → show setup prompt
- [ ] Rate limit exceeded → show retry timer
- [ ] Network error → show retry button
- [ ] Invalid response → show error details
- [ ] Timeout (>30s) → show timeout message

### 4.3 Success Feedback
- [ ] Toast notification: "Melody generated successfully!"
- [ ] Auto-preview generated melody (highlight in piano roll)
- [ ] Option to "Keep" or "Discard" before committing

### 4.4 Settings Persistence
- [ ] Remember last used AI provider in localStorage
- [ ] Remember last used temperature setting
- [ ] Remember overlay preference

---

## Phase 5: Security & Best Practices

### 5.1 Security
- [ ] Never log API keys
- [ ] Encrypt API keys at rest (AES-GCM)
- [ ] Use HTTPS for all API calls
- [ ] Validate all inputs before sending to AI
- [ ] Sanitize AI responses before rendering

### 5.2 Rate Limiting
- [ ] Implement client-side rate limiting (e.g., max 10 requests/minute)
- [ ] Show cooldown timer if limit exceeded
- [ ] Queue requests if multiple generations triggered

### 5.3 Cost Awareness
- [ ] Estimate token usage before generation
- [ ] Show approximate cost per request (optional)
- [ ] Warning for large requests (>8 measures)

---

## Phase 6: Testing

### 6.1 Unit Tests (Rust)
- [ ] Test API key encryption/decryption
- [ ] Test note validation logic
- [ ] Test scale constraint generation
- [ ] Test JSON parsing for each AI provider
- [ ] Test error handling for invalid responses

### 6.2 Integration Tests
- [ ] Test end-to-end melody generation with mock AI responses
- [ ] Test overlay vs. replace logic
- [ ] Test import into existing project
- [ ] Test MIDI export of AI-generated melodies

### 6.3 Manual Testing
- [ ] Test with each AI provider (OpenAI, Gemini, Anthropic)
- [ ] Test with different scales (major, minor, all root notes)
- [ ] Test with different measure counts (1-16)
- [ ] Test overlay on existing notes
- [ ] Test error scenarios (invalid API key, network error, etc.)
- [ ] Test UI responsiveness during generation

---

## Phase 7: Documentation

### 7.1 User Documentation
- [ ] Add "AI Generation" section to README
- [ ] How to obtain API keys for each provider
- [ ] Example prompts and best practices
- [ ] Troubleshooting guide

### 7.2 Code Documentation
- [ ] Document AI module architecture
- [ ] Document prompt templates and rationale
- [ ] Document security considerations
- [ ] Add inline comments for complex logic

---

## File Structure (New Files)

```
piano-app/
├── src/
│   ├── components/
│   │   ├── AIMelodyGenerator.tsx      # Main AI generation UI
│   │   └── AISettings.tsx             # API key management UI
│   ├── hooks/
│   │   └── useAI.ts                   # AI-related hooks
│   ├── utils/
│   │   └── aiMelodyUtils.ts           # AI melody import/validation
│   └── types/
│       └── ai.ts                      # AI-related TypeScript types
├── src-tauri/src/
│   ├── ai_models.rs                   # Data structures (serde)
│   ├── ai_client.rs                   # AI provider implementations
│   ├── ai_prompts.rs                  # System prompts & templates
│   └── api_key_storage.rs             # Encrypted key storage
└── AI_MELODY_GENERATION_TODO.md       # This file
```

---

## Implementation Order (Recommended)

1. **Backend Foundation** (Phase 1.1-1.4): Set up Rust dependencies, data structures, and API key storage
2. **Single AI Provider** (Phase 1.5-1.6): Implement OpenAI integration first (most common)
3. **Basic Frontend** (Phase 2.1-2.4): Create minimal UI to test end-to-end flow
4. **Integration** (Phase 2.5-2.6): Connect generated melodies to piano roll
5. **Additional Providers** (Phase 1.6): Add Gemini, Anthropic support
6. **Polish** (Phase 3-4): Improve prompts, UX, error handling
7. **Security & Testing** (Phase 5-6): Harden security, comprehensive testing
8. **Documentation** (Phase 7): Write user and developer docs

---

## Notes

- **Scale Constraints**: When a scale is selected, the AI prompt will include specific MIDI note numbers allowed (e.g., "Use only these MIDI notes: 60, 62, 64, 65, 67, 69, 71" for C major starting at C4)
- **Overlay Logic**: If overlay is enabled, use `setNotes(prev => [...prev, ...aiGeneratedNotes])`. Otherwise, prompt user to confirm replacement.
- **MIDI Export**: Generated melodies will automatically work with existing MIDI export since they use the same `Note` structure
- **Track Assignment**: Generated notes will be assigned to the currently selected track by default
- **Grid Snapping**: Optionally quantize AI-generated notes to the current grid division for cleaner results

---

## Future Enhancements (Out of Scope for MVP)

- [ ] Melody variation: "Generate similar melody" button
- [ ] Style presets: Classical, Jazz, Pop, etc.
- [ ] Multi-track generation: Generate harmony/bass alongside melody
- [ ] Real-time streaming of notes as they're generated
- [ ] Local AI models (Ollama, LM Studio) integration
- [ ] Melody analysis: suggest improvements to user-created melodies
- [ ] Export/import AI generation history
