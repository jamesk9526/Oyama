'use client';

import { useState } from 'react';
import { Agent, AgentRole, AgentCapability } from '@/types';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';

interface AgentBuilderProps {
  agent?: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Partial<Agent>) => void;
}

const rolePresets: Record<AgentRole, { icon: string; prompt: string; description: string }> = {
  planner: {
    icon: '📋',
    prompt: 'You are a strategic planner. Break down complex goals into actionable steps, create timelines, and identify dependencies. Always be thorough and consider potential risks.',
    description: 'Creates detailed plans and roadmaps',
  },
  researcher: {
    icon: '🔍',
    prompt: 'You are a thorough research assistant. Gather comprehensive information, cite sources, and present findings in a structured format. Be objective and fact-based.',
    description: 'Conducts research and gathers information',
  },
  writer: {
    icon: '✍️',
    prompt: 'You are a skilled content writer. Create engaging, well-structured content that is clear and compelling. Adapt your tone and style to the target audience.',
    description: 'Creates written content',
  },
  editor: {
    icon: '✏️',
    prompt: 'You are an expert editor. Review content for clarity, grammar, style, and structure. Provide constructive feedback and suggest improvements.',
    description: 'Reviews and improves content',
  },
  critic: {
    icon: '🎭',
    prompt: 'You are a constructive critic. Analyze ideas, identify weaknesses, and suggest improvements. Be honest but respectful in your assessments.',
    description: 'Provides critical analysis',
  },
  coder: {
    icon: '💻',
    prompt: 'You are an expert programmer. Write clean, efficient, well-documented code. Follow best practices and explain your implementation choices.',
    description: 'Writes and reviews code',
  },
  qa: {
    icon: '✅',
    prompt: 'You are a quality assurance specialist. Test thoroughly, identify bugs, and ensure high standards. Document issues clearly with reproduction steps.',
    description: 'Tests and validates quality',
  },
  summarizer: {
    icon: '📝',
    prompt: 'You are a skilled summarizer. Extract key points, condense information while retaining essential details, and present summaries clearly.',
    description: 'Summarizes and distills information',
  },
  custom: {
    icon: '⚙️',
    prompt: '',
    description: 'Custom agent with unique behavior',
  },
};

const availableCapabilities: { value: AgentCapability; label: string; description: string }[] = [
  { value: 'web', label: 'Web Access', description: 'Can search and fetch web content' },
  { value: 'files', label: 'File Access', description: 'Can read and write files' },
  { value: 'code', label: 'Code Execution', description: 'Can execute code locally' },
  { value: 'image', label: 'Image Analysis', description: 'Can analyze images' },
];

