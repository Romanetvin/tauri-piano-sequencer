# AI Melody Generation - Implementation TODO

## Overview
Add AI-powered melody generation to the piano app using pure Rust backend with multiple AI model support (OpenAI, Gemini, Anthropic, etc.). Generated melodies will be returned as JSON compatible with the existing import system.

---

## Phase 1: Backend Setup (Rust/Tauri) ✅ COMPLETED

### 1.1 Add Rust Dependencies ✅
- [x] Add to `src-tauri/Cargo.toml`:
  - [x] reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
  - [x] serde = { version = "1.0", features = ["derive"] }
  - [x] serde_json = "1.0"
  - [x] validator = { version = "0.18", features = ["derive"] }
  - [x] tokio = { version = "1", features = ["full"] }
  - [x] anyhow = "1.0"
  - [x] base64 = "0.22"
  - [x] aes-gcm = "0.10"
  - [x] rand = "0.8"
  - [x] async-trait = "0.1"
  - [x] machine-uid = "0.5"
  - [x] uuid = { version = "1.11", features = ["v4"] }

### 1.2 Create Data Structures ✅
- [x] Create `src-tauri/src/ai_models.rs`:
  - [x] `AIProvider` enum (OpenAI, Gemini, Anthropic, Cohere)
  - [x] `MelodyRequest` struct with validation:
    - [x] `prompt: String` (1-1000 chars)
    - [x] `scale: Option<Scale>` (root note + mode)
    - [x] `measures: u32` (1-16, default: 4)
    - [x] `model_provider: AIProvider`
    - [x] `temperature: Option<f32>` (0.0-2.0)
  - [x] `MelodyResponse` struct:
    - [x] `notes: Vec<Note>`
    - [x] `metadata: GenerationMetadata` (model used, timestamp, etc.)
  - [x] `Scale` struct (root: String, mode: String)
  - [x] `Note` struct matching frontend (pitch, startTime, duration, velocity, trackId)

### 1.3 Create AI Client Module ✅
- [x] Create `src-tauri/src/ai_client.rs`:
  - [x] `AIClient` trait with method: `async fn generate_melody(&self, request: MelodyRequest) -> Result<MelodyResponse>`
  - [x] `OpenAIClient` implementation (using gpt-4o-mini)
  - [x] `GeminiClient` implementation (using gemini-1.5-flash)
  - [x] `AnthropicClient` implementation (using claude-3-5-haiku)
  - [x] Helper: Convert scale to MIDI note constraints (`Scale::get_midi_notes()`)
  - [x] Helper: Validate generated notes (pitch 0-127, duration > 0, etc.)
  - [x] Helper: JSON extraction from various formats

### 1.4 Create API Key Storage ✅
- [x] Create `src-tauri/src/api_key_storage.rs`:
  - [x] Encrypt API keys using AES-GCM before storing
  - [x] Store encrypted keys in app data directory
  - [x] `save_api_key(provider: AIProvider, key: String) -> Result<()>`
  - [x] `get_api_key(provider: AIProvider) -> Result<Option<String>>`
  - [x] `delete_api_key(provider: AIProvider) -> Result<()>`
  - [x] `list_configured_providers() -> Result<Vec<AIProvider>>`
  - [x] Generate/store encryption key derived from machine ID

### 1.5 Create Tauri Commands ✅
- [x] Add to `src-tauri/src/lib.rs`:
  - [x] `#[tauri::command] async fn generate_melody(...) -> Result<MelodyResponse, String>`
  - [x] `#[tauri::command] async fn save_ai_api_key(...) -> Result<(), String>`
  - [x] `#[tauri::command] async fn delete_ai_api_key(...) -> Result<(), String>`
  - [x] `#[tauri::command] async fn get_configured_ai_providers() -> Result<Vec<String>, String>`
  - [x] `#[tauri::command] async fn test_ai_connection(...) -> Result<bool, String>`
  - [x] Register all commands in Tauri builder

### 1.6 Implement AI Provider APIs ✅
- [x] **OpenAI Integration**:
  - [x] Use Chat Completions API with structured outputs (response_format: json_object)
  - [x] Define JSON schema for melody output
  - [x] System prompt: "You are a melody composer. Generate melodies as JSON with MIDI notes."
  - [x] Handle rate limits and errors

- [x] **Gemini Integration**:
  - [x] Use `generateContent` with JSON mode (responseMimeType: application/json)
  - [x] Configure safety settings
  - [x] Parse response and validate structure

