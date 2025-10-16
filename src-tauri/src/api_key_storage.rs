use crate::ai_models::AIProvider;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use anyhow::{Context, Result};
use base64::prelude::*;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// Storage for encrypted API keys
#[derive(Debug, Serialize, Deserialize, Default)]
struct KeyStorage {
    /// Encrypted API keys by provider
    keys: HashMap<String, EncryptedKey>,
}

#[derive(Debug, Serialize, Deserialize)]
struct EncryptedKey {
    /// Base64-encoded encrypted data
    ciphertext: String,
    /// Base64-encoded nonce
    nonce: String,
}

pub struct ApiKeyManager {
    storage_path: PathBuf,
    encryption_key: [u8; 32],
}

impl ApiKeyManager {
    /// Create a new API key manager
    pub fn new(app_data_dir: PathBuf) -> Result<Self> {
        // Ensure the directory exists
        fs::create_dir_all(&app_data_dir).context("Failed to create app data directory")?;

        // Get or create encryption key
        let encryption_key = Self::get_or_create_encryption_key(&app_data_dir)?;

        let storage_path = app_data_dir.join("api_keys.json");

        Ok(Self {
            storage_path,
            encryption_key,
        })
    }

    /// Get or create the encryption key based on machine ID
    ///
    /// This function creates a machine-specific encryption key to protect API keys at rest.
    /// The key is derived from the machine's unique ID (hardware identifier) plus a random
    /// salt, making it unique per machine and per installation.
    ///
    /// **Security considerations**:
    /// - Keys are stored in a hidden file (.key) in the app data directory
    /// - The key derivation uses machine ID XOR random salt (simple but effective for this use case)
    /// - For higher security, consider PBKDF2 or Argon2 for key derivation
    /// - The key is 256 bits (32 bytes) to match AES-256-GCM requirements
    ///
    /// **Why machine-specific?**
    /// If someone copies the encrypted API keys file to another machine, they won't be able
    /// to decrypt it without also copying the .key file. This provides defense in depth.
    ///
    /// # Arguments
    /// * `app_data_dir` - Directory where encryption key will be stored
    ///
    /// # Returns
    /// A 32-byte encryption key for use with AES-256-GCM
    fn get_or_create_encryption_key(app_data_dir: &PathBuf) -> Result<[u8; 32]> {
        let key_file = app_data_dir.join(".key");

        if key_file.exists() {
            // Load existing key from disk (for subsequent app launches)
            let key_data = fs::read(&key_file).context("Failed to read encryption key")?;
            if key_data.len() != 32 {
                return Err(anyhow::anyhow!("Invalid encryption key length"));
            }
            let mut key = [0u8; 32];
            key.copy_from_slice(&key_data);
            Ok(key)
        } else {
            // First launch: Generate new key from machine ID + random salt
            let machine_id = machine_uid::get().unwrap_or_else(|_| "default-machine-id".to_string());
            let mut rng = rand::thread_rng();
            let salt: [u8; 16] = rng.gen();

            // Key derivation: XOR machine ID bytes with salt
            // This creates a deterministic but machine-specific key
            let mut key = [0u8; 32];
            let machine_bytes = machine_id.as_bytes();

            for i in 0..32 {
                key[i] = machine_bytes.get(i % machine_bytes.len()).copied().unwrap_or(0)
                    ^ salt.get(i % salt.len()).copied().unwrap_or(0);
            }

            // Persist the key for future app launches
            fs::write(&key_file, &key).context("Failed to save encryption key")?;

            Ok(key)
        }
    }

    /// Load the key storage from disk
    fn load_storage(&self) -> Result<KeyStorage> {
        if !self.storage_path.exists() {
            return Ok(KeyStorage::default());
        }

        let data = fs::read_to_string(&self.storage_path).context("Failed to read key storage")?;
        let storage: KeyStorage = serde_json::from_str(&data).context("Failed to parse key storage")?;

        Ok(storage)
    }

    /// Save the key storage to disk
    fn save_storage(&self, storage: &KeyStorage) -> Result<()> {
        let data = serde_json::to_string_pretty(storage).context("Failed to serialize key storage")?;
        fs::write(&self.storage_path, data).context("Failed to write key storage")?;
        Ok(())
    }

    /// Encrypt data using AES-GCM
    ///
    /// Uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption.
    /// GCM provides both confidentiality and integrity protection.
    ///
    /// **Why AES-GCM?**
    /// - Industry standard for authenticated encryption
    /// - Protects against tampering (integrity) and eavesdropping (confidentiality)
    /// - Efficient implementation in modern CPUs (AES-NI instructions)
    ///
    /// **Nonce (Number used ONCE)**:
    /// - 12 bytes (96 bits) is the standard size for GCM
    /// - Must be unique for each encryption operation
    /// - We generate a random nonce per API key, stored alongside the ciphertext
    /// - Since we encrypt infrequently (only when saving keys), collision risk is negligible
    ///
    /// # Arguments
    /// * `plaintext` - The API key to encrypt
    ///
    /// # Returns
    /// `EncryptedKey` containing base64-encoded ciphertext and nonce
    fn encrypt(&self, plaintext: &str) -> Result<EncryptedKey> {
        let cipher = Aes256Gcm::new(&self.encryption_key.into());

        // Generate random nonce (must be unique per encryption)
        let mut rng = rand::thread_rng();
        let nonce_bytes: [u8; 12] = rng.gen();
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt the API key
        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

        // Encode as base64 for JSON storage (binary data → text)
        Ok(EncryptedKey {
            ciphertext: base64::prelude::BASE64_STANDARD.encode(&ciphertext),
            nonce: base64::prelude::BASE64_STANDARD.encode(&nonce_bytes),
        })
    }

