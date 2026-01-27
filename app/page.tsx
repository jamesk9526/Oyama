'use client';

import { MessageSquare, Sparkles, Zap, Users, GitBranch, Server, Cpu, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <div className="text-center max-w-3xl w-full">
        {/* Hero Section */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="p-5 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 zen-breathe">
              <Sparkles className="w-10 h-10 sm:w-14 sm:h-14 text-primary" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-h1 font-bold mb-4 tracking-tight">
          Welcome to <span className="text-primary">Oyama</span>
        </h1>
        
        <p className="text-emphasis text-muted-foreground mb-8 px-4 max-w-xl mx-auto leading-relaxed">
          A next-generation AI automation studio with multi-agent orchestration, 
          autonomous task execution, and sophisticated workflow automation—all running locally 
          for privacy and performance.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 mb-12">
          <Button 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={() => router.push('/playground')}
          >
            <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" />
            Open Agent Playground
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            className="w-full sm:w-auto"
            onClick={() => router.push('/chats')}
          >
            Start New Chat
          </Button>
        </div>

        {/* Feature Cards - New Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-left mb-12">
          <div className="p-5 rounded-relaxed bg-surface border border-border/60 hover-lift transition-all group">
            <div className="w-10 h-10 rounded-standard bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <Users className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="font-semibold mb-2">Multi-Agent Crews</h3>
            <p className="text-body text-muted-foreground">
              Orchestrate specialized AI agents working together on complex tasks with automatic coordination.
            </p>
          </div>
          <div className="p-5 rounded-relaxed bg-surface border border-border/60 hover-lift transition-all group">
            <div className="w-10 h-10 rounded-standard bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
              <GitBranch className="w-5 h-5 text-accent" aria-hidden="true" />
            </div>
            <h3 className="font-semibold mb-2">Staged Workflows</h3>
            <p className="text-body text-muted-foreground">
              Build automation pipelines with approval gates, conditional execution, and visual monitoring.
            </p>
          </div>
          <div className="p-5 rounded-relaxed bg-surface border border-border/60 hover-lift transition-all group">
            <div className="w-10 h-10 rounded-standard bg-success/10 flex items-center justify-center mb-3 group-hover:bg-success/20 transition-colors">
              <Server className="w-5 h-5 text-success" aria-hidden="true" />
            </div>
            <h3 className="font-semibold mb-2">MCP Tools Server</h3>
            <p className="text-body text-muted-foreground">
              Local, embedded tool orchestration with file system access, code execution, and API connectors.
            </p>
          </div>
          <div className="p-5 rounded-relaxed bg-surface border border-border/60 hover-lift transition-all group">
            <div className="w-10 h-10 rounded-standard bg-warning/10 flex items-center justify-center mb-3 group-hover:bg-warning/20 transition-colors">
              <Cpu className="w-5 h-5 text-warning" aria-hidden="true" />
            </div>
            <h3 className="font-semibold mb-2">Ollama Integration</h3>
            <p className="text-body text-muted-foreground">
              Connect to local or LAN Ollama instances with model hot-swapping and streaming responses.
            </p>
          </div>
          <div className="p-5 rounded-relaxed bg-surface border border-border/60 hover-lift transition-all group">
            <div className="w-10 h-10 rounded-standard bg-error/10 flex items-center justify-center mb-3 group-hover:bg-error/20 transition-colors">
              <Shield className="w-5 h-5 text-error" aria-hidden="true" />
            </div>
            <h3 className="font-semibold mb-2">Local-First Privacy</h3>
            <p className="text-body text-muted-foreground">
              All data stored locally with SQLite. Full export/import capabilities and no cloud dependencies.
            </p>
          </div>
          <div className="p-5 rounded-relaxed bg-surface border border-border/60 hover-lift transition-all group">
            <div className="w-10 h-10 rounded-standard bg-secondary/30 flex items-center justify-center mb-3 group-hover:bg-secondary/50 transition-colors">
              <Globe className="w-5 h-5 text-secondary" aria-hidden="true" />
            </div>
            <h3 className="font-semibold mb-2">Memory System</h3>
            <p className="text-body text-muted-foreground">
              Persistent, searchable memory across all agents and sessions with semantic retrieval.
            </p>
          </div>
        </div>

        {/* Setup Wizard Reminder */}
        <div className="p-5 rounded-relaxed bg-primary/5 border border-primary/20 max-w-lg mx-auto">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-standard bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm mb-1">Get Started</h3>
              <p className="text-caption text-muted-foreground mb-3">
                Run the setup wizard to configure your AI models and personalize your experience.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push('/settings')}
                className="text-caption"
              >
                Open Setup Wizard →
              </Button>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="mt-8 text-body text-muted-foreground">
          <p className="hidden sm:flex items-center justify-center gap-2">
            Press 
            <kbd className="px-2 py-1 bg-muted rounded-standard text-caption font-mono">Ctrl+K</kbd> 
            to open command palette
          </p>
        </div>
      </div>
    </div>
  );
}
