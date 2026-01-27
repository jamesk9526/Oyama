'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Download, 
  MessageSquare, 
  Code2, 
  Eye,
  Zap,
  CheckCircle2,
  Loader2,
  ChevronDown
} from 'lucide-react';

interface Model {
  id: string;
  name: string;
  size: string;
  capabilities: ('chat' | 'code' | 'vision')[];
  isLocal: boolean;
  isDownloading?: boolean;
  downloadProgress?: number;
  performance: 'fast' | 'balanced' | 'quality';
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  onDownload?: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

const capabilityIcons = {
  chat: MessageSquare,
  code: Code2,
  vision: Eye,
};

const capabilityLabels = {
  chat: '💬 Chat',
  code: '💻 Code',
  vision: '🖼️ Vision',
};

const performanceColors = {
  fast: 'text-success',
  balanced: 'text-primary',
  quality: 'text-accent',
};

const performanceLabels = {
  fast: 'Fast',
  balanced: 'Balanced',
  quality: 'Quality',
};

export function ModelSelector({
  models,
  selectedModel,
  onSelect,
  onDownload,
  disabled = false,
  className = '',
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedModelData = models.find(m => m.id === selectedModel);

  // Filter models based on search
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model?.isLocal) {
      onSelect(modelId);
      setIsOpen(false);
    }
  };

  const handleDownload = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(modelId);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-standard border border-border bg-surface hover:bg-muted/20 transition-colors focus-ring ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedModelData ? (
            <>
              <span className="font-medium truncate">{selectedModelData.name}</span>
              <span className="text-caption text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                {selectedModelData.size}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Select a model...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 w-[360px] bg-surface border border-border rounded-relaxed shadow-lg z-50 overflow-hidden"
          role="listbox"
        >
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-9 pr-3 py-2 bg-muted/30 border border-border rounded-standard text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Models List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredModels.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No models found
              </div>
            ) : (
              filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={`w-full p-3 text-left hover:bg-muted/20 transition-colors border-b border-border/40 last:border-b-0 ${
                    selectedModel === model.id ? 'bg-primary/10' : ''
                  } ${!model.isLocal ? 'opacity-75' : ''}`}
                  role="option"
                  aria-selected={selectedModel === model.id}
                  disabled={model.isDownloading}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-caption text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded flex-shrink-0">
                        {model.size}
                      </span>
                    </div>
                    {model.isLocal ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : model.isDownloading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        <span className="text-caption text-primary">{model.downloadProgress}%</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleDownload(model.id, e)}
                        className="flex items-center gap-1 px-2 py-1 text-caption bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </div>
                  
                  {/* Capabilities */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {model.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-caption text-muted-foreground"
                        title={capabilityLabels[cap]}
                      >
                        {capabilityLabels[cap]}
                      </span>
                    ))}
                    <span className="ml-auto flex items-center gap-1">
                      <Zap className={`w-3 h-3 ${performanceColors[model.performance]}`} />
                      <span className={`text-caption ${performanceColors[model.performance]}`}>
                        {performanceLabels[model.performance]}
                      </span>
                    </span>
                  </div>

                  {/* Download Progress Bar */}
                  {model.isDownloading && model.downloadProgress !== undefined && (
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${model.downloadProgress}%` }}
                      />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Download New Model CTA */}
          <div className="p-2 border-t border-border bg-muted/10">
            <button
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:bg-primary/10 rounded-standard transition-colors"
              onClick={() => {
                // TODO: Implement Ollama model browser integration
                // This would navigate to /models page or open a modal
                window.location.href = '/models';
              }}
            >
              <Download className="w-4 h-4" />
              Download new model
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