- [x] **Anthropic Integration**:
  - [x] Use Messages API with JSON mode
  - [x] System prompt for structured output
  - [x] Parse and validate response

---

## Phase 2: Frontend UI (React/TypeScript) ✅ COMPLETED

### 2.1 Create Type Definitions ✅
- [x] Add to `src/types/index.ts`:
  - [x] `AIProvider` enum matching Rust
  - [x] `MelodyGenerationRequest` interface
  - [x] `MelodyGenerationResponse` interface
  - [x] `AIProviderStatus` interface (provider name, hasApiKey, isConfigured)

### 2.2 Create AI Settings Component ✅
- [x] Create `src/components/AISettings.tsx`:
  - [x] Modal/panel for API key management
  - [x] Input fields for each provider (OpenAI, Gemini, Anthropic)
  - [x] "Test Connection" button for each provider
  - [x] Visual indicator: green checkmark if API key is configured
  - [x] "Delete" button to remove API key
  - [x] Masked input fields (show/hide API key toggle)
  - [x] Save button with loading state
  - [x] Error handling and success messages

### 2.3 Create AI Melody Generator Component ✅
- [x] Create `src/components/AIMelodyGenerator.tsx`:
  - [x] **Model Selector Dropdown**:
    - [x] List all AI providers
    - [x] Gray out/disable providers without API keys
    - [x] Show tooltip: "Configure API key in settings" for disabled providers
    - [x] Show checkmark icon for configured providers
  - [x] **Prompt Input**:
    - [x] Large textarea for melody description
    - [x] Character counter (e.g., 0/1000)
    - [x] Placeholder examples: "A cheerful melody in C major", "Dark ambient progression"
  - [x] **Scale Selector**:
    - [x] Reuse existing `ScaleSelector` component
    - [x] Default: inherit from current scale selection
    - [x] Override option: "Use different scale for generation"
  - [x] **Measures Input**:
    - [x] Number input (1-16 measures)
    - [x] Default: 4 measures
    - [x] Show duration in beats based on current tempo
  - [x] **Advanced Settings** (collapsible):
    - [x] Temperature slider (0.0-2.0, default: 1.0)
    - [x] Track selection: which track to add notes to
    - [x] "Overlay on existing notes" checkbox
  - [x] **Generate Button**:
    - [x] Disabled if no API key for selected provider
    - [x] Loading spinner during generation
    - [x] Error display if generation fails
  - [x] **Preview Section**:
    - [x] Show generated notes count
    - [x] "Import" button to add to piano roll
    - [x] "Regenerate" button
    - [x] "Cancel" button

### 2.4 Create AI Button in Top Bar ✅
- [x] Add to `src/App.tsx`:
  - [x] "AI Generate" button with sparkle/star icon
  - [x] Click opens `AIMelodyGenerator` modal
  - [x] Badge showing configured provider count
  - [x] Keyboard shortcut: `Cmd/Ctrl + Shift + G`

### 2.5 Integrate with Existing Import System ✅
- [x] Create `src/utils/aiMelodyUtils.ts`:
  - [x] `importAIMelody(response: MelodyGenerationResponse, trackId: string, overlay: boolean)`:
    - [x] Convert AI response to `Note[]` format
    - [x] Assign proper IDs using `generateNoteId()`
    - [x] Assign to selected track
    - [x] If overlay: merge with existing notes
    - [x] If not overlay: replace existing notes (with confirmation)
  - [x] `validateAIMelody(notes: Note[])`: validate pitch ranges, durations, etc.
  - [x] `quantizeToGrid(notes: Note[], gridDivision: number)`: snap to grid if enabled

### 2.6 Create useAI Hook ✅
- [x] Create `src/hooks/useAI.ts`:
  - [x] `generateMelody(request: MelodyGenerationRequest)` - calls Tauri command
  - [x] `saveApiKey(provider: AIProvider, key: string)` - calls Tauri command
  - [x] `deleteApiKey(provider: AIProvider)` - calls Tauri command
  - [x] `getConfiguredProviders()` - calls Tauri command
  - [x] `testConnection(provider: AIProvider)` - calls Tauri command
  - [x] State management for loading, errors, responses
  - [x] Caching for configured providers list

---

## Phase 3: AI Prompt Engineering ✅ COMPLETED

