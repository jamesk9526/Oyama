'use client';

import { useState, useEffect } from 'react';
import { Agent, AgentRole } from '@/types';
import { AgentCard } from '@/components/agents/AgentCard';
import { AgentBuilder } from '@/components/agents/AgentBuilder';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Users, Sparkles, Loader } from 'lucide-react';
import { useAgentsStore } from '@/lib/stores/agents';
import { useRouter } from 'next/navigation';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { useSettingsStore } from '@/lib/stores/settings';

export default function AgentsPage() {
  const router = useRouter();
  const settings = useSettingsStore();
  const { agents, loading, fetchAgents, createAgent, updateAgent, deleteAgent } = useAgentsStore();
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<AgentRole | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [draftAgent, setDraftAgent] = useState<Partial<Agent> | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRole, setAiRole] = useState<AgentRole | 'auto'>('auto');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [stats, setStats] = useState({ totalAgents: 0, roleDistribution: {} as Record<string, number> });

  useEffect(() => {
    fetchAgents();
    fetch('/api/agents/metrics')
      .then((res) => res.json())
      .then((data) => setStats(data.summary))
      .catch(() => {});
  }, [fetchAgents]);

  // Filter agents
  useEffect(() => {
    let filtered = agents;

    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedRole) {
      filtered = filtered.filter((a) => a.role === selectedRole);
    }

    setFilteredAgents(filtered);
  }, [agents, searchQuery, selectedRole]);

  const roles = Array.from(new Set(agents.map((a) => a.role)));

  const handleSaveAgent = async (agent: Partial<Agent>) => {
    if (editingAgent) {
      await updateAgent(editingAgent.id, agent);
    } else {
      await createAgent(agent);
    }
    setBuilderOpen(false);
    setEditingAgent(null);
    setDraftAgent(null);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setBuilderOpen(true);
  };

  const handleDelete = async (agent: Agent) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteAgent(agent.id);
    }
  };

  const handleTest = (agent: Agent) => {
    router.push(`/chats?newChat=1&agentId=${agent.id}`);
  };

  const parseAgentJson = (text: string) => {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  };

  const normalizeRole = (role: string | undefined): AgentRole => {
    const allowed: AgentRole[] = ['planner','researcher','writer','editor','critic','coder','qa','summarizer','custom'];
    if (!role) return 'custom';
    const normalized = role.toLowerCase();
    return (allowed as string[]).includes(normalized) ? (normalized as AgentRole) : 'custom';
  };

  const normalizeCapabilities = (caps: unknown): Agent['capabilities'] => {
    const allowed = new Set(['web','files','code','image']);
    if (!Array.isArray(caps)) return [];
    return caps.map((cap) => String(cap).toLowerCase()).filter((cap) => allowed.has(cap)) as Agent['capabilities'];
  };

  const handleGenerateAgent = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Describe the agent you want to build.');
      return;
    }

    setAiLoading(true);
    setAiError('');

    const providerModel = settings.defaultProvider === 'openai'
      ? settings.openaiModel
      : settings.ollamaModel;

    const system = `You are an AI agent designer. Return ONLY valid JSON for an agent specification with fields: name, role, systemPrompt, styleRules, capabilities, icon, colorTag. Role must be one of planner,researcher,writer,editor,critic,coder,qa,summarizer,custom. Capabilities must be an array of any of: web, files, code, image.`;

    const roleHint = aiRole !== 'auto' ? `Desired role: ${aiRole}.` : '';
    const message = `Create an AI agent based on this description: ${aiPrompt}. ${roleHint}`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model: providerModel,
          systemPrompt: system,
          temperature: 0.5,
          topP: 0.9,
          maxTokens: 1024,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate agent');
      }

      const data = await response.json();
      const parsed = parseAgentJson(data.response || '');
      if (!parsed) {
        throw new Error('Failed to parse agent JSON');
      }

      const draft: Partial<Agent> = {
        name: typeof parsed.name === 'string' ? parsed.name : 'New Agent',
        role: normalizeRole(parsed.role),
        systemPrompt: typeof parsed.systemPrompt === 'string' ? parsed.systemPrompt : '',
        styleRules: typeof parsed.styleRules === 'string' ? parsed.styleRules : '',
        capabilities: normalizeCapabilities(parsed.capabilities),
        icon: typeof parsed.icon === 'string' ? parsed.icon : '🤖',
        colorTag: typeof parsed.colorTag === 'string' ? parsed.colorTag : '#6366f1',
        provider: settings.defaultProvider,
        model: providerModel,
      };

      setDraftAgent(draft);
      setEditingAgent(null);
      setBuilderOpen(true);
      setAiModalOpen(false);
      setAiPrompt('');
      setAiRole('auto');
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Failed to generate agent');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDuplicate = async (agent: Agent) => {
    const duplicate = {
      ...agent,
      name: `${agent.name} (Copy)`,
    };
    delete (duplicate as any).id;
    delete (duplicate as any).createdAt;
    delete (duplicate as any).updatedAt;
    await createAgent(duplicate);
  };

  const handleExportAgents = () => {
    const exported = agents.map((agent) => ({
      name: agent.name,
      role: agent.role,
      systemPrompt: agent.systemPrompt,
      styleRules: agent.styleRules,
      capabilities: agent.capabilities,
      model: agent.model,
      provider: agent.provider,
      icon: agent.icon,
      colorTag: agent.colorTag,
    }));
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oyama-agents-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Agents <span className="text-sm text-muted-foreground font-normal">({stats.totalAgents})</span></h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAiModalOpen(true)}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingAgent(null);
                setDraftAgent(null);
                setBuilderOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="pl-9"
          />
        </div>

        {/* Role filters */}
        {roles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setSelectedRole(null)}
              className="cursor-pointer"
            >
              <Badge
                variant={selectedRole === null ? 'primary' : 'default'}
              >
                All
              </Badge>
            </button>
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className="cursor-pointer"
              >
                <Badge
                  variant={selectedRole === role ? 'primary' : 'default'}
                  className="capitalize"
                >
                  {role}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Agents grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        ) : filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTest}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No agents found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedRole
                ? 'Try adjusting your filters'
                : 'Get started by creating your first agent'}
            </p>
            {!searchQuery && !selectedRole && (
              <Button onClick={() => setBuilderOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Agent Builder Modal */}
      <AgentBuilder
        agent={editingAgent}
        draft={draftAgent}
        isOpen={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingAgent(null);
          setDraftAgent(null);
        }}
        onSave={handleSaveAgent}
      />

      <Modal
        isOpen={aiModalOpen}
        onClose={() => {
          setAiModalOpen(false);
          setAiError('');
        }}
        title="Create Agent with AI"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="ai-role">Preferred Role</Label>
            <Select
              id="ai-role"
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value as AgentRole | 'auto')}
              className="mt-1"
            >
              <option value="auto">Auto</option>
              <option value="planner">Planner</option>
              <option value="researcher">Researcher</option>
              <option value="writer">Writer</option>
              <option value="editor">Editor</option>
              <option value="critic">Critic</option>
              <option value="coder">Coder</option>
              <option value="qa">QA</option>
              <option value="summarizer">Summarizer</option>
              <option value="custom">Custom</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="ai-description">What should this agent do?</Label>
            <Textarea
              id="ai-description"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the agent's purpose, tone, and responsibilities..."
              rows={5}
              className="mt-1"
            />
          </div>
          {aiError && (
            <p className="text-sm text-destructive">{aiError}</p>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setAiModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerateAgent} disabled={aiLoading}>
            {aiLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
