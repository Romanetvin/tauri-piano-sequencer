use crate::ai_models::{AIProvider, GenerationMetadata, MelodyRequest, MelodyResponse, Note};
use crate::ai_prompts::{build_system_prompt, build_user_prompt, extract_json};
use anyhow::{Context, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[async_trait]
pub trait AIClient: Send + Sync {
    async fn generate_melody(&self, request: &MelodyRequest, api_key: &str) -> Result<MelodyResponse>;
}

// ============================================================================
// OpenAI Client
// ============================================================================

pub struct OpenAIClient {
    client: Client,
}

impl OpenAIClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAIMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct AINotesResponse {
    notes: Vec<AINote>,
}

#[derive(Debug, Deserialize)]
struct AINote {
    pitch: u8,
    #[serde(alias = "startTime", alias = "start_time")]
    start_time: f64,
    duration: f64,
    velocity: u8,
}

#[async_trait]
impl AIClient for OpenAIClient {
    async fn generate_melody(&self, request: &MelodyRequest, api_key: &str) -> Result<MelodyResponse> {
        let system_prompt = build_system_prompt(request);
        let user_prompt = build_user_prompt(request);

        let body = json!({
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            "temperature": request.temperature.unwrap_or(1.0),
            "response_format": { "type": "json_object" }
        });

        let response = self
            .client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .context("Failed to send request to OpenAI")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(anyhow::anyhow!("OpenAI API error ({}): {}", status, error_text));
        }

        let openai_response: OpenAIResponse = response
            .json()
            .await
            .context("Failed to parse OpenAI response")?;

        let content = openai_response
            .choices
            .first()
            .ok_or_else(|| anyhow::anyhow!("No choices in OpenAI response"))?
            .message
            .content
            .clone();

        // Extract and parse JSON
        let json_str = extract_json(&content).ok_or_else(|| anyhow::anyhow!("No valid JSON found in response"))?;

        let ai_notes: AINotesResponse = serde_json::from_str(&json_str).context("Failed to parse notes JSON")?;

        // Convert to our Note format
        let notes: Vec<Note> = ai_notes
            .notes
            .into_iter()
            .map(|n| Note {
                id: uuid::Uuid::new_v4().to_string(),
                pitch: n.pitch,
                start_time: n.start_time,
                duration: n.duration,
                velocity: n.velocity,
                track_id: "track_right_hand".to_string(), // Default track
            })
            .collect();

        Ok(MelodyResponse {
            notes,
            metadata: GenerationMetadata {
                provider: AIProvider::OpenAI,
                timestamp: chrono::Utc::now().to_rfc3339(),
                model_name: "gpt-4o-mini".to_string(),
                temperature: request.temperature.unwrap_or(1.0),
                scale: request.scale.clone(),
            },
        })
    }
}

// ============================================================================
// Gemini Client
// ============================================================================

pub struct GeminiClient {
    client: Client,
}

impl GeminiClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: GeminiContent,
}

#[derive(Debug, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Deserialize)]
struct GeminiPart {
    text: String,
}

#[async_trait]
impl AIClient for GeminiClient {
    async fn generate_melody(&self, request: &MelodyRequest, api_key: &str) -> Result<MelodyResponse> {
        let system_prompt = build_system_prompt(request);
        let user_prompt = build_user_prompt(request);
        let combined_prompt = format!("{}\n\n{}", system_prompt, user_prompt);

        let body = json!({
            "contents": [{
                "parts": [{
                    "text": combined_prompt
                }]
            }],
            "generationConfig": {
                "temperature": request.temperature.unwrap_or(1.0),
                "responseMimeType": "application/json"
            }
        });

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={}",
            api_key
        );

