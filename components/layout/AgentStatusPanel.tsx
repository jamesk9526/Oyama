'use client';

import { useState, useEffect } from 'react';
import { Activity, ChevronDown, Cpu, MemoryStick } from 'lucide-react';

interface AgentStatusPanelProps {
  agentName?: string;
  currentModel?: string;
  isActive?: boolean;
  onModelChange?: (model: string) => void;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
}

// Available models (would typically come from Ollama API)
const availableModels = [
  { name: 'llama3.2', size: '8B' },
  { name: 'llama3.1', size: '70B' },
  { name: 'mistral', size: '7B' },
  { name: 'codellama', size: '34B' },
  { name: 'gemma2', size: '9B' },
];

export function AgentStatusPanel({
  agentName = 'AI Assistant',
  currentModel = 'llama3.2',
  isActive = false,
  onModelChange,
}: AgentStatusPanelProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>({ cpuUsage: 0, memoryUsage: 0 });
  const [selectedModel, setSelectedModel] = useState(currentModel);

  // Simulate metrics updates (in production, would fetch from system API)
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics({
        cpuUsage: Math.random() * 30 + (isActive ? 40 : 5),
        memoryUsage: Math.random() * 20 + 30,
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 3000);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setShowModelSelector(false);
    onModelChange?.(model);
  };

  const currentModelInfo = availableModels.find(m => m.name === selectedModel) || availableModels[0];

  return (
    <div className="p-3 border-b border-border/60 bg-surface/30">
      {/* Agent Avatar and Status */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div className={`w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ${isActive ? 'animate-pulse-slow' : ''}`}>
            <Activity className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          {isActive && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{agentName}</h3>
          <p className="text-caption text-muted-foreground">
            {isActive ? 'Active' : 'Idle'}
          </p>
        </div>
      </div>

      {/* Model Selector */}
      <div className="relative mb-3">
        <button
          onClick={() => setShowModelSelector(!showModelSelector)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-standard bg-muted/40 hover:bg-muted/60 transition-colors text-sm focus-ring"
          aria-expanded={showModelSelector}
          aria-haspopup="listbox"
        >
          <span className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="font-medium">{currentModelInfo.name}</span>
            <span className="text-caption text-muted-foreground">• {currentModelInfo.size}</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
        </button>

        {showModelSelector && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-standard shadow-lg z-20 overflow-hidden"
            role="listbox"
            aria-label="Select model"
          >
            {availableModels.map((model) => (
              <button
                key={model.name}
                onClick={() => handleModelSelect(model.name)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/40 transition-colors focus-ring ${
                  selectedModel === model.name ? 'bg-primary/10 text-primary' : ''
                }`}
                role="option"
                aria-selected={selectedModel === model.name}
              >
                <span className="font-medium">{model.name}</span>
                <span className="text-caption text-muted-foreground">{model.size}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resource Usage Micro-graphs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/20">
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${metrics.cpuUsage}%` }}
              />
            </div>
          </div>
          <span className="text-caption text-muted-foreground w-8 text-right">
            {Math.round(metrics.cpuUsage)}%
          </span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/20">
          <MemoryStick className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${metrics.memoryUsage}%` }}
              />
            </div>
          </div>
          <span className="text-caption text-muted-foreground w-8 text-right">
            {Math.round(metrics.memoryUsage)}%
          </span>
        </div>
      </div>
    </div>
  );
}
