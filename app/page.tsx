'use client';

import { MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <div className="text-center max-w-2xl w-full">
        <div className="mb-6 flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Welcome to Oyama
        </h1>
        
        <p className="text-base sm:text-lg text-muted-foreground mb-8 px-4">
          Your AI Agent Collaboration Platform. Build, customize, and orchestrate 
          AI agents with multi-agent workflows, advanced prompt engineering, and a 
          modern interface.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Button 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={() => router.push('/chats')}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Start New Chat
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            className="w-full sm:w-auto"
            onClick={() => router.push('/templates')}
          >
            Explore Templates
          </Button>
        </div>

        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <h3 className="font-semibold mb-2">Multi-Agent Crews</h3>
            <p className="text-sm text-muted-foreground">
              Orchestrate multiple AI agents to collaborate on complex tasks
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <h3 className="font-semibold mb-2">Template Library</h3>
            <p className="text-sm text-muted-foreground">
              Reusable prompt templates with variables and live preview
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <h3 className="font-semibold mb-2">Local-First</h3>
            <p className="text-sm text-muted-foreground">
              SQLite database with full export/import capabilities
            </p>
          </div>
        </div>

        {/* Setup Wizard Reminder */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-lg bg-primary/5 border border-primary/20 max-w-md mx-auto">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h3 className="font-semibold text-sm mb-1">Personalize Your Experience</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Run the setup wizard to add your personal information and preferences for a more tailored AI experience.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push('/settings')}
                className="text-xs h-7"
              >
                Open Setup Wizard
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p className="hidden sm:block">Press <kbd className="px-2 py-1 bg-muted rounded">Ctrl+K</kbd> to open command palette</p>
        </div>
      </div>
    </div>
  );
}
