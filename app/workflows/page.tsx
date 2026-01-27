'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Play, Pause, GitBranch, Clock, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'planning' | 'executing' | 'paused' | 'completed' | 'failed';
  stages: WorkflowStage[];
  workflowType: 'sequential' | 'parallel' | 'conditional';
  createdAt: string;
  updatedAt: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  agentId: string;
  status: 'pending' | 'executing' | 'approval_required' | 'completed' | 'failed';
  requiresApproval: boolean;
  artifacts?: string[];
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/workflows');
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }

      // Remove from local state
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete workflow');
    }
  };

  const getStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'executing': return 'warning';
      case 'failed': return 'destructive';
      case 'paused': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'executing': return <Clock className="w-4 h-4 animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
            <p className="text-muted-foreground mt-1">
              Staged automation with human approval gates
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        </div>

        {/* Info Panel */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <GitBranch className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">About Workflows</p>
                <p className="text-muted-foreground mt-1">
                  Workflows are long-running, multi-stage automations with defined goals, ordered stages, 
                  tool usage, memory access, human approvals, and artifacts. Each stage can pause and require 
                  user approval before proceeding.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 text-destructive">
                <XCircle className="w-5 h-5" />
                <div className="text-sm">
                  <p className="font-medium">Error loading workflows</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflows List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No workflows yet</p>
              <p className="text-muted-foreground text-sm mb-6">
                Create your first workflow to automate complex multi-stage tasks
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        {getStatusIcon(workflow.status)}
                      </div>
                      <CardDescription className="mt-1">
                        {workflow.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(workflow.status)}>
                      {workflow.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{workflow.workflowType}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stages</span>
                      <span className="font-medium">{workflow.stages.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {workflow.stages.filter(s => s.status === 'completed').length} / {workflow.stages.length}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button size="sm" variant="secondary" className="flex-1" disabled>
                        <Play className="w-3 h-3 mr-1" />
                        Execute
                      </Button>
                      <Button size="sm" variant="ghost" disabled>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(workflow.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
