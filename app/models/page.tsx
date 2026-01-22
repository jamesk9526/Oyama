'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Cpu, Plus, Trash2, CheckCircle, XCircle, RefreshCw, Settings2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useSettingsStore } from '@/lib/stores/settings';

interface OllamaEndpoint {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'testing';
  models: string[];
}

export default function ModelsPage() {
  const settings = useSettingsStore();
  const [endpoints, setEndpoints] = useState<OllamaEndpoint[]>([
    {
      id: 'local',
      name: 'Local',
      url: settings.ollamaUrl,
      status: 'disconnected',
      models: []
    }
  ]);
  const [newEndpointUrl, setNewEndpointUrl] = useState('');
  const [newEndpointName, setNewEndpointName] = useState('');

  const testConnection = async (endpoint: OllamaEndpoint) => {
    setEndpoints(prev => prev.map(e => 
      e.id === endpoint.id ? { ...e, status: 'testing' } : e
    ));

    try {
      const response = await fetch(`${endpoint.url}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        setEndpoints(prev => prev.map(e => 
          e.id === endpoint.id 
            ? { ...e, status: 'connected', models: data.models?.map((m: any) => m.name) || [] }
            : e
        ));
      } else {
        setEndpoints(prev => prev.map(e => 
          e.id === endpoint.id ? { ...e, status: 'disconnected' } : e
        ));
      }
    } catch (error) {
      setEndpoints(prev => prev.map(e => 
        e.id === endpoint.id ? { ...e, status: 'disconnected' } : e
      ));
    }
  };

  const addEndpoint = () => {
    if (!newEndpointUrl || !newEndpointName) return;
    
    const newEndpoint: OllamaEndpoint = {
      id: Date.now().toString(),
      name: newEndpointName,
      url: newEndpointUrl,
      status: 'disconnected',
      models: []
    };

    setEndpoints(prev => [...prev, newEndpoint]);
    setNewEndpointUrl('');
    setNewEndpointName('');
    testConnection(newEndpoint);
  };

  const removeEndpoint = (id: string) => {
    setEndpoints(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Models / Providers</h1>
            <p className="text-muted-foreground mt-1">
              Configure LLM providers and manage model availability
            </p>
          </div>
        </div>

        {/* Info Panel */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Cpu className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">About Models & Providers</p>
                <p className="text-muted-foreground mt-1">
                  Configure multiple Ollama endpoints (local and LAN), test connections, and manage model 
                  availability. Models can be selected per agent, crew, or workflow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="ollama" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ollama">Ollama Endpoints</TabsTrigger>
            <TabsTrigger value="openai">OpenAI Compatible</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="ollama" className="space-y-4">
            {/* Add New Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle>Add Ollama Endpoint</CardTitle>
                <CardDescription>
                  Add local or LAN Ollama endpoints for model access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="e.g., Local Machine"
                        value={newEndpointName}
                        onChange={(e) => setNewEndpointName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        placeholder="http://localhost:11434"
                        value={newEndpointUrl}
                        onChange={(e) => setNewEndpointUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={addEndpoint} disabled={!newEndpointUrl || !newEndpointName}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Endpoint
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Endpoints List */}
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <Card key={endpoint.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                        <Badge variant={
                          endpoint.status === 'connected' ? 'success' :
                          endpoint.status === 'testing' ? 'warning' : 'destructive'
                        }>
                          {endpoint.status === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {endpoint.status === 'disconnected' && <XCircle className="w-3 h-3 mr-1" />}
                          {endpoint.status === 'testing' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {endpoint.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => testConnection(endpoint)}
                          disabled={endpoint.status === 'testing'}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                        {endpoint.id !== 'local' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeEndpoint(endpoint.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>{endpoint.url}</CardDescription>
                  </CardHeader>
                  {endpoint.models.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Available Models ({endpoint.models.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {endpoint.models.map((model) => (
                            <Badge key={model} variant="default">
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="openai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>OpenAI Compatible API</CardTitle>
                <CardDescription>
                  Configure OpenAI-compatible API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={settings.openaiApiKey}
                      onChange={(e) => settings.setOpenaiApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Base URL (Optional)</Label>
                    <Input
                      placeholder="https://api.openai.com/v1"
                      defaultValue="https://api.openai.com/v1"
                    />
                  </div>
                  <Button>Save Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Global LLM Parameters</CardTitle>
                <CardDescription>
                  Default parameters for all model calls (can be overridden per agent/workflow)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Temperature</Label>
                      <span className="text-sm text-muted-foreground">{settings.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => settings.setTemperature(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Top P</Label>
                      <span className="text-sm text-muted-foreground">{settings.topP}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.topP}
                      onChange={(e) => settings.setTopP(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={settings.maxTokens}
                      onChange={(e) => settings.setMaxTokens(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
