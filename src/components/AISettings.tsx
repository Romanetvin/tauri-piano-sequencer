import React, { useState } from 'react';
import { AIProvider, AIProviderConfig } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

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

  const [deleteStatus, setDeleteStatus] = useState<Record<AIProvider, 'idle' | 'deleting' | 'success' | 'error'>>({
    openai: 'idle',
    gemini: 'idle',
    anthropic: 'idle',
    cohere: 'idle',
  });

  const [deleteConfirmProvider, setDeleteConfirmProvider] = useState<AIProvider | null>(null);

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

  const handleDeleteClick = (provider: AIProvider) => {
    setDeleteConfirmProvider(provider);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmProvider) return;

    const provider = deleteConfirmProvider;
    setDeleteConfirmProvider(null);

    setDeleteStatus(prev => ({ ...prev, [provider]: 'deleting' }));

    try {
      await onDeleteApiKey(provider);
      setDeleteStatus(prev => ({ ...prev, [provider]: 'success' }));

      // Reset status after a brief success message
      setTimeout(() => {
        setDeleteStatus(prev => ({ ...prev, [provider]: 'idle' }));
      }, 2000);
    } catch (error) {
      console.error(`Failed to delete API key for ${provider}:`, error);
      setDeleteStatus(prev => ({ ...prev, [provider]: 'error' }));

      // Reset error status
      setTimeout(() => {
        setDeleteStatus(prev => ({ ...prev, [provider]: 'idle' }));
      }, 3000);
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Configure API keys for AI melody generation. Your keys are encrypted and stored locally.
          </DialogDescription>
        </DialogHeader>

        {/* Provider List */}
        <div className="space-y-6 mt-4">
          {providers.map((provider) => (
            <div key={provider.name} className="border rounded-lg p-4">
              {/* Provider Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
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
                    <Button
                      onClick={() => handleTest(provider.name)}
                      disabled={testResults[provider.name] === 'testing' || isLoading}
                      variant="secondary"
                      size="sm"
                    >
                      {testResults[provider.name] === 'testing' ? 'Testing...' :
                       testResults[provider.name] === 'success' ? '✓ Connected' :
                       testResults[provider.name] === 'error' ? '✗ Failed' : 'Test'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(provider.name)}
                      disabled={isLoading || deleteStatus[provider.name] === 'deleting'}
                      variant="destructive"
                      size="sm"
                    >
                      {deleteStatus[provider.name] === 'deleting' ? 'Deleting...' :
                       deleteStatus[provider.name] === 'success' ? '✓ Deleted' :
                       deleteStatus[provider.name] === 'error' ? '✗ Failed' : 'Delete'}
                    </Button>
                  </div>
                )}
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor={`api-key-${provider.name}`}>API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`api-key-${provider.name}`}
                      type={showKeys[provider.name] ? 'text' : 'password'}
                      value={apiKeys[provider.name]}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.name]: e.target.value }))}
                      placeholder={provider.hasApiKey ? '••••••••••••••••' : 'Enter API key'}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => toggleShowKey(provider.name)}
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      type="button"
                    >
                      {showKeys[provider.name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleSave(provider.name)}
                    disabled={!apiKeys[provider.name].trim() || isLoading || saveStatus[provider.name] === 'saving'}
                  >
                    {saveStatus[provider.name] === 'saving' ? 'Saving...' :
                     saveStatus[provider.name] === 'success' ? '✓ Saved' :
                     saveStatus[provider.name] === 'error' ? '✗ Error' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a
                    href={getProviderUrl(provider.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {getProviderUrl(provider.name)}
                  </a>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmProvider !== null} onOpenChange={(open) => !open && setDeleteConfirmProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the API key for{' '}
              {providers.find(p => p.name === deleteConfirmProvider)?.displayName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
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
