'use client';

import { Search, Code2, FileText, Globe, Database, Sparkles } from 'lucide-react';

interface ThinkingIndicatorProps {
  status?: 'analyzing' | 'generating' | 'searching' | 'coding' | 'processing';
  toolUsed?: string;
  subText?: string;
  className?: string;
}

const statusConfig = {
  analyzing: {
    text: 'Analyzing...',
    icon: Sparkles,
    color: 'text-primary',
  },
  generating: {
    text: 'Generating...',
    icon: FileText,
    color: 'text-accent',
  },
  searching: {
    text: 'Searching...',
    icon: Search,
    color: 'text-success',
  },
  coding: {
    text: 'Writing code...',
    icon: Code2,
    color: 'text-warning',
  },
  processing: {
    text: 'Processing...',
    icon: Database,
    color: 'text-primary',
  },
};

const toolIcons: Record<string, typeof Search> = {
  search: Search,
  code: Code2,
  web: Globe,
  file: FileText,
  database: Database,
};

export function ThinkingIndicator({
  status = 'analyzing',
  toolUsed,
  subText,
  className = '',
}: ThinkingIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const ToolIcon = toolUsed ? (toolIcons[toolUsed] || Sparkles) : null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-relaxed bg-surface/60 border border-border/40 ${className}`}>
      {/* Pulsing Dots */}
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Status Text */}
      <div className="flex-1">
        <div className={`flex items-center gap-2 ${config.color}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">{config.text}</span>
        </div>
        {(subText || toolUsed) && (
          <div className="flex items-center gap-2 mt-0.5 text-caption text-muted-foreground">
            {toolUsed && ToolIcon && (
              <span className="flex items-center gap-1">
                <ToolIcon className="w-3 h-3" />
                Using {toolUsed}
              </span>
            )}
            {subText && <span>{subText}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal inline version for use within messages
export function ThinkingDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} role="status" aria-label="AI is thinking">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
    </span>
  );
}