export const AgentBuilder = ({
  agent,
  isOpen,
  onClose,
  onSave,
}: AgentBuilderProps) => {
  const [name, setName] = useState(agent?.name || '');
  const [role, setRole] = useState<AgentRole>(agent?.role || 'custom');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
  const [styleRules, setStyleRules] = useState(agent?.styleRules || '');
  const [model, setModel] = useState(agent?.model || 'llama2');
  const [provider, setProvider] = useState(agent?.provider || 'ollama');
  const [capabilities, setCapabilities] = useState<AgentCapability[]>(agent?.capabilities || []);
  const [icon, setIcon] = useState(agent?.icon || '🤖');
  const [colorTag, setColorTag] = useState(agent?.colorTag || '#6366f1');

  const handleRoleChange = (newRole: AgentRole) => {
    setRole(newRole);
    if (!agent && rolePresets[newRole]) {
      setSystemPrompt(rolePresets[newRole].prompt);
      setIcon(rolePresets[newRole].icon);
    }
  };

  const toggleCapability = (cap: AgentCapability) => {
    setCapabilities(
      capabilities.includes(cap)
        ? capabilities.filter((c) => c !== cap)
        : [...capabilities, cap]
    );
  };

  const handleSave = () => {
    onSave({
      ...(agent || {}),
      name,
      role,
      systemPrompt,
      styleRules,
      model,
      provider,
      capabilities,
      icon,
      colorTag,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? 'Edit Agent' : 'Create Agent'}
      size="xl"
    >
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="model">Model & Capabilities</TabsTrigger>
          <TabsTrigger value="style">Style & Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" required>Agent Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Assistant"
              className="mt-1"
            />
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role" required>Role</Label>
            <Select
              id="role"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as AgentRole)}
              className="mt-1"
            >
              <option value="planner">Planner</option>
              <option value="researcher">Researcher</option>
              <option value="writer">Writer</option>
              <option value="editor">Editor</option>
              <option value="critic">Critic</option>
              <option value="coder">Coder</option>
              <option value="qa">QA Specialist</option>
              <option value="summarizer">Summarizer</option>
              <option value="custom">Custom</option>
            </Select>
            {rolePresets[role] && (
              <p className="text-xs text-muted-foreground mt-1">
                {rolePresets[role].description}
              </p>
            )}
          </div>

          {/* Role Preset Cards */}
          {!agent && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(rolePresets).map(([roleKey, preset]) => (
                <button
                  key={roleKey}
                  onClick={() => handleRoleChange(roleKey as AgentRole)}
                  className="cursor-pointer"
                >
                  <Card
                    padding="sm"
                    className={`transition-all ${
                      role === roleKey ? 'border-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{preset.icon}</span>
                      <div>
                        <p className="font-medium text-sm capitalize">{roleKey}</p>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          {/* System Prompt */}
          <div>
            <Label htmlFor="systemPrompt" required>System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define the agent's behavior, expertise, and communication style..."
              rows={12}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This prompt defines how the agent behaves and responds
            </p>
          </div>

          {/* Style Rules */}
          <div>
            <Label htmlFor="styleRules">Style Rules (Optional)</Label>
            <Textarea
              id="styleRules"
              value={styleRules}
              onChange={(e) => setStyleRules(e.target.value)}
              placeholder="Additional style constraints, format requirements, etc..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional formatting and style guidelines
            </p>
          </div>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          {/* Provider */}
          <div>
            <Label htmlFor="provider" required>Provider</Label>
            <Select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="openai">OpenAI</option>
              <option value="openai-compatible">OpenAI Compatible</option>
            </Select>
          </div>

          {/* Model */}
          <div>
            <Label htmlFor="model" required>Model</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., llama2, gpt-4"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Model name from your selected provider
            </p>
          </div>

          {/* Capabilities */}
          <div>
            <Label>Capabilities</Label>
            <div className="space-y-2 mt-2">
              {availableCapabilities.map((cap) => (
                <button
                  key={cap.value}
                  onClick={() => toggleCapability(cap.value)}
                  className="cursor-pointer w-full"
                >
                  <Card
                    padding="sm"
                    className={`transition-all ${
                      capabilities.includes(cap.value) ? 'border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={capabilities.includes(cap.value)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">{cap.label}</p>
                        <p className="text-xs text-muted-foreground">{cap.description}</p>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          {/* Icon */}
          <div>
            <Label htmlFor="icon">Icon (Emoji)</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🤖"
              className="mt-1"
              maxLength={2}
            />
          </div>

          {/* Color Tag */}
          <div>
            <Label htmlFor="colorTag">Color Tag</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="colorTag"
                type="color"
                value={colorTag}
                onChange={(e) => setColorTag(e.target.value)}
                className="w-20 h-10 p-1"
              />
              <Input
                value={colorTag}
                onChange={(e) => setColorTag(e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label>Preview</Label>
            <Card className="mt-2 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                  style={{ backgroundColor: colorTag + '20' }}
                >
                  {icon}
                </div>
                <div>
                  <h3 className="font-semibold">{name || 'Agent Name'}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{role}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name || !systemPrompt}>
          {agent ? 'Save Changes' : 'Create Agent'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