### 3.1 Design System Prompts ✅
- [x] Create `src-tauri/src/ai_prompts.rs`:
  - [x] Base system prompt template
  - [x] JSON schema definition for melody output
  - [x] Scale-specific instructions (e.g., "Use only notes from C major scale: C, D, E, F, G, A, B")
  - [x] Measure/timing instructions (e.g., "Generate exactly 16 beats (4 measures in 4/4 time)")
  - [x] Musical style guidance based on prompt keywords (mood, dynamics, rhythm, genre)
  - [x] Style analysis function that detects keywords: happy, sad, dark, calm, energetic, soft, loud, fast, slow, jazz, classical, pop, ambient, blues

### 3.2 Response Parsing & Validation ✅
- [x] Parse JSON response from AI models
- [x] Validate note structure:
  - [x] All pitches are 0-127 (basic validation)
  - [x] All start times are >= 0 (measure bounds validation)
  - [x] All durations are > 0 (minimum 0.1 beats)
  - [x] Notes fit within requested measures (`validate_measure_bounds()`)
  - [x] If scale specified: all notes are in scale (`validate_scale_constraints()`)
  - [x] Comprehensive validation method (`validate_comprehensive()`)
- [x] Fallback: if validation fails, retry with adjusted prompt (`generate_melody_with_retry()`)
- [x] Error handling: descriptive messages for common issues (specific error messages for each validation failure)

**Implementation Details:**
- `ai_prompts.rs:13-71`: `analyze_prompt_style()` - Detects mood, dynamics, rhythm, and genre keywords
- `ai_prompts.rs:74-144`: `build_system_prompt()` - Enhanced with style-based guidance
- `ai_prompts.rs:166-176`: `build_retry_prompt()` - Adjusted prompt for retry attempts
- `ai_models.rs:194-243`: `validate_measure_bounds()` - Checks notes fit within measures
- `ai_models.rs:246-274`: `validate_scale_constraints()` - Validates scale adherence
- `ai_models.rs:277-296`: `validate_comprehensive()` - Combined validation
- `ai_client.rs:14-39`: `generate_melody_with_retry()` - Retry logic with validation
- All AI clients (OpenAI, Gemini, Anthropic) implement retry mechanism

---

## Phase 4: Polish & UX ✅ COMPLETED

### 4.1 Loading States ✅
- [x] Show spinner during AI generation
- [x] Estimated time indicator (e.g., "This may take 5-10 seconds...")
- [x] Cancel button to abort request
- [x] Elapsed time tracker showing seconds
- [x] Dynamic loading messages based on elapsed time

### 4.2 Error Handling ✅
- [x] API key invalid/expired → show setup prompt with "Configure API Key" button
- [x] Rate limit exceeded → show retry timer (extracted from error message)
- [x] Network error → show retry button
- [x] Invalid response → show error details
- [x] Timeout (>30s) → show timeout message
- [x] Validation errors → show descriptive messages with actions
- [x] Parse error types and provide actionable feedback

### 4.3 Success Feedback ✅
- [x] Toast notification: "Melody imported! Added X notes to piano roll 🎵"
- [x] Custom Toast component with success/error/warning/info types
- [x] Auto-dismiss toasts after 5 seconds
- [x] Stacked toast notifications in bottom-right corner
- [x] Slide-in animation for toasts

### 4.4 Settings Persistence ✅
- [x] Remember last used AI provider in localStorage
- [x] Remember last used temperature setting
- [x] Remember overlay preference
- [x] Remember measures setting
- [x] Load settings on component mount
- [x] Save settings on change

**Implementation Details:**
- `src/components/Toast.tsx` - Reusable toast component with auto-dismiss
- `src/hooks/useToast.ts` - Toast state management hook
- `src/utils/errorParser.ts` - AI error parsing with 7 error types
- `src/utils/localStorage.ts` - Settings persistence helpers
- `src/hooks/useAI.ts` - Added cancel functionality with AbortController pattern
- `src/components/AIMelodyGenerator.tsx` - Enhanced with:
  - Loading state with elapsed time tracker
  - Cancel button during generation
  - Enhanced error display with type-specific actions
  - Settings persistence (provider, temperature, overlay, measures)
- `src/App.tsx` - Toast container and success notifications
- `src/index.css` - Toast slide-in animation

**Features:**
- ⏱️ Real-time elapsed time display during generation
- 🚫 Cancel button (though backend doesn't support true cancellation yet)
- 🎯 Contextual error messages with specific actions
- 💾 Settings persist across sessions
- 🔔 Toast notifications for success/errors
- 🎨 Smooth slide-in animations

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
