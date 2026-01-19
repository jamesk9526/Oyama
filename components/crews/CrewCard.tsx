'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Play, Copy, MoreVertical, Users, ArrowRight, GitBranch } from 'lucide-react';
import { useState } from 'react';

export interface CrewCardProps {
  crew: {
    id: string;
    name: string;
    description: string;
    workflowType: 'sequential' | 'parallel' | 'conditional';
    agents: string[];
    status: 'idle' | 'running' | 'completed' | 'failed';
    lastRun?: string;
    createdAt: string;
    updatedAt: string;
  };
  agents?: Array<{
    id: string;
    name: string;
    role: string;
    icon?: string;
  }>;
  onEdit?: (crew: CrewCardProps['crew']) => void;
  onDelete?: (crew: CrewCardProps['crew']) => void;
  onRun?: (crew: CrewCardProps['crew']) => void;
  onClone?: (crew: CrewCardProps['crew']) => void;
}

const workflowIcons = {
  sequential: ArrowRight,
  parallel: GitBranch,
  conditional: GitBranch,
};

const workflowColors = {
  sequential: 'bg-blue-500/10 text-blue-300/90 border-blue-500/20',
  parallel: 'bg-purple-500/10 text-purple-300/90 border-purple-500/20',
  conditional: 'bg-amber-500/10 text-amber-300/90 border-amber-500/20',
};

export const CrewCard = ({
  crew,
  agents = [],
  onEdit,
  onDelete,
  onRun,
  onClone,
}: CrewCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const WorkflowIcon = workflowIcons[crew.workflowType];
  const crewAgents = agents.filter((a) => crew.agents.includes(a.id));
  const displayedAgents = crewAgents.slice(0, 3);
  const extraAgents = crewAgents.length - displayedAgents.length;

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
              <Users className="w-5 h-5 text-muted-foreground/70" />
            </div>
            
            {/* Name and Agent Count */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold tracking-tight leading-snug mb-1">
                {crew.name}
              </CardTitle>
              <Badge
                size="sm"
                className="bg-muted/50 text-muted-foreground/80 border-border/40 text-[11px] font-medium border"
              >
                {crew.agents.length} agent{crew.agents.length !== 1 ? 's' : ''}
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
              aria-haspopup="menu"
              aria-expanded={showMenu}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            <div
              className={`absolute right-0 top-8 bg-secondary border border-border rounded-lg shadow-lg z-10 min-w-[140px] transition-all duration-200 ${showMenu ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'}`}
            >
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start rounded-none text-xs h-8"
                onClick={() => {
                  onEdit?.(crew);
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
                  onClone?.(crew);
                  setShowMenu(false);
                }}
              >
                <Copy className="w-3 h-3 mr-2" />
                Clone
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start rounded-none text-xs h-8 text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete?.(crew);
                  setShowMenu(false);
                }}
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0 pb-3">
        {/* Description */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">Purpose</p>
          <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
            {crew.description || 'No description provided'}
          </p>
        </div>

        <div className="h-px bg-border/30" />

        {/* Workflow Type */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">Workflow</p>
          <Badge
            size="sm"
            className={`${workflowColors[crew.workflowType]} text-[11px] font-medium border capitalize`}
          >
            <WorkflowIcon className="w-3 h-3 mr-1.5" />
            {crew.workflowType}
          </Badge>
        </div>

        {/* Agent Composition */}
        {displayedAgents.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">Agents</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedAgents.map((agent) => {
                const icon = typeof agent.icon === 'string' && agent.icon ? agent.icon : '🤖';
                const isIconUrl = /^https?:\/\//i.test(icon);
                return (
                  <div
                    key={agent.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/40 border border-border/50"
                    title={`${agent.name} (${agent.role})`}
                  >
                    {isIconUrl ? (
                      <img src={icon} alt="" className="h-3.5 w-3.5 object-cover rounded" />
                    ) : (
                      <span className="text-xs leading-none">{icon}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground/80 max-w-[80px] truncate">
                      {agent.name}
                    </span>
                  </div>
                );
              })}
              {extraAgents > 0 && (
                <div className="inline-flex items-center px-2 py-1 rounded bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground/70">
                    +{extraAgents} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Run */}
        {crew.lastRun && (
          <div className="pt-1">
            <p className="text-[11px] text-muted-foreground/60">
              Last run: {new Date(crew.lastRun).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="pt-1">
          <Button
            size="sm"
            onClick={() => onRun?.(crew)}
            className="w-full h-8 text-xs font-semibold"
            title="Run crew workflow"
          >
            <Play className="w-3 h-3 mr-2" />
            Run Crew
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
