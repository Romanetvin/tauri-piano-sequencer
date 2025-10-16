# AI Melody Generation Architecture

This document describes the architecture and implementation of the AI melody generation feature in the Piano Player application.

## Overview

The AI melody generation system allows users to generate musical melodies using natural language prompts. The system integrates multiple AI providers (OpenAI, Google Gemini, Anthropic, Cohere) with a secure, validated pipeline that ensures generated melodies fit within musical constraints.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                 │
│  ┌────────────────┐  ┌─────────────────┐                   │
│  │ AIMelodyGen    │  │  AISettings     │                   │
│  │ (UI & Input)   │  │  (API Keys)     │                   │
│  └────────┬───────┘  └────────┬────────┘                   │
│           │                    │                             │
│  ┌────────▼────────────────────▼────────┐                   │
│  │         useAI Hook                   │                   │
│  │  (State Management & Tauri Calls)    │                   │
│  └────────┬────────────────────┬────────┘                   │
│           │                    │                             │
│  Utils:   ▼                    ▼                             │
│  ┌─────────────┐  ┌───────────────┐  ┌─────────────┐       │
│  │ Rate Limiter│  │ Cost Estimator│  │ AI Melody   │       │
│  └─────────────┘  └───────────────┘  │ Utils       │       │
│                                       └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                    Tauri IPC Bridge
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Rust/Tauri)                      │
├─────────────────────────────────────────────────────────────┤
│  Commands (lib.rs):                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ generate_melody() - Main generation command          │    │
│  │ save_api_key() - Store encrypted API key             │    │
│  │ get_configured_providers() - List available providers│    │
│  │ test_ai_connection() - Validate API key               │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────┐         │
│  │         AI Client Layer (ai_client.rs)         │         │
│  │  ┌──────────────────────────────────────────┐  │         │
│  │  │ generate_melody_with_retry()             │  │         │
│  │  │ - Calls provider implementation          │  │         │
│  │  │ - Validates response                     │  │         │
│  │  │ - Retries on validation failure          │  │         │
│  │  └──────────────────────────────────────────┘  │         │
│  └─────────────────────────────────────────────────┘         │
│                            │                                 │
│  ┌────────────┬────────────┼────────────┬────────────┐      │
│  ▼            ▼            ▼            ▼            ▼      │
│ OpenAI     Gemini      Anthropic     Cohere      [Future]   │
│ Client     Client       Client       Client                 │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Support Modules                             │     │
│  ├────────────────────────────────────────────────────┤     │
│  │ ai_models.rs - Data structures & validation         │     │
│  │ ai_prompts.rs - System prompts & style analysis     │     │
│  │ api_key_storage.rs - Encrypted key storage          │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  External AI Provider APIs
            (OpenAI, Gemini, Anthropic, Cohere)
```

## Component Details

### Frontend Components

#### 1. AIMelodyGenerator Component (`src/components/AIMelodyGenerator.tsx`)
**Purpose**: Main UI for melody generation with user input and parameter controls.

**Key Features**:
- Provider selection dropdown (shows only configured providers)
- Natural language prompt textarea with character counter
- Scale selector integration
- Measures input (1-16)
- Advanced settings: temperature, track selection, overlay mode
- Loading states with elapsed time tracker
- Error display with contextual actions
- Preview and import controls

**State Management**:
- Uses `useAI` hook for generation logic
- Persists settings to localStorage (provider, temperature, overlay, measures)
- Manages loading states and cancellation

#### 2. AISettings Component (`src/components/AISettings.tsx`)
**Purpose**: API key management interface.

**Key Features**:
- Masked input fields for API keys (show/hide toggle)
- Test connection button per provider
- Visual indicators (checkmarks) for configured providers
- Delete API key functionality
- Success/error feedback

#### 3. useAI Hook (`src/hooks/useAI.ts`)
**Purpose**: Centralized state management and Tauri command wrapper.

**Key Functions**:
- `generateMelody()` - Calls backend with AbortController support
- `saveApiKey()` - Stores encrypted API key
- `deleteApiKey()` - Removes API key
- `getConfiguredProviders()` - Lists providers with valid keys
- `testConnection()` - Validates API key

**State**:
- `loading` - Generation in progress
- `error` - Error message if generation fails
- `response` - Generated melody response
- `configuredProviders` - Cached list of available providers

### Backend Modules

#### 1. AI Models (`src-tauri/src/ai_models.rs`)
**Purpose**: Core data structures with validation.

**Key Types**:
```rust
// User request with validation
struct MelodyRequest {
    prompt: String,              // 1-1000 chars
    scale: Option<Scale>,        // Optional scale constraint
    measures: u32,               // 1-16 measures
    model_provider: AIProvider,  // Which AI to use
    temperature: Option<f32>,    // 0.0-2.0
}

