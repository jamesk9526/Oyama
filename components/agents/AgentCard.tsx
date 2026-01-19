'use client';

import { Agent, AgentRole } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
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
  planner: 'bg-blue-500/8 text-blue-400 border-blue-500/20',
  researcher: 'bg-purple-500/8 text-purple-400 border-purple-500/20',
  writer: 'bg-pink-500/8 text-pink-400 border-pink-500/20',
  editor: 'bg-orange-500/8 text-orange-400 border-orange-500/20',
  critic: 'bg-red-500/8 text-red-400 border-red-500/20',
  coder: 'bg-green-500/8 text-green-400 border-green-500/20',
  qa: 'bg-yellow-500/8 text-yellow-400 border-yellow-500/20',
  summarizer: 'bg-cyan-500/8 text-cyan-400 border-cyan-500/20',
  custom: 'bg-gray-500/8 text-gray-400 border-gray-500/20',
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
  const displayedCaps = capabilities.slice(0, 3);
  const extraCaps = capabilities.length - displayedCaps.length;
  const icon = typeof agent.icon === 'string' ? agent.icon : '🤖';
  const isIconUrl = typeof icon === 'string' && /^https?:\/\//i.test(icon);

  return (
    <Card className="group relative overflow-hidden border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="pb-3 space-y-2">
        {/* Header with icon and menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon Container */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-gradient-to-br from-muted/60 to-muted/40 border border-border/40 group-hover:border-primary/20 transition-all duration-300">
              {isIconUrl ? (
                <img
                  src={icon}
                  alt={`${agent.name} icon`}
                  className="h-7 w-7 object-cover rounded"
                />
              ) : (
                icon
              )}
            </div>
            
            {/* Name and Role */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold tracking-tight leading-snug mb-1">
                {agent.name}
              </CardTitle>
              <Badge
                size="sm"
                className={`${roleColors[agent.role]} text-[11px] font-medium border`}
              >
                {agent.role}
              </Badge>
            </div>
          </div>

          {/* Menu button */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-secondary border border-border rounded-lg shadow-lg z-10 min-w-[140px]">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start rounded-none text-xs h-8"
                  onClick={() => {
                    onEdit?.(agent);
                    setShowMenu(false);
                  }}
                >
                  <Edit className="w-3 h-3 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start rounded-none text-xs h-8"
                  onClick={() => {
                    onDuplicate?.(agent);
                    setShowMenu(false);
                  }}
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start rounded-none text-xs h-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    onDelete?.(agent);
                    setShowMenu(false);
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0 pb-3">
        {/* Purpose & Config compact row */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">Purpose</p>
          <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
            {agent.systemPrompt}
          </p>
        </div>

        <div className="h-px bg-border/30" />

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">Config</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              size="sm"
              variant="secondary"
              className="text-[11px] font-mono bg-muted/50 border-border/40 px-2"
            >
              {agent.provider}
            </Badge>
            <Badge
              size="sm"
              variant="secondary"
              className="text-[11px] font-mono bg-muted/50 border-border/40 px-2"
            >
              {agent.model}
            </Badge>
          </div>
        </div>

        {capabilities.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">Capabilities</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedCaps.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center px-2 py-[5px] rounded text-[11px] font-mono bg-muted/40 border border-border/50 text-muted-foreground/80"
                >
                  {cap}
                </span>
              ))}
              {extraCaps > 0 && (
                <span className="inline-flex items-center px-2 py-[5px] rounded text-[11px] font-mono bg-muted/30 border border-border/40 text-muted-foreground/70">
                  +{extraCaps} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="pt-1">
          <Button
            size="sm"
            onClick={() => onTest?.(agent)}
            className="w-full h-8 text-xs font-semibold"
            title="Test agent in chat"
          >
            <Play className="w-3 h-3 mr-2" />
            Test Agent
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
