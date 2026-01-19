'use client';

import { useState, useEffect } from 'react';
import { Agent, AgentRole } from '@/types';
import { AgentCard } from '@/components/agents/AgentCard';
import { AgentBuilder } from '@/components/agents/AgentBuilder';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Users } from 'lucide-react';
import { useAgentsStore } from '@/lib/stores/agents';

export default function AgentsPage() {
  const { agents, loading, fetchAgents, createAgent, updateAgent, deleteAgent } = useAgentsStore();
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<AgentRole | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
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
    // TODO: Open test chat
    console.log('Test agent:', agent.id);
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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">Agents</h1>
            <p className="text-sm text-muted-foreground">
              AI agents with specialized roles and capabilities
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingAgent(null);
              setBuilderOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Agent</span>
            <span className="sm:hidden">New</span>
          </Button>
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
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        ) : filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        isOpen={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgent}
      />
    </div>
  );
}
