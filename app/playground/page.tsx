'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Wand2, Loader, CheckCircle, XCircle, Send, SlidersHorizontal, RefreshCw, Plus, Layers, UserRound, Settings2, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { useSettingsStore } from '@/lib/stores/settings';
import { Modal, ModalFooter } from '@/components/ui/Modal';

interface Agent {
  id: string;
  name: string;
  role: string;
  bio?: string;
  systemPrompt?: string;
  colorTag?: string;
  icon?: string;
}

interface Crew {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  workflowType: 'sequential' | 'parallel' | 'conditional';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentId?: string;
}

interface StepResult {
  stepIndex: number;
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  success: boolean;
  error?: string;
  duration?: number;
}

const SYNTHESIZER_FALLBACK_PROMPT = `You are System Synthesizer, responsible for delivering the final, user-ready response.

CRITICAL RULES:
- Honor the user's original request exactly. Do not change scope, intent, or format unless asked.
- Use only the provided agent outputs and user request as your source material.
- Remove repetition, contradictions, and internal reasoning.
- If information is missing, state the gap briefly and propose a minimal assumption or ask a concise question.

OUTPUT REQUIREMENTS:
- Markdown only.
- One clear H1 title.
- Use H2/H3 sections with tight, professional paragraphs.
- Include lists or steps when they improve clarity.
- Do not mention other agents or the synthesis process.

Produce a single final answer and nothing else.`;

