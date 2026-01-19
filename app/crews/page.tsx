'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Play, Edit, Trash2, Grid3X3, Copy } from 'lucide-react';
import { useCrewsStore, type Crew } from '@/lib/stores/crews';
import { useSettingsStore } from '@/lib/stores/settings';
import { CrewExecutionModal } from '@/components/crews/CrewExecutionModal';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { useAgentsStore } from '@/lib/stores/agents';

export default function CrewsPage() {
  const { crews, loading, fetchCrews, createCrew, updateCrew, deleteCrew } = useCrewsStore();
  const settings = useSettingsStore();
  const { agents, fetchAgents } = useAgentsStore();
  const [creatingNew, setCreatingNew] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [executingCrew, setExecutingCrew] = useState<Crew | null>(null);
  const [crewName, setCrewName] = useState('');
  const [crewDescription, setCrewDescription] = useState('');
  const [crewWorkflowType, setCrewWorkflowType] = useState<Crew['workflowType']>('sequential');
  const [crewAgents, setCrewAgents] = useState<string[]>([]);
  const [crewAttachments, setCrewAttachments] = useState<Array<{ id: string; name: string }>>([]);
  const crewFileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({ totalCrews: 0, totalRuns: 0, avgSuccessRate: 0 });

  useEffect(() => {
    fetchCrews();
    fetch('/api/crews/metrics')
      .then((res) => res.json())
      .then((data) => setStats(data.summary))
      .catch(() => {});
  }, [fetchCrews]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (selectedCrew) {
      setCrewName(selectedCrew.name);
      setCrewDescription(selectedCrew.description);
      setCrewWorkflowType(selectedCrew.workflowType);
      setCrewAgents(selectedCrew.agents);
      setCrewAttachments([]);
    } else {
      setCrewName('');
      setCrewDescription('');
      setCrewWorkflowType('sequential');
      setCrewAgents([]);
      setCrewAttachments([]);
    }
  }, [selectedCrew, creatingNew]);

  useEffect(() => {
    const loadCrewAttachments = async () => {
      if (!selectedCrew?.id) return;
      try {
        const response = await fetch(`/api/attachments?scopeType=crew&scopeId=${selectedCrew.id}`);
        if (response.ok) {
          const data = await response.json();
          setCrewAttachments(data.map((item: any) => ({ id: item.id, name: item.name })));
        }
      } catch {
        // ignore
      }
    };

    loadCrewAttachments();
  }, [selectedCrew]);

  const handleCreateCrew = () => {
    setCreatingNew(true);
    setSelectedCrew(null);
  };

  const handleEditCrew = (crew: Crew) => {
    setSelectedCrew(crew);
    setCreatingNew(true);
  };

  const toggleAgent = (agentId: string) => {
    setCrewAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSaveCrew = async () => {
    const payload = {
      name: crewName.trim() || 'New Crew',
      description: crewDescription.trim(),
      workflowType: crewWorkflowType,
      agents: crewAgents,
    };

    if (selectedCrew) {
      await updateCrew(selectedCrew.id, payload);
    } else {
      await createCrew(payload);
    }

    setCreatingNew(false);
    setSelectedCrew(null);
  };

  const handleCrewAttach = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCrew?.id || !event.target.files?.length) return;
    const file = event.target.files[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('scopeType', 'crew');
    formData.append('scopeId', selectedCrew.id);

    try {
      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const created = await response.json();
        setCrewAttachments((prev) => [...prev, { id: created.id, name: created.name }]);
      }
    } catch {
      // ignore
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveCrewAttachment = async (attachmentId: string) => {
    try {
      await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
      setCrewAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
    } catch {
      // ignore
    }
  };

  const handleDeleteCrew = async (crew: Crew) => {
    if (confirm('Are you sure you want to delete this crew?')) {
      await deleteCrew(crew.id);
    }
  };

  const handleCloneCrew = async (crew: Crew) => {
    try {
      const response = await fetch(`/api/crews/${crew.id}/clone`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchCrews();
      }
    } catch (error) {
      console.error('Failed to clone crew:', error);
    }
  };

  const handleExportCrews = () => {
    const exported = crews.map((crew) => ({
      name: crew.name,
      description: crew.description,
      agents: crew.agents,
      workflowType: crew.workflowType,
    }));
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oyama-crews-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Crews <span className="text-sm text-muted-foreground font-normal">({stats.totalCrews})</span></h1>
          <div className="flex items-center gap-2">
            <Link href="/crews/runs">
              <Button variant="secondary" size="sm">Runs</Button>
            </Link>
            <Button size="sm" onClick={handleCreateCrew}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
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
                      title="Run crew"
                      aria-label="Run crew"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Run</span>
                      <span className="sm:hidden">Run</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCloneCrew(crew)}
                      title="Clone crew"
                      aria-label="Clone crew"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditCrew(crew)}
                      title="Edit crew"
                      aria-label="Edit crew"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeleteCrew(crew)}
                      title="Delete crew"
                      aria-label="Delete crew"
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

      <Modal
        isOpen={creatingNew}
        onClose={() => {
          setCreatingNew(false);
          setSelectedCrew(null);
        }}
        title={selectedCrew ? 'Edit Crew' : 'Create Crew'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="crew-name">Crew Name</Label>
            <Input
              id="crew-name"
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              placeholder="e.g., Research Squad"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="crew-description">Description</Label>
            <Textarea
              id="crew-description"
              value={crewDescription}
              onChange={(e) => setCrewDescription(e.target.value)}
              placeholder="Describe what this crew does..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="crew-workflow">Workflow Type</Label>
            <Select
              id="crew-workflow"
              value={crewWorkflowType}
              onChange={(e) => setCrewWorkflowType(e.target.value as Crew['workflowType'])}
              className="mt-1"
            >
              <option value="sequential">Sequential</option>
              <option value="parallel">Parallel</option>
              <option value="conditional">Conditional</option>
            </Select>
          </div>
          <div>
            <Label>Agents</Label>
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                No agents available. Create an agent first.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {agents.map((agent) => {
                  const selected = crewAgents.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={`border rounded-lg p-3 text-left transition-colors ${
                        selected
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/60 hover:border-border'
                      }`}
                      title={`Toggle ${agent.name}`}
                    >
                      <div className="flex items-center gap-2">
                        {typeof agent.icon === 'string' && /^https?:\/\//i.test(agent.icon) ? (
                          <img
                            src={agent.icon}
                            alt={`${agent.name} icon`}
                            className="h-6 w-6 rounded object-cover"
                          />
                        ) : (
                          <span className="text-lg">{agent.icon || '🤖'}</span>
                        )}
                        <div>
                          <p className="text-sm font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <Label>Source Files</Label>
            {!selectedCrew?.id ? (
              <p className="text-sm text-muted-foreground mt-1">
                Save the crew to attach files.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <input
                  ref={crewFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleCrewAttach}
                  aria-label="Attach crew file"
                  title="Attach crew file"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => crewFileInputRef.current?.click()}
                >
                  Attach File
                </Button>
                {crewAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {crewAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs"
                      >
                        <span>{attachment.name}</span>
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => handleRemoveCrewAttachment(attachment.id)}
                          type="button"
                          title={`Remove ${attachment.name}`}
                          aria-label={`Remove ${attachment.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setCreatingNew(false);
              setSelectedCrew(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveCrew} disabled={!crewName.trim()}>
            {selectedCrew ? 'Save Changes' : 'Create Crew'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
