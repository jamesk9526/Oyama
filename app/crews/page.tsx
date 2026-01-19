'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Play, Edit, Trash2, Grid3X3 } from 'lucide-react';
import { useCrewsStore, type Crew } from '@/lib/stores/crews';
import { useSettingsStore } from '@/lib/stores/settings';
import { CrewExecutionModal } from '@/components/crews/CrewExecutionModal';

export default function CrewsPage() {
  const { crews, loading, fetchCrews, createCrew, updateCrew, deleteCrew } = useCrewsStore();
  const settings = useSettingsStore();
  const [creatingNew, setCreatingNew] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [executingCrew, setExecutingCrew] = useState<Crew | null>(null);

  useEffect(() => {
    fetchCrews();
  }, [fetchCrews]);

  const handleCreateCrew = () => {
    setCreatingNew(true);
    setSelectedCrew(null);
  };

  const handleEditCrew = (crew: Crew) => {
    setSelectedCrew(crew);
    setCreatingNew(true);
  };

  const handleDeleteCrew = async (crew: Crew) => {
    if (confirm('Are you sure you want to delete this crew?')) {
      await deleteCrew(crew.id);
    }
  };

  const handleRunCrew = (crew: Crew) => {
    setExecutingCrew(crew);
  };

  const handleCloseExecution = () => {
    setExecutingCrew(null);
  };

  const getWorkflowLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">Agent Crews</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage multi-agent workflows
            </p>
          </div>
          <Button onClick={handleCreateCrew}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Crew</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading crews...</p>
          </div>
        ) : crews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Grid3X3 className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No crews yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create a crew to orchestrate multiple AI agents working together on
              complex tasks.
            </p>
            <Button onClick={handleCreateCrew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Crew
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crews.map((crew) => (
              <Card key={crew.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{crew.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {crew.agents.length} agent{crew.agents.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(crew.status)}>
                      {crew.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{crew.description}</p>

                  {/* Workflow Type */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Workflow Type</p>
                    <Badge variant="default" className="text-xs">
                      {getWorkflowLabel(crew.workflowType)}
                    </Badge>
                  </div>

                  {/* Last Run */}
                  {crew.lastRun && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Last run: {new Date(crew.lastRun).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleRunCrew(crew)}
                      className="flex-1"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Run</span>
                      <span className="sm:hidden">Run</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditCrew(crew)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeleteCrew(crew)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Execution Modal */}
      {executingCrew && (
        <CrewExecutionModal
          crew={executingCrew}
          isOpen={true}
          onClose={handleCloseExecution}
          ollamaUrl={settings.ollamaUrl}
          model={settings.ollamaModel}
          temperature={settings.temperature}
          topP={settings.topP}
          maxTokens={settings.maxTokens}
        />
      )}
    </div>
  );
}
