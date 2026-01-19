'use client';

import { Agent, AgentRole } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Play, Copy, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  onTest?: (agent: Agent) => void;
  onDuplicate?: (agent: Agent) => void;
}

const roleColors: Record<AgentRole, string> = {
  planner: 'bg-blue-500/10 text-blue-300/90 border-blue-500/20',
  researcher: 'bg-purple-500/10 text-purple-300/90 border-purple-500/20',
  writer: 'bg-pink-500/10 text-pink-300/90 border-pink-500/20',
  editor: 'bg-orange-500/10 text-orange-300/90 border-orange-500/20',
  critic: 'bg-red-500/10 text-red-300/90 border-red-500/20',
  coder: 'bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20',
  qa: 'bg-amber-500/10 text-amber-300/90 border-amber-500/20',
  summarizer: 'bg-cyan-500/10 text-cyan-300/90 border-cyan-500/20',
  custom: 'bg-slate-500/10 text-slate-300/90 border-slate-500/20',
  debugger: 'bg-red-500/10 text-red-300/90 border-red-500/20',
  analyst: 'bg-blue-500/10 text-blue-300/90 border-blue-500/20',
  devops: 'bg-orange-500/10 text-orange-300/90 border-orange-500/20',
  security: 'bg-red-500/10 text-red-300/90 border-red-500/20',
  designer: 'bg-pink-500/10 text-pink-300/90 border-pink-500/20',
  backend: 'bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20',
  product: 'bg-purple-500/10 text-purple-300/90 border-purple-500/20',
};

export const AgentCard = ({
  agent,
  onEdit,
  onDelete,
  onTest,
  onDuplicate,
}: AgentCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const capabilities = agent.capabilities || [];
  const icon = typeof agent.icon === 'string' && agent.icon ? agent.icon : '🤖';
  const isIconUrl = typeof icon === 'string' && /^https?:\/\//i.test(icon);
  const bio = (agent as any).bio || agent.systemPrompt;

  return (
    <Card className="group relative overflow-hidden border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-secondary/20 backdrop-blur-sm">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          {/* Profile Photo/Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-border/60 group-hover:border-primary/40 transition-all duration-300 shadow-sm group-hover:shadow-md overflow-hidden">
              {isIconUrl ? (
                <img
                  src={icon}
                  alt={`${agent.name} avatar`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.textContent = '🤖';
                  }}
                />
              ) : (
                <span className="text-2xl leading-none">{icon}</span>
              )}
            </div>
            {/* Online status indicator */}
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500/90 border-2 border-background shadow-sm" />
          </div>

          {/* Name, Role, and Menu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold tracking-tight leading-snug mb-1.5">
                  {agent.name}
                </h3>
                <Badge
                  size="sm"
                  className={`${roleColors[agent.role]} text-[11px] font-medium border`}
                >
                  {agent.role}
                </Badge>
              </div>

              {/* Menu button */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  onClick={() => setShowMenu(!showMenu)}
                  aria-haspopup="menu"
                  aria-expanded={showMenu}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                <div
                  className={`absolute right-0 top-10 bg-secondary border border-border rounded-lg shadow-xl z-20 min-w-[140px] transition-all duration-200 ${showMenu ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'}`}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start rounded-t-lg rounded-b-none text-xs h-9 hover:bg-accent"
                    onClick={() => {
                      onEdit?.(agent);
                      setShowMenu(false);
                    }}
                  >
                    <Edit className="w-3.5 h-3.5 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start rounded-none text-xs h-9 hover:bg-accent"
                    onClick={() => {
                      onDuplicate?.(agent);
                      setShowMenu(false);
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Clone Agent
                  </Button>
                  <div className="h-px bg-border/50 my-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start rounded-b-lg rounded-t-none text-xs h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      onDelete?.(agent);
                      setShowMenu(false);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Me / Bio */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">About</h4>
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
            {bio}
          </p>
        </div>
        {/* About Me / Bio */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">About</h4>
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
            {bio}
          </p>
        </div>

        {/* Stats/Info Row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground/60">{agent.provider}</span>
            <span>/</span>
            <span className="font-mono">{agent.model}</span>
          </div>
          {capabilities.length > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{capabilities.length} {capabilities.length === 1 ? 'capability' : 'capabilities'}</span>
            </>
          )}
        </div>

        {/* Capabilities Tags */}
        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {capabilities.slice(0, 5).map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/60 border border-border/50 text-muted-foreground/80 hover:bg-muted/80 transition-colors"
              >
                {cap}
              </span>
            ))}
            {capabilities.length > 5 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground/60">
                +{capabilities.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Action Button */}
        <Button
          size="sm"
          onClick={() => onTest?.(agent)}
          className="w-full h-9 text-sm font-semibold bg-primary/90 hover:bg-primary transition-all duration-200 shadow-sm hover:shadow-md"
          title="Chat with this agent"
        >
          <Play className="w-3.5 h-3.5 mr-2" />
          Start Conversation
        </Button>
      </div>
    </Card>
  );
};