export default function AgentPlaygroundPage() {
  const {
    ollamaUrl,
    ollamaModel,
    ollamaAvailableModels,
    temperature,
    topP,
    maxTokens,
    synthesizerPrompt,
    enableRunNotifications,
  } = useSettingsStore();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [activeTab, setActiveTab] = useState<'crews' | 'agents'>('crews');
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [finalOutput, setFinalOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [runMode, setRunMode] = useState<'crew' | 'custom'>('crew');
  const [runWorkflowType, setRunWorkflowType] = useState<Crew['workflowType']>('sequential');
  const [runRounds, setRunRounds] = useState(1);
  const [runModel, setRunModel] = useState(ollamaModel);
  const [runTemperature, setRunTemperature] = useState(temperature);
  const [runTopP, setRunTopP] = useState(topP);
  const [runMaxTokens, setRunMaxTokens] = useState(maxTokens);
  const [runSetupOpen, setRunSetupOpen] = useState(true);

  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [crewName, setCrewName] = useState('');
  const [crewDescription, setCrewDescription] = useState('');
  const [crewWorkflow, setCrewWorkflow] = useState<Crew['workflowType']>('sequential');
  const [crewAgentIds, setCrewAgentIds] = useState<string[]>([]);
  const [crewSaving, setCrewSaving] = useState(false);
  const [crewError, setCrewError] = useState('');
  const [synthModalOpen, setSynthModalOpen] = useState(false);
  const [finalTimestamp, setFinalTimestamp] = useState<Date | null>(null);
  const [runAbortController, setRunAbortController] = useState<AbortController | null>(null);
  const lastRunStatusRef = useRef<'idle' | 'running' | 'completed' | 'failed'>('idle');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const systemSynthesizer = useMemo(
    () => agents.find((agent) => agent.id === 'agent-system-synthesizer'),
    [agents]
  );

  const visibleAgents = useMemo(
    () => agents.filter((agent) => agent.id !== 'agent-system-synthesizer'),
    [agents]
  );

  const selectedCrew = useMemo(
    () => crews.find((crew) => crew.id === selectedCrewId) || null,
    [crews, selectedCrewId]
  );

  const filteredCrews = useMemo(() => {
    if (!search.trim()) return crews;
    const term = search.toLowerCase();
    return crews.filter((crew) =>
      crew.name.toLowerCase().includes(term) || crew.description?.toLowerCase().includes(term)
    );
  }, [crews, search]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) throw new Error('Failed to fetch agents');
        const data = await response.json();
        setAgents(data);
      } catch {
        // ignore
      }
    };

    const fetchCrews = async () => {
      try {
        const response = await fetch('/api/crews');
        if (!response.ok) throw new Error('Failed to fetch crews');
        const data = await response.json();
        setCrews(data);
        if (data.length > 0) {
          setSelectedCrewId(data[0].id);
        }
      } catch {
        // ignore
      }
    };

    fetchAgents();
    fetchCrews();
  }, []);

  useEffect(() => {
    if (!selectedCrew) return;
    setActiveAgentIds(selectedCrew.agents || []);
    setRunWorkflowType(selectedCrew.workflowType || 'sequential');
  }, [selectedCrew]);

  useEffect(() => {
    if (runMode === 'crew' && selectedCrew) {
      setActiveAgentIds(selectedCrew.agents || []);
      return;
    }
    if (runMode === 'custom' && activeAgentIds.length === 0 && visibleAgents.length > 0) {
      setActiveAgentIds(visibleAgents.slice(0, 3).map((agent) => agent.id));
    }
  }, [runMode, selectedCrew, visibleAgents, activeAgentIds.length]);

  useEffect(() => {
    setRunModel(ollamaModel);
    setRunTemperature(temperature);
    setRunTopP(topP);
    setRunMaxTokens(maxTokens);
  }, [ollamaModel, temperature, topP, maxTokens]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, finalOutput]);

  useEffect(() => {
    const previousStatus = lastRunStatusRef.current;
    if (previousStatus === 'running' && status !== 'running' && enableRunNotifications) {
      const title = status === 'completed' ? 'Crew run completed' : 'Crew run failed';
      const body = status === 'completed'
        ? 'System Synthesizer finished the final output.'
        : error || 'A crew run failed.';

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
    lastRunStatusRef.current = status;
  }, [status, enableRunNotifications, error]);

  const toggleAgent = (agentId: string) => {
    setActiveAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const resetSession = () => {
    setInput('');
    setMessages([]);
    setSteps([]);
    setFinalOutput('');
    setStatus('idle');
    setError('');
    runAbortController?.abort();
    setRunAbortController(null);
  };

  const synthesizeFinal = async (request: string, stepResults: StepResult[]) => {
    const agentOutputs = stepResults
      .map((step) => `Agent ${step.agentName} Output:\n${step.output || ''}`)
      .join('\n\n');

    const synthesisMessage = `User request:\n${request}\n\nAgent outputs:\n${agentOutputs}`;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: synthesisMessage,
        model: runModel,
        systemPrompt: synthesizerPrompt || systemSynthesizer?.systemPrompt || SYNTHESIZER_FALLBACK_PROMPT,
        temperature: runTemperature,
        topP: runTopP,
        maxTokens: runMaxTokens,
        stream: false,
        messageHistory: [],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to synthesize final response');
    }

    const data = await response.json();
    const output = data.response || 'No response received.';
    setFinalOutput(output);
    setFinalTimestamp(new Date());
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-final-${Date.now()}`,
        role: 'assistant',
        content: output,
        timestamp: new Date(),
        agentName: systemSynthesizer?.name || 'System Synthesizer',
        agentId: systemSynthesizer?.id,
      },
    ]);
  };

  const runCrew = async () => {
    const request = input.trim();
    if (!request || activeAgentIds.length === 0) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: request,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSteps([]);
    setFinalOutput('');
    setStatus('running');
    setError('');

    const controller = new AbortController();
    setRunAbortController(controller);

    try {
      const workflow = {
        type: runWorkflowType,
        steps: activeAgentIds.map((agentId) => ({ agentId })),
      };

      const response = await fetch('/api/crews/runs/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crewId: runMode === 'crew' ? selectedCrew?.id || 'custom-run' : 'custom-run',
          crewName: runMode === 'crew' ? selectedCrew?.name || 'Custom Run' : 'Custom Run',
          workflow,
          input: request,
          rounds: runWorkflowType === 'sequential' ? runRounds : 1,
          options: {
            ollamaUrl,
            model: runModel,
            temperature: runTemperature,
            topP: runTopP,
            maxTokens: runMaxTokens,
            timeout: 60000,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Crew run failed to start');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let liveSteps: StepResult[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n').filter(Boolean);
          let event = 'message';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event:')) {
              event = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              data += line.replace('data:', '').trim();
            }
          }

          if (!data) continue;
          const parsed = JSON.parse(data);

          if (event === 'step') {
            const step = parsed.step as StepResult;
            setSteps((prev) => {
              const existing = prev.find((s) => s.stepIndex === step.stepIndex);
              liveSteps = existing
                ? prev.map((s) => (s.stepIndex === step.stepIndex ? step : s))
                : [...prev, step].sort((a, b) => a.stepIndex - b.stepIndex);
              return liveSteps;
            });

            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${step.stepIndex}-${Date.now()}`,
                role: 'assistant',
                content: step.success ? step.output : `Error: ${step.error || 'Unknown error'}`,
                timestamp: new Date(),
                agentName: step.agentName,
                agentId: step.agentId,
              },
            ]);
          }

          if (event === 'complete') {
            setStatus(parsed.success ? 'completed' : 'failed');
            setRunAbortController(null);
            if (parsed.success) {
              await synthesizeFinal(request, liveSteps);
            } else {
              setError(parsed.error || 'Crew run failed');
            }
          }

          if (event === 'error') {
            setStatus('failed');
            setError(parsed.error || 'Crew run failed');
            setRunAbortController(null);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatus('idle');
        setError('Run cancelled.');
        return;
      }
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Crew run failed');
    } finally {
      setRunAbortController(null);
    }
  };

  const handleStopRun = () => {
    runAbortController?.abort();
    setRunAbortController(null);
    setStatus('idle');
  };

  const openCreateCrew = () => {
    setCrewName('');
    setCrewDescription('');
    setCrewWorkflow('sequential');
    setCrewAgentIds([]);
    setCrewError('');
    setCrewModalOpen(true);
  };

  const toggleCrewAgent = (agentId: string) => {
    setCrewAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleCreateCrew = async () => {
    if (!crewName.trim() || crewAgentIds.length === 0) {
      setCrewError('Crew name and at least one agent are required.');
      return;
    }

    setCrewSaving(true);
    setCrewError('');
    try {
      const response = await fetch('/api/crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: crewName.trim(),
          description: crewDescription.trim(),
          agents: crewAgentIds,
          workflowType: crewWorkflow,
        }),
      });

      if (!response.ok) throw new Error('Failed to create crew');
      const created = await response.json();
      const refreshed = await fetch('/api/crews');
      if (refreshed.ok) {
        const data = await refreshed.json();
        setCrews(data);
      }
      setSelectedCrewId(created.id);
      setRunMode('crew');
      setCrewModalOpen(false);
    } catch (err) {
      setCrewError(err instanceof Error ? err.message : 'Failed to create crew');
    } finally {
      setCrewSaving(false);
    }
  };

  const hasActiveCrew = runMode === 'crew' && !!selectedCrew;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Agent Playground</h1>
              <p className="text-sm text-muted-foreground">
                Run crew workflows with a dedicated System Synthesizer for polished final output.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs">{visibleAgents.length} agents</Badge>
          <Badge variant="default" className="text-xs">{crews.length} crews</Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => (window as any).electronAPI?.minimizeWindow?.()}
            title="Minimize to taskbar"
          >
            Minimize
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div className="flex gap-4">
        {/* Left Panel */}
        <Card className="w-72 flex flex-col overflow-hidden" padding="none">
          <CardHeader className="p-4 border-b border-border/60">
            <CardTitle className="text-base">Library</CardTitle>
            <CardDescription>Choose crews and agents for this run.</CardDescription>
            <div className="flex gap-2 pt-3">
              <Button
                size="sm"
                variant={activeTab === 'crews' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('crews')}
              >
                Crews
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'agents' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('agents')}
              >
                Agents
              </Button>
              <Button size="sm" variant="ghost" onClick={openCreateCrew}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search crews or agents"
              className="mt-3"
            />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeTab === 'crews' && (
              filteredCrews.length === 0 ? (
                <div className="text-sm text-muted-foreground">No crews found.</div>
              ) : (
                filteredCrews.map((crew) => (
                  <button
                    key={crew.id}
                    onClick={() => {
                      setSelectedCrewId(crew.id);
                      setRunMode('crew');
                    }}
                    className={`w-full text-left rounded-lg border border-border/60 p-3 space-y-2 transition-colors ${
                      selectedCrewId === crew.id
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-background/60 hover:bg-secondary/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{crew.name}</span>
                      <Badge variant="default" className="text-xs">{crew.agents.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {crew.description || 'No description'}
                    </p>
                  </button>
                ))
              )
            )}
            {activeTab === 'agents' && (
              visibleAgents
                .filter((agent) =>
                  search.trim()
                    ? agent.name.toLowerCase().includes(search.toLowerCase()) || agent.role.toLowerCase().includes(search.toLowerCase())
                    : true
                )
                .map((agent) => (
                  <div
                    key={agent.id}
                    className="rounded-lg border border-border/60 p-3 bg-background/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{agent.name}</span>
                        <Badge variant="default" className="text-xs capitalize">{agent.role}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {agent.bio || 'No bio available.'}
                    </p>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Center Panel */}
        <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
          <CardHeader className="p-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Session</CardTitle>
                <CardDescription>
                  {selectedCrew && runMode === 'crew'
                    ? `${selectedCrew.name} • ${runWorkflowType}`
                    : runMode === 'custom'
                      ? 'Custom run with selected agents'
                      : 'Select a crew to begin.'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs capitalize">{status}</Badge>
                <Button variant="ghost" size="sm" onClick={resetSession}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRunSetupOpen((prev) => !prev)}
                  title={runSetupOpen ? 'Collapse setup' : 'Expand setup'}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {runSetupOpen && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Run Mode</Label>
                    <div className="mt-1 flex gap-2">
                      <Button
                        size="sm"
                        variant={runMode === 'crew' ? 'primary' : 'ghost'}
                        onClick={() => setRunMode('crew')}
                      >
                        <Layers className="w-4 h-4 mr-1" />
                        Crew
                      </Button>
                      <Button
                        size="sm"
                        variant={runMode === 'custom' ? 'primary' : 'ghost'}
                        onClick={() => setRunMode('custom')}
                      >
                        <UserRound className="w-4 h-4 mr-1" />
                        Custom
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Workflow Type</Label>
                    <Select
                      value={runWorkflowType}
                      onChange={(event) => setRunWorkflowType(event.target.value as Crew['workflowType'])}
                      className="mt-1"
                    >
                      <option value="sequential">sequential</option>
                      <option value="parallel">parallel</option>
                      <option value="conditional">conditional</option>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Rounds</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={runRounds}
                      onChange={(event) => setRunRounds(Math.max(1, Math.min(10, Number(event.target.value) || 1)))}
                      className="mt-1"
                      disabled={runWorkflowType !== 'sequential'}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Model</Label>
                    <Select value={runModel} onChange={(event) => setRunModel(event.target.value)} className="mt-1">
                      {(ollamaAvailableModels?.length ? ollamaAvailableModels : [ollamaModel]).map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Active Agents</Label>
                    {hasActiveCrew && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveAgentIds(selectedCrew?.agents || [])}
                      >
                        Reset to crew
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2">
                    {(runMode === 'crew' ? selectedCrew?.agents || [] : visibleAgents.map((agent) => agent.id)).map((agentId) => {
                      const agent = visibleAgents.find((item) => item.id === agentId);
                      if (!agent) return null;
                      const isActive = activeAgentIds.includes(agentId);
                      return (
                        <button
                          key={agentId}
                          onClick={() => toggleAgent(agentId)}
                          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                            isActive
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'bg-muted/40 border-border/60 text-muted-foreground'
                          }`}
                        >
                          {agent.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Temperature</Label>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.1}
                      value={runTemperature}
                      onChange={(event) => setRunTemperature(parseFloat(event.target.value))}
                      className="mt-2 w-full"
                      aria-label={`Temperature ${runTemperature}`}
                    />
                    <div className="text-[11px] text-muted-foreground">{runTemperature}</div>
                  </div>
                  <div>
                    <Label className="text-xs">Top P</Label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={runTopP}
                      onChange={(event) => setRunTopP(parseFloat(event.target.value))}
                      className="mt-2 w-full"
                      aria-label={`Top P ${runTopP}`}
                    />
                    <div className="text-[11px] text-muted-foreground">{runTopP}</div>
                  </div>
                  <div>
                    <Label className="text-xs">Max Tokens</Label>
                    <input
                      type="range"
                      min={512}
                      max={32768}
                      step={512}
                      value={runMaxTokens}
                      onChange={(event) => setRunMaxTokens(parseInt(event.target.value))}
                      className="mt-2 w-full"
                      aria-label={`Max Tokens ${runMaxTokens}`}
                    />
                    <div className="text-[11px] text-muted-foreground">{runMaxTokens}</div>
                  </div>
                </div>
              </>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/10">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Start a crew run to see agent responses.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id}>
                  {message.agentName && message.role === 'assistant' && (
                    <div className="mb-2">
                      <Badge variant="default" className="text-xs">
                        {message.agentName}
                      </Badge>
                    </div>
                  )}
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    messageId={message.id}
                  />
                </div>
              ))
            )}
            {status === 'running' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader className="w-4 h-4 animate-spin" />
                Agents are collaborating...
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="border-t border-border/60 p-4 bg-background/80">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Describe the task for your crew..."
                rows={3}
                className="flex-1 resize-none"
                disabled={status === 'running'}
              />
              {status === 'running' ? (
                <Button
                  className="h-auto px-4"
                  variant="destructive"
                  onClick={handleStopRun}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  className="h-auto px-4"
                  onClick={runCrew}
                  disabled={!input.trim() || activeAgentIds.length === 0 || (runMode === 'crew' && !selectedCrew)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Run
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Right Panel */}
        <div className="w-80 flex flex-col gap-4">
          <Card className="flex flex-col" padding="none">
            <CardHeader className="p-4 border-b border-border/60">
              <CardTitle className="text-base">Run Overview</CardTitle>
              <CardDescription>Track progress and agent outputs.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-1">
                  {status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : null}
                  {status === 'failed' ? <XCircle className="w-4 h-4 text-red-400" /> : null}
                  {status === 'running' ? <Loader className="w-4 h-4 text-blue-400 animate-spin" /> : null}
                  <span className="capitalize">{status}</span>
                </span>
              </div>
              {error && (
                <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg p-2">
                  {error}
                </div>
              )}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Model: {runModel}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Temperature {runTemperature} • Top P {runTopP} • Max Tokens {runMaxTokens}
                </div>
              </div>
              <div className="pt-2 border-t border-border/60 space-y-2">
                <p className="text-xs font-semibold">Agent Steps</p>
                {steps.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No steps yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {steps.map((step) => (
                      <div key={step.stepIndex} className="rounded-lg border border-border/60 p-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{step.agentName}</span>
                          <Badge variant="default" className="text-[10px]">
                            {step.success ? 'Success' : 'Error'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-3">
                          {step.output || step.error}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
        </div>

        <Card className="mt-4" padding="none">
          <CardHeader className="p-4 border-b border-border/60">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">System Synthesizer</CardTitle>
                <CardDescription>Final response crafted by the system agent.</CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSynthModalOpen(true)}
                disabled={!finalOutput}
                title="Expand final output"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{systemSynthesizer?.name || 'System Synthesizer'}</p>
                <p className="text-xs text-muted-foreground">{systemSynthesizer?.role || 'synthesizer'}</p>
              </div>
            </div>
            {finalOutput ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {finalOutput}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                Final output will appear here once the crew run completes.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={synthModalOpen}
        onClose={() => setSynthModalOpen(false)}
        title="System Synthesizer Output"
        description="Final response generated from the full crew run."
        size="xl"
      >
        {finalOutput ? (
          <ChatMessage
            role="assistant"
            content={finalOutput}
            timestamp={finalTimestamp || new Date()}
            messageId="synth-modal-output"
          />
        ) : (
          <div className="text-sm text-muted-foreground">No final output yet.</div>
        )}
      </Modal>

      <Modal
        isOpen={crewModalOpen}
        onClose={() => setCrewModalOpen(false)}
        title="Create Crew"
        description="Create a new crew and choose which agents participate."
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Crew Name</Label>
            <Input
              value={crewName}
              onChange={(event) => setCrewName(event.target.value)}
              placeholder="e.g., Content Studio"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={crewDescription}
              onChange={(event) => setCrewDescription(event.target.value)}
              placeholder="What will this crew do?"
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Workflow</Label>
            <Select value={crewWorkflow} onChange={(event) => setCrewWorkflow(event.target.value as Crew['workflowType'])} className="mt-1">
              <option value="sequential">sequential</option>
              <option value="parallel">parallel</option>
              <option value="conditional">conditional</option>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Agents</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {visibleAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => toggleCrewAgent(agent.id)}
                  className={`px-3 py-2 rounded-lg border text-left text-xs transition-colors ${
                    crewAgentIds.includes(agent.id)
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-muted/40 border-border/60 text-muted-foreground'
                  }`}
                >
                  <div className="font-semibold text-foreground">{agent.name}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{agent.role}</div>
                </button>
              ))}
            </div>
          </div>
          {crewError && (
            <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg p-2">
              {crewError}
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setCrewModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateCrew} disabled={crewSaving}>
            {crewSaving ? 'Saving...' : 'Create Crew'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
