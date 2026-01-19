'use client';

import { useState, useEffect } from 'react';
import { Check, AlertCircle, Loader, ChevronDown } from 'lucide-react';
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

  // Local form state
  const [workspaceName, setWorkspaceName] = useState(settings.workspaceName);
  const [workspaceDesc, setWorkspaceDesc] = useState(settings.workspaceDescription);
  const [defaultProvider, setDefaultProvider] = useState(settings.defaultProvider);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaUrl);
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel);
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [topP, setTopP] = useState(settings.topP);

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
  };

  const handleSaveOllamaSettings = () => {
    settings.updateSettings({
      ollamaUrl,
      ollamaModel,
    });
  };

  const handleSavePromptSettings = () => {
    settings.updateSettings({
      systemPrompt,
    });
  };

  const handleSaveLLMSettings = () => {
    settings.updateSettings({
      temperature,
      topP,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your workspace and LLM providers
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl">
          <Tabs defaultValue="workspace">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
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
                  <Button onClick={handleSaveWorkspaceSettings}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
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
                  <Button
                    onClick={() => setShowSetupWizard(true)}
                    variant="secondary"
                  >
                    Run Setup Wizard
                  </Button>
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

                      <div className="flex gap-2">
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
                        <Button variant="secondary" size="sm" onClick={handleSaveOllamaSettings}>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
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
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls diversity via nucleus sampling (0.0-1.0)
                    </p>
                  </div>

                  <Button onClick={handleSaveLLMSettings}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Parameters
                  </Button>
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
                  <Button onClick={handleSavePromptSettings}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Prompt
                  </Button>
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