        let response = self
            .client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .context("Failed to send request to Gemini")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(anyhow::anyhow!("Gemini API error ({}): {}", status, error_text));
        }

        let gemini_response: GeminiResponse = response
            .json()
            .await
            .context("Failed to parse Gemini response")?;

        let content = gemini_response
            .candidates
            .first()
            .ok_or_else(|| anyhow::anyhow!("No candidates in Gemini response"))?
            .content
            .parts
            .first()
            .ok_or_else(|| anyhow::anyhow!("No parts in Gemini response"))?
            .text
            .clone();

        // Extract and parse JSON
        let json_str = extract_json(&content).ok_or_else(|| anyhow::anyhow!("No valid JSON found in response"))?;

        let ai_notes: AINotesResponse = serde_json::from_str(&json_str).context("Failed to parse notes JSON")?;

        // Convert to our Note format
        let notes: Vec<Note> = ai_notes
            .notes
            .into_iter()
            .map(|n| Note {
                id: uuid::Uuid::new_v4().to_string(),
                pitch: n.pitch,
                start_time: n.start_time,
                duration: n.duration,
                velocity: n.velocity,
                track_id: "track_right_hand".to_string(),
            })
            .collect();

        Ok(MelodyResponse {
            notes,
            metadata: GenerationMetadata {
                provider: AIProvider::Gemini,
                timestamp: chrono::Utc::now().to_rfc3339(),
                model_name: "gemini-1.5-flash".to_string(),
                temperature: request.temperature.unwrap_or(1.0),
                scale: request.scale.clone(),
            },
        })
    }
}

// ============================================================================
// Anthropic Client
// ============================================================================

pub struct AnthropicClient {
    client: Client,
}

impl AnthropicClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }
}

#[derive(Debug, Deserialize)]
struct AnthropicResponse {
    content: Vec<AnthropicContent>,
}

#[derive(Debug, Deserialize)]
struct AnthropicContent {
    text: String,
}

#[async_trait]
impl AIClient for AnthropicClient {
    async fn generate_melody(&self, request: &MelodyRequest, api_key: &str) -> Result<MelodyResponse> {
        let system_prompt = build_system_prompt(request);
        let user_prompt = build_user_prompt(request);

        let body = json!({
            "model": "claude-3-5-haiku-20241022",
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            "temperature": request.temperature.unwrap_or(1.0)
        });

        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .context("Failed to send request to Anthropic")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(anyhow::anyhow!("Anthropic API error ({}): {}", status, error_text));
        }

        let anthropic_response: AnthropicResponse = response
            .json()
            .await
            .context("Failed to parse Anthropic response")?;

        let content = anthropic_response
            .content
            .first()
            .ok_or_else(|| anyhow::anyhow!("No content in Anthropic response"))?
            .text
            .clone();

        // Extract and parse JSON
        let json_str = extract_json(&content).ok_or_else(|| anyhow::anyhow!("No valid JSON found in response"))?;

        let ai_notes: AINotesResponse = serde_json::from_str(&json_str).context("Failed to parse notes JSON")?;

        // Convert to our Note format
        let notes: Vec<Note> = ai_notes
            .notes
            .into_iter()
            .map(|n| Note {
                id: uuid::Uuid::new_v4().to_string(),
                pitch: n.pitch,
                start_time: n.start_time,
                duration: n.duration,
                velocity: n.velocity,
                track_id: "track_right_hand".to_string(),
            })
            .collect();

        Ok(MelodyResponse {
            notes,
            metadata: GenerationMetadata {
                provider: AIProvider::Anthropic,
                timestamp: chrono::Utc::now().to_rfc3339(),
                model_name: "claude-3-5-haiku-20241022".to_string(),
                temperature: request.temperature.unwrap_or(1.0),
                scale: request.scale.clone(),
            },
        })
    }
}

// ============================================================================
// Cohere Client (Placeholder)
// ============================================================================

pub struct CohereClient {
    client: Client,
}

impl CohereClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }
}

#[async_trait]
impl AIClient for CohereClient {
    async fn generate_melody(&self, _request: &MelodyRequest, _api_key: &str) -> Result<MelodyResponse> {
        Err(anyhow::anyhow!("Cohere client not yet implemented"))
    }
}

// ============================================================================
// Client Factory
// ============================================================================

pub fn create_client(provider: &AIProvider) -> Box<dyn AIClient> {
    match provider {
        AIProvider::OpenAI => Box::new(OpenAIClient::new()),
        AIProvider::Gemini => Box::new(GeminiClient::new()),
        AIProvider::Anthropic => Box::new(AnthropicClient::new()),
        AIProvider::Cohere => Box::new(CohereClient::new()),
    }
}
