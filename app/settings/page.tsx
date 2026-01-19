'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Loader, Brain, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useSettingsStore } from '@/lib/stores/settings';
import { OllamaProvider } from '@/lib/providers/ollama';
import { SystemSetupWizard } from '@/components/settings/SystemSetupWizard';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loadingModels, setLoadingModels] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  const [workspaceSaved, setWorkspaceSaved] = useState(false);
  const [providersSaved, setProvidersSaved] = useState(false);
  const [llmSaved, setLlmSaved] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [synthPromptSaved, setSynthPromptSaved] = useState(false);
  const [providersSaving, setProvidersSaving] = useState(false);

  const [memories, setMemories] = useState<Array<{ id: string; content: string; type: string; importance: number }>>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryType, setNewMemoryType] = useState('preference');
  const [newMemoryImportance, setNewMemoryImportance] = useState(5);
  const [addingMemory, setAddingMemory] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [removingDefaults, setRemovingDefaults] = useState(false);
  const [defaultsRemovalMessage, setDefaultsRemovalMessage] = useState('');

  // Local form state
  const [workspaceName, setWorkspaceName] = useState(settings.workspaceName);
  const [workspaceDesc, setWorkspaceDesc] = useState(settings.workspaceDescription);
  const [defaultProvider, setDefaultProvider] = useState(settings.defaultProvider);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaUrl);
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel);
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [synthesizerPrompt, setSynthesizerPrompt] = useState(settings.synthesizerPrompt);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [topP, setTopP] = useState(settings.topP);
  const [enableRunNotifications, setEnableRunNotifications] = useState(settings.enableRunNotifications);

  const isWorkspaceDirty =
    workspaceName !== settings.workspaceName ||
    workspaceDesc !== settings.workspaceDescription ||
    defaultProvider !== settings.defaultProvider;

  const isProvidersDirty =
    ollamaUrl !== settings.ollamaUrl ||
    ollamaModel !== settings.ollamaModel;

  const isLlmDirty =
    temperature !== settings.temperature ||
    topP !== settings.topP;

  const isPromptDirty = systemPrompt !== settings.systemPrompt;
  const isSynthPromptDirty = synthesizerPrompt !== settings.synthesizerPrompt;

  useEffect(() => {
    setWorkspaceName(settings.workspaceName);
    setWorkspaceDesc(settings.workspaceDescription);
    setDefaultProvider(settings.defaultProvider);
  }, [settings.workspaceName, settings.workspaceDescription, settings.defaultProvider]);

  useEffect(() => {
    setOllamaUrl(settings.ollamaUrl);
    setOllamaModel(settings.ollamaModel);
  }, [settings.ollamaUrl, settings.ollamaModel]);

  const providersSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isProvidersDirty) return;

    if (providersSaveTimeout.current) {
      clearTimeout(providersSaveTimeout.current);
    }

    setProvidersSaving(true);
    providersSaveTimeout.current = setTimeout(() => {
      settings.updateSettings({
        ollamaUrl,
        ollamaModel,
      });
      setProvidersSaving(false);
      setProvidersSaved(true);
      setTimeout(() => setProvidersSaved(false), 2000);
    }, 500);

    return () => {
      if (providersSaveTimeout.current) {
        clearTimeout(providersSaveTimeout.current);
      }
    };
  }, [ollamaUrl, ollamaModel, isProvidersDirty, settings]);

  useEffect(() => {
    setTemperature(settings.temperature);
    setTopP(settings.topP);
  }, [settings.temperature, settings.topP]);

  useEffect(() => {
    setSystemPrompt(settings.systemPrompt);
  }, [settings.systemPrompt]);

  useEffect(() => {
    setSynthesizerPrompt(settings.synthesizerPrompt);
  }, [settings.synthesizerPrompt]);

  useEffect(() => {
    setEnableRunNotifications(settings.enableRunNotifications);
  }, [settings.enableRunNotifications]);

  // Fetch Ollama models on mount or when URL changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!ollamaUrl.trim()) return;

      setLoadingModels(true);
      try {
        const provider = new OllamaProvider(ollamaUrl);
        const models = await provider.listModels();
        settings.setOllamaAvailableModels(models);
        setErrorMessage('');
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setErrorMessage('Failed to load models');
        settings.setOllamaAvailableModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    const timer = setTimeout(fetchModels, 500);
    return () => clearTimeout(timer);
  }, [ollamaUrl]);

  // Regenerate system prompt when partner settings change
  useEffect(() => {
    const { generateSystemPrompt } = require('@/lib/stores/settings');
    const newPrompt = generateSystemPrompt(
      settings.systemName,
      settings.userName,
      settings.relationshipType,
      settings.personalityTraits,
      settings.communicationStyle,
      settings.partnerMode,
      settings.partnerGender,
      settings.partnerName
    );
    settings.setSystemPrompt(newPrompt);
  }, [settings.partnerMode, settings.partnerGender, settings.partnerName]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const provider = new OllamaProvider(ollamaUrl);
      const isAvailable = await provider.isAvailable();

      if (isAvailable) {
        setConnectionStatus('success');
        setErrorMessage('');
      } else {
        setConnectionStatus('error');
        setErrorMessage('Connection failed');
      }
    } catch (err) {
      setConnectionStatus('error');
      setErrorMessage('Connection failed. Check the URL and try again.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveWorkspaceSettings = () => {
    settings.updateSettings({
      workspaceName,
      workspaceDescription: workspaceDesc,
      defaultProvider: defaultProvider as 'ollama' | 'openai',
    });
    setWorkspaceSaved(true);
    setTimeout(() => setWorkspaceSaved(false), 2000);
  };

  const handleAddMemory = async () => {
    if (!newMemoryText.trim()) return;

    setAddingMemory(true);
    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMemoryText,
          type: newMemoryType,
          importance: newMemoryImportance,
          sourceType: 'manual',
        }),
      });

      if (response.ok) {
        const newMemory = await response.json();
        setMemories(prev => [newMemory, ...prev]);
        setNewMemoryText('');
        setNewMemoryType('preference');
        setNewMemoryImportance(5);
      }
    } catch (err) {
      console.error('Failed to add memory:', err);
    } finally {
      setAddingMemory(false);
    }
  };

  const handleSavePromptSettings = () => {
    settings.updateSettings({
      systemPrompt,
    });
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  const handleSaveSynthPrompt = () => {
    settings.updateSettings({
      synthesizerPrompt,
    });
    setSynthPromptSaved(true);
    setTimeout(() => setSynthPromptSaved(false), 2000);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setEnableRunNotifications(enabled);
    settings.setEnableRunNotifications(enabled);
    if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  };

  const handleSaveLLMSettings = () => {
    settings.updateSettings({
      temperature,
      topP,
    });
    setLlmSaved(true);
    setTimeout(() => setLlmSaved(false), 2000);
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const backup = await response.json();
        
        // Create JSON blob and download
        const jsonString = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oyama-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (file: File) => {
    setRestoreLoading(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      });

      if (response.ok) {
        alert('Backup restored successfully! Please reload the application.');
        window.location.reload();
      } else {
        alert('Failed to restore backup');
      }
    } catch (err) {
      console.error('Failed to restore backup:', err);
      alert('Failed to read backup file');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleRemoveDefaults = async () => {
    if (!confirm('Remove all default agents and crews? This cannot be undone.')) return;
    setRemovingDefaults(true);
    setDefaultsRemovalMessage('');
    try {
      const response = await fetch('/api/defaults', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to remove default data');
      }
      const result = await response.json();
      setDefaultsRemovalMessage(
        `Removed ${result.removedAgents ?? 0} agents and ${result.removedCrews ?? 0} crews.`
      );
    } catch (err) {
      console.error('Failed to remove default data:', err);
      setDefaultsRemovalMessage('Failed to remove default agents and crews.');
    } finally {
      setRemovingDefaults(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur p-4 pt-12">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your workspace and LLM providers
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl">
          <Tabs defaultValue="workspace">
            <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6">
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="memory">Memory</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>

            {/* Workspace Tab */}
            <TabsContent value="workspace" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Workspace Settings</CardTitle>
                  <CardDescription>
                    Configure your current workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workspace-desc">Description</Label>
                    <Textarea
                      id="workspace-desc"
                      value={workspaceDesc}
                      onChange={(e) => setWorkspaceDesc(e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="default-provider">Default Provider</Label>
                    <Select
                      value={defaultProvider}
                      onChange={(e) => setDefaultProvider(e.target.value as 'ollama' | 'openai')}
                      className="mt-1"
                    >
                      <option value="ollama">Ollama (Local)</option>
                      <option value="openai">OpenAI</option>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleSaveWorkspaceSettings} disabled={!isWorkspaceDirty}>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    {workspaceSaved && (
                      <p className="text-xs text-muted-foreground">Saved</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Personalization</CardTitle>
                  <CardDescription>
                    Customize how the system refers to itself and you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm">
                      System: <span className="font-semibold">{settings.systemName}</span>
                    </p>
                    <p className="text-sm">
                      You are referred to as: <span className="font-semibold">{settings.userName}</span>
                    </p>
                  </div>

                  {/* Auto-Scroll Toggle */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-scroll" className="text-sm font-medium">
                          Auto-scroll to Latest Message
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically scroll to the bottom when new messages arrive
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          id="auto-scroll"
                          type="checkbox"
                          checked={settings.autoScrollToLatest}
                          onChange={(e) => settings.setAutoScrollToLatest(e.target.checked)}
                          className="sr-only peer"
                          aria-label="Auto-scroll to latest message"
                          title="Auto-scroll to latest message"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  {/* Partner Mode Toggle */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="partner-mode" className="text-sm font-medium">
                          Partner Mode (18+)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Enable unrestricted adult conversation
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          To enable: switch the toggle on, then set a partner name and gender below.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          id="partner-mode"
                          type="checkbox"
                          checked={settings.partnerMode}
                          onChange={(e) => settings.setPartnerMode(e.target.checked)}
                          className="sr-only peer"
                          aria-label="Partner mode"
                          title="Partner mode"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    {settings.partnerMode && (
                      <>
                        <div className="mt-4 space-y-3">
                          <div>
                            <Label htmlFor="partner-name" className="text-sm font-medium">
                              Partner Name
                            </Label>
                            <Input
                              id="partner-name"
                              type="text"
                              value={settings.partnerName}
                              onChange={(e) => settings.setPartnerName(e.target.value)}
                              placeholder="Enter partner name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="partner-gender" className="text-sm font-medium">
                              Partner Gender
                            </Label>
                            <Select
                              value={settings.partnerGender}
                              onChange={(e) => settings.setPartnerGender(e.target.value as 'male' | 'female' | 'neutral')}
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="neutral">Neutral</option>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded">
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            Partner Mode is now active. You can disable it anytime by switching the toggle off.
                          </p>
                        </div>
                        <div className="mt-3 p-3 bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/60 rounded">
                          <p className="text-xs text-red-700 dark:text-red-300">
                            <strong>⚠️ Active:</strong> AI will engage in unrestricted adult conversation as {settings.partnerName}, a {settings.partnerGender} partner.
                            Strict boundaries remain for illegal content, minors, and harm.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <Button onClick={() => setShowSetupWizard(true)} variant="secondary">
                    Run Setup Wizard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                  <CardDescription>
                    Quick actions to improve your workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-foreground">New chat</span>
                      <kbd className="px-3 py-1.5 bg-muted rounded text-xs font-mono border border-border">Ctrl+K</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-foreground">Send message</span>
                      <kbd className="px-3 py-1.5 bg-muted rounded text-xs font-mono border border-border">Ctrl+Enter</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-foreground">Focus input</span>
                      <kbd className="px-3 py-1.5 bg-muted rounded text-xs font-mono border border-border">/</kbd>
                    </div>
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        💡 View chat history in the sidebar or manage long-term memory in the Memory tab
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Providers Tab */}
            <TabsContent value="providers" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>LLM Provider Configuration</CardTitle>
                  <CardDescription>
                    Configure your local and cloud LLM providers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ollama Section */}
                  <div>
                    <h3 className="font-semibold mb-4">Ollama (Local)</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ollama-url">Base URL</Label>
                        <Input
                          id="ollama-url"
                          value={ollamaUrl}
                          onChange={(e) => setOllamaUrl(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Default: http://localhost:11434
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="ollama-model">Model</Label>
                        <div className="relative mt-1">
                          <Select
                            id="ollama-model"
                            value={ollamaModel}
                            onChange={(e) => setOllamaModel(e.target.value)}
                            disabled={loadingModels || settings.ollamaAvailableModels.length === 0}
                          >
                            <option value="">
                              {loadingModels ? 'Loading models...' : 'Select a model'}
                            </option>
                            {settings.ollamaAvailableModels.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </Select>
                        </div>
                        {loadingModels && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <Loader className="w-3 h-3 mr-1 animate-spin" />
                            Fetching models...
                          </p>
                        )}
                        {errorMessage && (
                          <p className="text-xs text-destructive mt-1 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errorMessage}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleTestConnection}
                          disabled={testingConnection}
                        >
                          {testingConnection ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              {connectionStatus === 'success' && (
                                <Check className="w-4 h-4 mr-2 text-green-500" />
                              )}
                              {connectionStatus === 'error' && (
                                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                              )}
                              Test Connection
                            </>
                          )}
                        </Button>
                        {providersSaving && (
                          <p className="text-xs text-muted-foreground">Saving...</p>
                        )}
                        {!providersSaving && providersSaved && (
                          <p className="text-xs text-muted-foreground">Saved</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* OpenAI Section */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold mb-4">OpenAI</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="openai-key">API Key</Label>
                        <Input
                          id="openai-key"
                          type="password"
                          placeholder="sk-..."
                          className="mt-1"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Coming soon: OpenAI API integration
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LLM Settings Tab */}
            <TabsContent value="llm" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>LLM Parameters</CardTitle>
                  <CardDescription>
                    Configure model behavior and token limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="temperature">Temperature: {temperature.toFixed(2)}</Label>
                    <input
                      id="temperature"
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full mt-2"
                      aria-label="Temperature"
                      title="Temperature"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lower values are more focused, higher values more creative (0.0-2.0)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="topP">Top P: {topP.toFixed(2)}</Label>
                    <input
                      id="topP"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                      className="w-full mt-2"
                      aria-label="Top P"
                      title="Top P"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls diversity via nucleus sampling (0.0-1.0)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={handleSaveLLMSettings} disabled={!isLlmDirty}>
                      <Check className="w-4 h-4 mr-2" />
                      Save Parameters
                    </Button>
                    {llmSaved && (
                      <p className="text-xs text-muted-foreground">Saved</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Run Notifications</CardTitle>
                  <CardDescription>
                    Desktop notifications when crew runs complete
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Enable run notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Send a notification when a crew run completes or fails.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableRunNotifications}
                      onChange={(e) => handleToggleNotifications(e.target.checked)}
                      className="h-4 w-4"
                      aria-label="Enable run notifications"
                      title="Enable run notifications"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You may be prompted by the system to allow notifications.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prompts Tab */}
            <TabsContent value="prompts" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Global System Prompt</CardTitle>
                  <CardDescription>
                    This prompt applies to all agents unless overridden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={8}
                    className="font-mono"
                  />
                  <div className="flex items-center gap-3">
                    <Button onClick={handleSavePromptSettings} disabled={!isPromptDirty}>
                      <Check className="w-4 h-4 mr-2" />
                      Save Prompt
                    </Button>
                    {promptSaved && (
                      <p className="text-xs text-muted-foreground">Saved</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>System Synthesizer Prompt</CardTitle>
                  <CardDescription>
                    Controls the final synthesized response in Agent Playground
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={synthesizerPrompt}
                    onChange={(e) => setSynthesizerPrompt(e.target.value)}
                    rows={10}
                    className="font-mono"
                  />
                  <div className="flex items-center gap-3">
                    <Button onClick={handleSaveSynthPrompt} disabled={!isSynthPromptDirty}>
                      <Check className="w-4 h-4 mr-2" />
                      Save Synthesizer Prompt
                    </Button>
                    {synthPromptSaved && (
                      <p className="text-xs text-muted-foreground">Saved</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Memory Tab */}
            <TabsContent value="memory" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Long-Term Memory
                      </CardTitle>
                      <CardDescription>
                        Facts and preferences remembered across all conversations
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        setLoadingMemories(true);
                        try {
                          const response = await fetch('/api/memories?limit=100');
                          if (response.ok) {
                            const data = await response.json();
                            setMemories(data);
                          }
                        } catch (err) {
                          console.error('Failed to fetch memories:', err);
                        } finally {
                          setLoadingMemories(false);
                        }
                      }}
                      disabled={loadingMemories}
                    >
                      {loadingMemories ? <Loader className="w-4 h-4 animate-spin" /> : 'Refresh'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Add New Memory Section */}
                  <div className="mb-6 p-4 rounded-lg border border-border bg-secondary/30">
                    <h4 className="font-semibold text-sm mb-3">Add Manual Memory</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Memory Content</Label>
                        <Textarea
                          value={newMemoryText}
                          onChange={(e) => setNewMemoryText(e.target.value)}
                          placeholder="e.g., I prefer detailed technical explanations..."
                          className="text-sm resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Type</Label>
                          <Select 
                            value={newMemoryType} 
                            onChange={(e) => setNewMemoryType(e.target.value)}
                          >
                            <option value="fact">Fact</option>
                            <option value="preference">Preference</option>
                            <option value="context">Context</option>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Importance: {newMemoryImportance}/10</Label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={newMemoryImportance}
                            onChange={(e) => setNewMemoryImportance(parseInt(e.target.value))}
                            className="w-full"
                            aria-label={`Memory importance ${newMemoryImportance}`}
                            title="Memory importance"
                          />
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={handleAddMemory}
                        disabled={!newMemoryText.trim() || addingMemory}
                        className="w-full"
                      >
                        {addingMemory ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Add Memory
                      </Button>
                    </div>
                  </div>

                  {/* Existing Memories */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">Stored Memories</h4>
                      <Button 
                        size="sm" 
                        onClick={async () => {
                          setLoadingMemories(true);
                          try {
                            const response = await fetch('/api/memories?limit=100');
                            if (response.ok) {
                              const data = await response.json();
                              setMemories(data);
                            }
                          } catch (err) {
                            console.error('Failed to fetch memories:', err);
                          } finally {
                            setLoadingMemories(false);
                          }
                        }}
                        disabled={loadingMemories}
                      >
                        {loadingMemories ? <Loader className="w-4 h-4 animate-spin" /> : 'Refresh'}
                      </Button>
                    </div>
                  
                    {loadingMemories ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : memories.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No memories stored yet. Start chatting or add memories manually to build your memory bank!</p>
                    ) : (
                      <div className="space-y-3">
                        {memories.map((memory) => (
                          <div
                            key={memory.id}
                            className="group rounded-lg p-3 border border-border bg-background/60 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                memory.type === 'fact' ? 'bg-blue-500/10 text-blue-500' :
                                memory.type === 'preference' ? 'bg-purple-500/10 text-purple-500' :
                                'bg-green-500/10 text-green-500'
                              }`}>
                                {memory.type}
                              </span>
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this memory?')) {
                                    try {
                                      await fetch(`/api/memories/${memory.id}`, { method: 'DELETE' });
                                      setMemories(prev => prev.filter(m => m.id !== memory.id));
                                    } catch (err) {
                                      console.error('Failed to delete memory:', err);
                                    }
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                                aria-label="Delete memory"
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </button>
                            </div>
                            <p className="text-sm">{memory.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-primary transition-all ${
                                    memory.importance >= 8 ? 'w-[80%]' :
                                    memory.importance >= 6 ? 'w-[60%]' :
                                    memory.importance >= 4 ? 'w-[40%]' :
                                    'w-[20%]'
                                  }`}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{memory.importance}/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backup & Restore Tab */}
            <TabsContent value="backup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Backup & Restore</CardTitle>
                  <CardDescription>
                    Backup all your chats, agents, templates, and settings to a JSON file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Create Backup Section */}
                  <div className="p-4 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Create Backup</h4>
                        <p className="text-xs text-muted-foreground">
                          Download a complete backup of your application data including all chats, agents, templates, memories, and settings.
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleCreateBackup}
                      disabled={backupLoading}
                      className="w-full"
                    >
                      {backupLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {backupLoading ? 'Creating Backup...' : 'Download Backup'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      The backup file can be saved and used later to restore your data.
                    </p>
                  </div>

                  {/* Restore Backup Section */}
                  <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-1 text-destructive">Restore from Backup</h4>
                        <p className="text-xs text-muted-foreground">
                          Upload a previously downloaded backup file to restore your data. This will merge with existing data.
                        </p>
                      </div>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleRestoreBackup(e.target.files[0]);
                          }
                        }}
                        disabled={restoreLoading}
                        className="hidden"
                        id="backup-file"
                      />
                      <label htmlFor="backup-file" className="cursor-pointer">
                        <Button 
                          variant="secondary"
                          disabled={restoreLoading}
                          className="w-full"
                          onClick={() => document.getElementById('backup-file')?.click()}
                        >
                          {restoreLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                          {restoreLoading ? 'Restoring...' : 'Select Backup File'}
                        </Button>
                      </label>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground space-y-1">
                    <p>✓ Backup includes: chats, messages, agents, crews, templates, memories, and settings</p>
                    <p>✓ Backup files are portable and can be used for migration or recovery</p>
                    <p>✓ Restore can be performed at any time without losing existing data</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Default Data</CardTitle>
                  <CardDescription>
                    Remove the built-in starter agents and crews from your workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    This action deletes only the default agents and crews added by the seed data.
                    Your custom agents and crews remain intact.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleRemoveDefaults}
                    disabled={removingDefaults}
                    className="w-full"
                  >
                    {removingDefaults ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {removingDefaults ? 'Removing Defaults...' : 'Remove Default Agents & Crews'}
                  </Button>
                  {defaultsRemovalMessage ? (
                    <p className="text-xs text-muted-foreground">{defaultsRemovalMessage}</p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SystemSetupWizard
        isOpen={showSetupWizard}
        onClose={() => setShowSetupWizard(false)}
      />
    </div>
  );
}
