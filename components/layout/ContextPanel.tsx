'use client';

import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit3,
  Download,
  X,
  Lightbulb,
  Search,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TaskNode {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  estimatedTime?: string;
  children?: TaskNode[];
}

interface ThinkingStep {
  id: string;
  content: string;
  timestamp: Date;
  toolUsed?: string;
  collapsed?: boolean;
}

interface KnowledgeItem {
  id: string;
  type: 'memory' | 'document' | 'source';
  title: string;
  excerpt: string;
  source?: string;
}

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: TaskNode[];
  thinkingSteps?: ThinkingStep[];
  knowledgeItems?: KnowledgeItem[];
  onRetryWithDifferentModel?: () => void;
  onRefineInstructions?: () => void;
  onExportConversation?: () => void;
}

function TaskStatusIcon({ status }: { status: TaskNode['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-error" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />;
  }
}

function TaskTree({ task, depth = 0 }: { task: TaskNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = task.children && task.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-border/40 pl-3' : ''}>
      <div 
        className="flex items-center gap-2 py-1.5 group cursor-pointer hover:bg-muted/20 rounded px-2 -ml-2"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <button className="p-0.5 hover:bg-muted/40 rounded">
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        <TaskStatusIcon status={task.status} />
        <span className={`text-sm flex-1 ${task.status === 'completed' ? 'text-muted-foreground' : ''}`}>
          {task.title}
        </span>
        {task.estimatedTime && task.status !== 'completed' && (
          <span className="text-caption text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.estimatedTime}
          </span>
        )}
      </div>
      {task.progress !== undefined && task.status === 'running' && (
        <div className="ml-8 mb-2">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
      {hasChildren && expanded && task.children?.map((child) => (
        <TaskTree key={child.id} task={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function ContextPanel({
  isOpen,
  onClose,
  tasks = [],
  thinkingSteps = [],
  knowledgeItems = [],
  onRetryWithDifferentModel,
  onRefineInstructions,
  onExportConversation,
}: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'thinking' | 'knowledge'>('tasks');
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="w-[280px] border-l border-border/60 bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <h2 className="font-semibold text-sm">Context</h2>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-muted/40 rounded transition-colors focus-ring"
          aria-label="Close context panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border/60">
        {(['tasks', 'thinking', 'knowledge'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors focus-ring ${
              activeTab === tab 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active tasks</p>
              </div>
            ) : (
              tasks.map((task) => <TaskTree key={task.id} task={task} />)
            )}
          </div>
        )}

        {activeTab === 'thinking' && (
          <div className="space-y-2">
            {thinkingSteps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No reasoning steps yet</p>
              </div>
            ) : (
              thinkingSteps.map((step) => (
                <div 
                  key={step.id}
                  className="border border-border/40 rounded-standard overflow-hidden"
                >
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/20 transition-colors"
                  >
                    {expandedSteps.has(step.id) ? (
                      <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm truncate flex-1">{step.content.slice(0, 50)}...</span>
                    {step.toolUsed && (
                      <span className="text-caption bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {step.toolUsed}
                      </span>
                    )}
                  </button>
                  {expandedSteps.has(step.id) && (
                    <div className="px-3 pb-2 text-sm text-muted-foreground border-t border-border/40 pt-2">
                      {step.content}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-2">
            {knowledgeItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No knowledge context</p>
              </div>
            ) : (
              knowledgeItems.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 border border-border/40 rounded-standard hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-caption px-1.5 py-0.5 rounded ${
                      item.type === 'memory' ? 'bg-accent/10 text-accent' :
                      item.type === 'document' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                  </div>
                  <p className="text-caption text-muted-foreground line-clamp-2">{item.excerpt}</p>
                  {item.source && (
                    <a 
                      href={item.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-caption text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border/60 p-3 space-y-2">
        <h3 className="text-caption text-muted-foreground font-medium mb-2">Quick Actions</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-sm"
          onClick={onRetryWithDifferentModel}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry with different model
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-sm"
          onClick={onRefineInstructions}
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Refine instructions
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-sm"
          onClick={onExportConversation}
        >
          <Download className="w-4 h-4 mr-2" />
          Export conversation
        </Button>
      </div>
    </div>
  );
}
