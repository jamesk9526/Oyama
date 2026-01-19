'use client';

import { Agent, AgentRole } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Play, Copy } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  onTest?: (agent: Agent) => void;
  onDuplicate?: (agent: Agent) => void;
}

const roleColors: Record<AgentRole, string> = {
  planner: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  researcher: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  writer: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  editor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critic: 'bg-red-500/10 text-red-500 border-red-500/20',
  coder: 'bg-green-500/10 text-green-500 border-green-500/20',
  qa: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  summarizer: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  custom: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export const AgentCard = ({
  agent,
  onEdit,
  onDelete,
  onTest,
  onDuplicate,
}: AgentCardProps) => {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: agent.colorTag + '20' }}
            >
              {agent.icon}
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <Badge
                size="sm"
                className={roleColors[agent.role]}
              >
                {agent.role}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* System Prompt Preview */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">System Prompt:</p>
          <p className="text-sm line-clamp-2">{agent.systemPrompt}</p>
        </div>

        {/* Model & Provider */}
        <div className="flex gap-2 mb-3">
          <Badge size="sm" variant="default">
            {agent.provider}
          </Badge>
          <Badge size="sm" variant="default">
            {agent.model}
          </Badge>
        </div>

        {/* Capabilities */}
        {agent.capabilities.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Capabilities:</p>
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.map((cap) => (
                <code
                  key={cap}
                  className="text-xs bg-muted px-1.5 py-0.5 rounded"
                >
                  {cap}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTest?.(agent)}
            className="flex-1"
          >
            <Play className="w-3 h-3 mr-1" />
            Test
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit?.(agent)}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDuplicate?.(agent)}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete?.(agent)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