    /// Decrypt data using AES-GCM
    ///
    /// Reverses the encryption process to recover the original API key.
    /// The nonce must match the one used during encryption.
    ///
    /// **Authentication check**:
    /// AES-GCM automatically verifies the authentication tag during decryption.
    /// If the ciphertext or nonce has been tampered with, decryption will fail
    /// with an error, preventing the use of corrupted or malicious data.
    ///
    /// # Arguments
    /// * `encrypted` - The encrypted key with nonce
    ///
    /// # Returns
    /// The decrypted API key as a UTF-8 string
    ///
    /// # Errors
    /// - Invalid base64 encoding
    /// - Authentication tag verification failed (tampering detected)
    /// - Invalid UTF-8 in decrypted data
    fn decrypt(&self, encrypted: &EncryptedKey) -> Result<String> {
        let cipher = Aes256Gcm::new(&self.encryption_key.into());

        // Decode from base64 (text → binary data)
        let ciphertext = BASE64_STANDARD.decode(&encrypted.ciphertext).context("Invalid base64 ciphertext")?;
        let nonce_bytes = BASE64_STANDARD.decode(&encrypted.nonce).context("Invalid base64 nonce")?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Decrypt and verify authentication tag
        let plaintext = cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|e| anyhow::anyhow!("Decryption failed: {}", e))?;

        String::from_utf8(plaintext).context("Invalid UTF-8 in decrypted data")
    }

    /// Save an API key for a provider
    pub fn save_api_key(&self, provider: &AIProvider, api_key: &str) -> Result<()> {
        let mut storage = self.load_storage()?;

        let encrypted = self.encrypt(api_key)?;
        storage.keys.insert(provider.as_str().to_string(), encrypted);

        self.save_storage(&storage)?;
        Ok(())
    }

    /// Get an API key for a provider
    pub fn get_api_key(&self, provider: &AIProvider) -> Result<Option<String>> {
        let storage = self.load_storage()?;

        if let Some(encrypted) = storage.keys.get(provider.as_str()) {
            let decrypted = self.decrypt(encrypted)?;
            Ok(Some(decrypted))
        } else {
            Ok(None)
        }
    }

    /// Delete an API key for a provider
    pub fn delete_api_key(&self, provider: &AIProvider) -> Result<()> {
        let mut storage = self.load_storage()?;
        storage.keys.remove(provider.as_str());
        self.save_storage(&storage)?;
        Ok(())
    }

    /// List all configured providers
    pub fn list_configured_providers(&self) -> Result<Vec<AIProvider>> {
        let storage = self.load_storage()?;

        let providers: Vec<AIProvider> = storage
            .keys
            .keys()
            .filter_map(|key| AIProvider::from_str(key))
            .collect();

        Ok(providers)
    }

    /// Check if a provider has an API key configured
    #[allow(dead_code)]
    pub fn has_api_key(&self, provider: &AIProvider) -> bool {
        self.load_storage()
            .ok()
            .and_then(|storage| storage.keys.get(provider.as_str()).map(|_| true))
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_encryption_roundtrip() {
        let temp_dir = env::temp_dir().join("piano-app-test");
        fs::create_dir_all(&temp_dir).unwrap();

        let manager = ApiKeyManager::new(temp_dir.clone()).unwrap();

        let original = "sk-test-api-key-1234567890";
        let encrypted = manager.encrypt(original).unwrap();
        let decrypted = manager.decrypt(&encrypted).unwrap();

        assert_eq!(original, decrypted);

        // Cleanup
        fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_save_and_load_api_key() {
        let temp_dir = env::temp_dir().join("piano-app-test-2");
        fs::create_dir_all(&temp_dir).unwrap();

        let manager = ApiKeyManager::new(temp_dir.clone()).unwrap();

        let api_key = "sk-openai-test-key";
        manager.save_api_key(&AIProvider::OpenAI, api_key).unwrap();

        let loaded = manager.get_api_key(&AIProvider::OpenAI).unwrap();
        assert_eq!(Some(api_key.to_string()), loaded);

        let providers = manager.list_configured_providers().unwrap();
        assert!(providers.contains(&AIProvider::OpenAI));

        // Cleanup
        fs::remove_dir_all(&temp_dir).ok();
    }
}
