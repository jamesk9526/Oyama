'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Settings as SettingsIcon, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAgentsStore } from '@/lib/stores/agents';
import { useSettingsStore } from '@/lib/stores/settings';

interface FloatingToolbarProps {
  selectedAgent: string;
  onAgentChange: (agentId: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  isActive?: boolean;
}

export function FloatingToolbar({ 
  selectedAgent, 
  onAgentChange, 
  selectedModel, 
  onModelChange,
  isActive = false 
}: FloatingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [activeProgress, setActiveProgress] = useState(0);
  const { agents } = useAgentsStore();
  const settings = useSettingsStore();
  const fabRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

  // Handle proximity detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!fabRef.current) return;
      
      const rect = fabRef.current.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
        Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
      );
      
      setIsNearby(distance < 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle active state progress
  useEffect(() => {
    if (!isActive) {
      setActiveProgress(0);
      return;
    }

    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Progress animation
    const interval = setInterval(() => {
      setActiveProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 100);

    // Reset after 5 seconds of inactivity
    inactivityTimerRef.current = setTimeout(() => {
      setActiveProgress(0);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive]);

  const getButtonSize = () => {
    const baseSize = 28; // w-7 h-7 = 28px
    if (activeProgress > 0) {
      const shrinkPercent = activeProgress / 100;
      return baseSize * (1 - shrinkPercent * 0.6); // Shrink to 40% at full progress
    }
    return baseSize;
  };

  const buttonSizePx = getButtonSize();

  return (
    <div 
      ref={fabRef}
      className={`zen-fab transition-all duration-300 ${isNearby ? 'zen-fab-nearby' : ''}`}
    >
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="zen-fab-menu mb-3 bg-background/95 backdrop-blur-lg border border-border rounded-full p-5 shadow-2xl min-w-[320px]">
          <div className="space-y-5">
            {/* Agent Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="w-4 h-4 text-primary" />
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent</label>
              </div>
              <Select 
                value={selectedAgent} 
                onChange={(e) => onAgentChange(e.target.value)}
                className="w-full text-sm"
              >
                <option value="">System Prompt</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.icon} {agent.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Model Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Model</label>
              </div>
              <div className="text-sm px-3 py-2.5 bg-muted/30 rounded-lg border border-border">
                {selectedModel || 'Not configured'}
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <SettingsIcon className="w-3 h-3" />
                Change in Settings
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button - 50% smaller with dynamic shrinking */}
      <div className="relative inline-block">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`rounded-full shadow-2xl zen-breathe zen-glow relative transition-all duration-300 flex items-center justify-center`}
          style={{
            width: `${buttonSizePx}px`,
            height: `${buttonSizePx}px`,
          }}
          title={isExpanded ? "Close toolbar" : "Open toolbar"}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3" />
          )}
        </Button>
        {activeProgress > 0 && (
          <div 
            className="absolute inset-0 rounded-full border-2 border-primary/50 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: activeProgress / 100,
            }}
          />
        )}
      </div>
    </div>
  );
}
