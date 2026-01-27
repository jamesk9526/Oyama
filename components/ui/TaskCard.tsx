'use client';

import { useState } from 'react';
import { 
  MoreVertical, 
  Target, 
  Clock, 
  RefreshCw,
  GripVertical,
  Play,
  Pause,
  X
} from 'lucide-react';

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress?: number;
  elapsedTime?: string;
  stepsCompleted?: number;
  totalSteps?: number;
  agents?: Array<{ name: string; avatar?: string }>;
  tools?: string[];
  onPlay?: () => void;
  onPause?: () => void;
  onCancel?: () => void;
  onMenuClick?: () => void;
  draggable?: boolean;
}

export function TaskCard({
  id,
  title,
  description,
  status,
  progress = 0,
  elapsedTime,
  stepsCompleted = 0,
  totalSteps = 1,
  agents = [],
  tools = [],
  onPlay,
  onPause,
  onCancel,
  onMenuClick,
  draggable = false,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusBorderClass = {
    pending: 'border-t-muted-foreground',
    running: 'border-t-primary',
    completed: 'border-t-success',
    failed: 'border-t-error',
    paused: 'border-t-warning',
  }[status];

  const statusTextClass = {
    pending: 'text-muted-foreground',
    running: 'text-primary',
    completed: 'text-success',
    failed: 'text-error',
    paused: 'text-warning',
  }[status];

  return (
    <div 
      className={`task-card bg-surface border border-border/60 rounded-relaxed overflow-hidden hover-lift ${statusBorderClass} border-t-[3px]`}
      role="article"
      aria-label={`Task: ${title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {draggable && (
            <button 
              className="mt-0.5 cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted/40 rounded"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <Target className={`w-4 h-4 mt-0.5 flex-shrink-0 ${statusTextClass}`} />
          <h3 className="font-semibold text-sm truncate flex-1">{title}</h3>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-muted/40 rounded transition-colors focus-ring"
            aria-label="Task menu"
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-standard shadow-lg z-10 py-1 min-w-32">
              <button 
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted/40 transition-colors"
                onClick={() => { onMenuClick?.(); setShowMenu(false); }}
              >
                View Details
              </button>
              <button 
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted/40 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                Duplicate
              </button>
              <hr className="my-1 border-border" />
              <button 
                className="w-full px-3 py-1.5 text-sm text-left text-error hover:bg-error/10 transition-colors"
                onClick={() => { onCancel?.(); setShowMenu(false); }}
              >
                Cancel Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="px-4 text-caption text-muted-foreground line-clamp-2 mb-3">
        {description}
      </p>

      {/* Agents and Tools */}
      {(agents.length > 0 || tools.length > 0) && (
        <div className="px-4 flex flex-wrap gap-1.5 mb-3">
          {agents.map((agent, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-caption rounded"
            >
              {agent.avatar ? (
                <img src={agent.avatar} alt="" className="w-3 h-3 rounded-full" />
              ) : (
                <span className="w-3 h-3 rounded-full bg-primary/30" />
              )}
              {agent.name}
            </span>
          ))}
          {tools.map((tool, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center px-2 py-1 bg-muted/40 text-muted-foreground text-caption rounded"
            >
              {tool}
            </span>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {status !== 'pending' && (
        <div className="px-4 mb-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                status === 'completed' ? 'bg-success' :
                status === 'failed' ? 'bg-error' :
                status === 'paused' ? 'bg-warning' :
                'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/10 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3 text-caption text-muted-foreground">
          {elapsedTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsedTime}
            </span>
          )}
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {stepsCompleted}/{totalSteps} steps
          </span>
        </div>
        
        {/* Control Buttons */}
        {(status === 'running' || status === 'paused') && (
          <div className="flex items-center gap-1">
            {status === 'running' ? (
              <button
                onClick={onPause}
                className="p-1.5 hover:bg-muted/40 rounded transition-colors focus-ring"
                aria-label="Pause task"
              >
                <Pause className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="p-1.5 hover:bg-muted/40 rounded transition-colors focus-ring"
                aria-label="Resume task"
              >
                <Play className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-error/10 rounded transition-colors focus-ring"
              aria-label="Cancel task"
            >
              <X className="w-3.5 h-3.5 text-error" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
