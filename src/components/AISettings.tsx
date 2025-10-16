import React, { useState } from 'react';
import { AIProvider, AIProviderConfig } from '../types';

interface AISettingsProps {
  providers: AIProviderConfig[];
  onSaveApiKey: (provider: AIProvider, apiKey: string) => Promise<void>;
  onDeleteApiKey: (provider: AIProvider) => Promise<void>;
  onTestConnection: (provider: AIProvider) => Promise<boolean>;
  onClose: () => void;
  isLoading: boolean;
}

const AISettings: React.FC<AISettingsProps> = ({
  providers,
  onSaveApiKey,
  onDeleteApiKey,
  onTestConnection,
  onClose,
  isLoading,
}) => {
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    openai: '',
    gemini: '',
    anthropic: '',
    cohere: '',
  });

  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    gemini: false,
    anthropic: false,
    cohere: false,
  });

  const [testResults, setTestResults] = useState<Record<AIProvider, 'idle' | 'testing' | 'success' | 'error'>>({
    openai: 'idle',
    gemini: 'idle',
    anthropic: 'idle',
    cohere: 'idle',
  });

  const [saveStatus, setSaveStatus] = useState<Record<AIProvider, 'idle' | 'saving' | 'success' | 'error'>>({
    openai: 'idle',
    gemini: 'idle',
    anthropic: 'idle',
    cohere: 'idle',
  });

  const handleSave = async (provider: AIProvider) => {
    const apiKey = apiKeys[provider].trim();
    if (!apiKey) return;

    setSaveStatus(prev => ({ ...prev, [provider]: 'saving' }));

    try {
      await onSaveApiKey(provider, apiKey);
      setSaveStatus(prev => ({ ...prev, [provider]: 'success' }));
      setApiKeys(prev => ({ ...prev, [provider]: '' })); // Clear input after save
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [provider]: 'idle' }));
      }, 2000);
    } catch (error) {
      setSaveStatus(prev => ({ ...prev, [provider]: 'error' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [provider]: 'idle' }));
      }, 3000);
    }
  };

  const handleDelete = async (provider: AIProvider) => {
    if (!confirm(`Remove API key for ${providers.find(p => p.name === provider)?.displayName}?`)) {
      return;
    }

    try {
      await onDeleteApiKey(provider);
    } catch (error) {
      alert(`Failed to delete API key: ${error}`);
    }
  };

  const handleTest = async (provider: AIProvider) => {
    setTestResults(prev => ({ ...prev, [provider]: 'testing' }));

    try {
      const success = await onTestConnection(provider);
      setTestResults(prev => ({ ...prev, [provider]: success ? 'success' : 'error' }));
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [provider]: 'idle' }));
      }, 3000);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [provider]: 'idle' }));
      }, 3000);
    }
  };

  const toggleShowKey = (provider: AIProvider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configure API keys for AI melody generation. Your keys are encrypted and stored locally.
          </p>

          {/* Provider List */}
          <div className="space-y-6">
            {providers.map((provider) => (
              <div key={provider.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {/* Provider Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {provider.displayName}
                    </h3>
                    {provider.hasApiKey && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                        ✓ Configured
                      </span>
                    )}
                  </div>
                  {provider.hasApiKey && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTest(provider.name)}
                        disabled={testResults[provider.name] === 'testing' || isLoading}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
                      >
                        {testResults[provider.name] === 'testing' ? 'Testing...' :
                         testResults[provider.name] === 'success' ? '✓ Connected' :
                         testResults[provider.name] === 'error' ? '✗ Failed' : 'Test'}
                      </button>
                      <button
                        onClick={() => handleDelete(provider.name)}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* API Key Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKeys[provider.name] ? 'text' : 'password'}
                        value={apiKeys[provider.name]}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.name]: e.target.value }))}
                        placeholder={provider.hasApiKey ? '••••••••••••••••' : 'Enter API key'}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                      <button
                        onClick={() => toggleShowKey(provider.name)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        type="button"
                      >
                        {showKeys[provider.name] ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => handleSave(provider.name)}
                      disabled={!apiKeys[provider.name].trim() || isLoading || saveStatus[provider.name] === 'saving'}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {saveStatus[provider.name] === 'saving' ? 'Saving...' :
                       saveStatus[provider.name] === 'success' ? '✓ Saved' :
                       saveStatus[provider.name] === 'error' ? '✗ Error' : 'Save'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from{' '}
                    <a
                      href={getProviderUrl(provider.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 hover:underline"
                    >
                      {getProviderUrl(provider.name)}
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

function getProviderUrl(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'https://platform.openai.com/api-keys';
    case 'gemini':
      return 'https://makersuite.google.com/app/apikey';
    case 'anthropic':
      return 'https://console.anthropic.com/settings/keys';
    case 'cohere':
      return 'https://dashboard.cohere.com/api-keys';
    default:
      return '#';
  }
}

export default AISettings;