// Generated melody response
struct MelodyResponse {
    notes: Vec<Note>,
    metadata: GenerationMetadata,
}

// Scale constraint
struct Scale {
    root: String,  // e.g., "C", "D#"
    mode: String,  // e.g., "major", "minor"
}

// Individual note
struct Note {
    pitch: u8,        // MIDI 0-127
    start_time: f32,  // In beats
    duration: f32,    // In beats
    velocity: u8,     // 0-127
    track_id: String,
}
```

**Validation Methods**:
- `validate_measure_bounds()` - Ensures notes fit within requested measures
- `validate_scale_constraints()` - Checks notes match selected scale
- `validate_comprehensive()` - Combined validation
- `sanitize_prompt()` - Removes control characters and null bytes

#### 2. AI Client (`src-tauri/src/ai_client.rs`)
**Purpose**: AI provider implementations and retry logic.

**Architecture**:
```rust
#[async_trait]
trait AIClient {
    async fn generate_melody(&self, request: MelodyRequest)
        -> Result<MelodyResponse>;
}

// Implementations:
struct OpenAIClient;      // GPT-4o-mini
struct GeminiClient;      // Gemini-1.5-flash
struct AnthropicClient;   // Claude-3-5-haiku
struct CohereClient;      // Command-R
```

**Retry Logic** (`generate_melody_with_retry`):
1. Call provider's `generate_melody()` method
2. Validate response with `validate_comprehensive()`
3. If validation fails:
   - Build adjusted prompt with `build_retry_prompt()`
   - Retry once with stricter instructions
   - Return error if second attempt fails

**Provider Specifics**:
- **OpenAI**: Uses Chat Completions API with JSON mode (`response_format`)
- **Gemini**: Uses `generateContent` with `responseMimeType: application/json`
- **Anthropic**: Uses Messages API with JSON instructions
- **Cohere**: Uses Chat API with structured output format

#### 3. AI Prompts (`src-tauri/src/ai_prompts.rs`)
**Purpose**: System prompt generation with style analysis.

**Key Functions**:

**`analyze_prompt_style()`** - Detects user intent:
- **Mood**: happy, sad, dark, calm, etc.
- **Dynamics**: loud, soft, gentle, powerful
- **Rhythm**: fast, slow, energetic, relaxed
- **Genre**: jazz, classical, pop, blues, ambient

**`build_system_prompt()`** - Constructs AI instructions:
1. Base instructions (role, output format)
2. JSON schema definition
3. Scale constraints (if specified)
4. Measure/timing requirements
5. Style-specific guidance based on detected keywords
6. Musical constraints (realistic durations, velocity ranges)

**Style-Based Guidance Examples**:
- **Happy** → "Use major intervals, ascending patterns, bright dynamics"
- **Dark** → "Use minor intervals, lower register, softer dynamics"
- **Fast** → "Use shorter note durations (0.25-0.5 beats), more notes"
- **Jazz** → "Include syncopation, swing feel, chromatic passing tones"

**`build_retry_prompt()`** - Adjusted prompt for retry attempts:
- More explicit constraints
- References to validation failures
- Stricter timing requirements

#### 4. API Key Storage (`src-tauri/src/api_key_storage.rs`)
**Purpose**: Secure encrypted storage of API keys.

**Security Features**:
- **Encryption**: AES-256-GCM with random nonce per key
- **Key Derivation**: SHA-256 hash of machine UID + salt
- **Storage Location**: App data directory (`~/Library/Application Support/`)
- **Atomic Operations**: File writes use temp file + rename

**Key Functions**:
- `save_api_key()` - Encrypts and stores key
- `get_api_key()` - Decrypts and returns key
- `delete_api_key()` - Removes key from storage
- `list_configured_providers()` - Lists providers with stored keys

**Storage Format**:
```json
{
  "providers": {
    "OpenAI": {
      "encrypted_key": "base64_encoded_ciphertext",
      "nonce": "base64_encoded_nonce",
      "created_at": "2025-01-15T10:30:00Z"
    }
  }
}
```

### Utility Modules

#### 1. Rate Limiter (`src/utils/rateLimiter.ts`)
**Algorithm**: Token bucket with localStorage persistence
- **Capacity**: 10 tokens
- **Refill Rate**: 10 tokens per 60 seconds (1 per 6 seconds)
- **Persistence**: State saved to localStorage for cross-session tracking

**Functions**:
- `checkRateLimit()` - Returns `{ allowed: boolean, waitTime: number }`
- `consumeToken()` - Deducts a token if available
- `getRemainingTime()` - Returns seconds until next token

#### 2. Cost Estimator (`src/utils/costEstimator.ts`)
**Purpose**: Estimates token usage and API costs before generation.

**Token Estimation**:
- **Input Tokens**: System prompt (~500) + user prompt length + scale constraints
- **Output Tokens**: `measures * 50` (rough estimate based on note density)

**Provider Pricing** (per 1M tokens):
- **OpenAI GPT-4o-mini**: $0.15 input / $0.60 output
- **Gemini 1.5 Flash**: $0.075 input / $0.30 output
- **Anthropic Claude Haiku**: $0.25 input / $1.25 output
- **Cohere Command-R**: $0.15 input / $0.60 output

**Functions**:
- `estimateCost(provider, prompt, measures)` - Returns cost and token counts
- `formatCost(cost)` - Formats cost as currency string

#### 3. AI Melody Utils (`src/utils/aiMelodyUtils.ts`)
**Purpose**: Import and validation of generated melodies.

**Functions**:
- `importAIMelody()` - Converts AI response to app's `Note[]` format
  - Assigns unique IDs
  - Assigns to target track
  - Handles overlay vs. replace mode
- `validateAIMelody()` - Client-side validation (pitch ranges, durations)
- `quantizeToGrid()` - Snaps notes to grid if snap is enabled

## Data Flow

### Melody Generation Flow

1. **User Input** (Frontend):
   - User enters prompt, selects scale, measures, provider
   - `AIMelodyGenerator` validates inputs client-side

2. **Rate Limiting** (Frontend):
   - `rateLimiter.checkRateLimit()` checks if request allowed
   - If rate limited, shows cooldown timer

3. **Cost Estimation** (Frontend):
   - `costEstimator.estimateCost()` calculates approximate cost
   - Displayed to user before generation

4. **Generation Request** (Frontend → Backend):
   - `useAI.generateMelody()` calls Tauri command
   - Serializes `MelodyRequest` and sends to Rust

5. **Request Validation** (Backend):
   - `MelodyRequest::validate()` checks constraints
   - `sanitize_prompt()` cleans user input

6. **API Key Retrieval** (Backend):
   - `get_api_key(provider)` decrypts stored key
   - Returns error if key not found

7. **Prompt Construction** (Backend):
   - `analyze_prompt_style()` detects user intent
   - `build_system_prompt()` creates AI instructions with:
     - JSON schema
     - Scale constraints
     - Measure bounds
     - Style-specific guidance

8. **AI Provider Call** (Backend):
   - Provider-specific client sends HTTP request
   - Waits for response (timeout: 30s)

9. **Response Parsing** (Backend):
   - Extract JSON from AI response
   - Parse into `Vec<Note>`
   - Create `MelodyResponse` with metadata

10. **Validation** (Backend):
    - `validate_measure_bounds()` - Notes within time range
    - `validate_scale_constraints()` - Notes match scale
    - If validation fails → retry with adjusted prompt (once)

11. **Response Return** (Backend → Frontend):
    - Serialize `MelodyResponse` to JSON
    - Return to frontend via Tauri IPC

12. **Import** (Frontend):
    - User reviews generated notes
    - Clicks "Import"
    - `importAIMelody()` converts to app format
    - Notes added to piano roll
    - Toast notification confirms success

### API Key Management Flow

1. **Setup** (Frontend → Backend):
   - User opens AISettings
   - Enters API key
   - `useAI.saveApiKey(provider, key)` calls Tauri command

2. **Validation** (Backend):
   - `save_ai_api_key()` validates key format
   - Checks length and character validity

3. **Encryption** (Backend):
   - Generate random nonce
   - Get encryption key from machine UID
   - Encrypt key with AES-256-GCM

4. **Storage** (Backend):
   - Write to `api_keys.json` in app data directory
   - Atomic write (temp file + rename)

5. **Test Connection** (Frontend → Backend):
   - User clicks "Test Connection"
   - `test_ai_connection()` makes minimal API call
   - Returns success/failure

6. **Provider List** (Frontend → Backend):
   - On component mount, fetch configured providers
   - `get_configured_ai_providers()` lists providers with keys
   - Frontend enables/disables dropdown options

## Security Considerations

### API Key Security
- **Encryption at Rest**: AES-256-GCM with machine-specific key
- **No Logging**: API keys never logged or printed
- **Secure Transport**: HTTPS (TLS) for all AI provider requests
- **Input Sanitization**: Control characters stripped from prompts
- **Validation**: API keys validated on save

### Input Validation
- **Prompt Length**: 1-1000 characters (enforced frontend + backend)
- **Measures**: 1-16 (enforced frontend + backend)
- **Temperature**: 0.0-2.0 (enforced frontend + backend)
- **Pitch**: 0-127 MIDI (validated after generation)
- **Duration**: > 0 beats (validated after generation)

### Rate Limiting
- **Client-Side**: 10 requests per 60 seconds (prevents abuse)
- **Provider Limits**: Errors from providers include retry-after info
- **Persistent State**: Rate limit survives app restarts

### Error Handling
- **Sanitized Errors**: API keys never included in error messages
- **Type-Specific**: Errors parsed and categorized (auth, rate limit, timeout, etc.)
- **Actionable**: Error messages include next steps for user

## Prompt Engineering Strategy

### System Prompt Structure
The system prompt is carefully designed to balance creativity with musical validity:

1. **Role Definition**: "You are a melody composer..."
2. **Output Format**: Strict JSON schema
3. **Musical Constraints**:
   - Pitch range: MIDI 0-127
   - Duration: > 0 beats
   - Velocity: 0-127
   - Start time: >= 0
4. **Scale Constraints**: Specific MIDI notes if scale selected
5. **Measure Bounds**: Exact number of beats based on measures
6. **Style Guidance**: Dynamic based on prompt analysis

### Style Analysis
Keywords in user prompts trigger specific musical advice:

**Mood Keywords**:
- `happy, cheerful, joyful` → Major intervals, ascending patterns, bright dynamics
- `sad, melancholic, sorrowful` → Minor intervals, descending patterns, soft dynamics
- `dark, mysterious, ominous` → Minor keys, lower register, dissonance
- `calm, peaceful, serene` → Slow movement, sustained notes, soft dynamics

**Dynamics Keywords**:
- `loud, powerful, strong` → Higher velocity (90-127)
- `soft, gentle, quiet` → Lower velocity (30-70)

**Rhythm Keywords**:
- `fast, quick, energetic` → Shorter durations, more notes
- `slow, relaxed, lazy` → Longer durations, fewer notes

**Genre Keywords**:
- `jazz` → Syncopation, swing, chromatic passing tones
- `classical` → Structured phrases, clear harmonic progression
- `pop` → Catchy hooks, repetition, simple rhythm
- `blues` → Blue notes, pentatonic scale, expressive bends
- `ambient` → Sustained notes, sparse rhythm, atmospheric

### Retry Strategy
If initial generation fails validation:
1. Identify failure type (measure bounds vs. scale constraints)
2. Build retry prompt with:
   - More explicit timing constraints
   - Reference to validation failure
   - Stricter output requirements
3. Retry once (prevents infinite loops)
4. Return error if second attempt fails

## Performance Considerations

### Frontend Optimizations
- **Settings Persistence**: Avoid re-fetching configured providers
- **Rate Limit State**: Minimal localStorage reads
- **Cancellation**: AbortController for user-initiated cancellation (UI only)

### Backend Optimizations
- **Connection Reuse**: `reqwest::Client` reused across requests
- **Async Operations**: All AI calls use `tokio` async runtime
- **Validation Caching**: Scale MIDI notes calculated once per request

### Network Optimizations
- **Timeout**: 30-second timeout prevents hanging requests
- **Streaming**: Not implemented (AI providers don't support streaming for JSON mode)
- **Retries**: Limited to 1 retry to avoid excessive API usage

## Future Enhancements

### Planned Features
- **Local AI Models**: Ollama, LM Studio integration (no API key required)
- **Melody Variations**: "Generate similar melody" based on existing notes
- **Multi-Track Generation**: Generate harmony/bass alongside melody
- **Real-Time Streaming**: Display notes as they're generated
- **Style Presets**: One-click "Jazz", "Classical", "Pop" templates
- **Melody Analysis**: AI suggestions for user-created melodies

### Technical Improvements
- **Response Caching**: Cache similar prompts to reduce API costs
- **Batch Processing**: Generate multiple variations in parallel
- **Progressive Enhancement**: Start with short melody, extend on request
- **Better Cancellation**: True backend cancellation (requires tokio task management)

## Testing Strategy

### Unit Tests (Rust)
- API key encryption/decryption
- Note validation logic
- Scale constraint generation
- JSON parsing for each provider
- Error handling for invalid responses

### Integration Tests
- End-to-end melody generation with mock AI responses
- Overlay vs. replace logic
- Import into existing project
- MIDI export of AI-generated melodies

### Manual Testing Checklist
- Test with each AI provider (OpenAI, Gemini, Anthropic, Cohere)
- Test with different scales (major, minor, all root notes)
- Test with different measure counts (1, 4, 8, 16)
- Test overlay on existing notes
- Test error scenarios (invalid API key, network error, rate limit)
- Test UI responsiveness during generation
- Test cost estimates accuracy
- Test rate limiting behavior
- Test API key encryption/decryption
- Test settings persistence across sessions

## Troubleshooting Guide

### Common Issues

**"Generation is slow"**
- AI providers typically take 5-10 seconds
- Gemini is usually fastest, Anthropic slowest
- Complex prompts take longer

**"Notes sound wrong"**
- Check if scale constraint was applied
- Verify notes imported to correct track
- Try different AI provider for better results

**"Cost higher than expected"**
- Long prompts increase input tokens
- Many measures increase output tokens
- Anthropic is typically most expensive

**"Validation errors frequent"**
- Some providers better at following constraints
- Try simpler prompts
- Use explicit scale instructions

### Debugging

**Frontend Debug**:
```typescript
// Enable debug logging in useAI.ts
console.log('Request:', request);
console.log('Response:', response);
```

**Backend Debug**:
```rust
// Enable debug logging in ai_client.rs
println!("Request: {:?}", request);
println!("Response: {:?}", response);
```

**Check Logs**:
- Frontend: Browser DevTools console
- Backend: Terminal running `npm run tauri dev`
- API Keys: Check `~/Library/Application Support/com.piano-app.dev/api_keys.json`

## API Provider Documentation

### OpenAI
- **Docs**: https://platform.openai.com/docs/api-reference
- **Model**: gpt-4o-mini
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **JSON Mode**: `response_format: { type: "json_object" }`

### Google Gemini
- **Docs**: https://ai.google.dev/docs
- **Model**: gemini-1.5-flash
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **JSON Mode**: `responseMimeType: "application/json"`

### Anthropic
- **Docs**: https://docs.anthropic.com/claude/reference
- **Model**: claude-3-5-haiku-20241022
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **JSON Mode**: System prompt instructions

### Cohere
- **Docs**: https://docs.cohere.com/reference/chat
- **Model**: command-r-08-2024
- **Endpoint**: `https://api.cohere.com/v2/chat`
- **JSON Mode**: System prompt instructions

## License & Credits

This AI melody generation system was built as part of the Piano Player application. It demonstrates:
- Secure integration with multiple AI providers
- Robust validation and error handling
- User-friendly prompt engineering
- Cost-aware and rate-limited AI usage
- Practical application of AI in creative tools
