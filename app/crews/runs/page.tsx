'use client';

import { Suspense, useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader, Send, StopCircle, CheckCircle, XCircle, Trash2, Search, Download, TrendingUp, Users, User, RefreshCw, Settings2 } from 'lucide-react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAgentsStore } from '@/lib/stores/agents';

interface CrewRunRecord {
  id: string;
  crewId: string;
  crewName: string;
  workflowType: string;
  input: string;
  status: 'running' | 'completed' | 'failed';
  model: string;
  provider: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface CrewRunStepRecord {
  id: string;
  runId: string;
  stepIndex: number;
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  success: boolean;
  error?: string;
  duration: number;
  createdAt: string;
}

interface ChatMode {
  type: 'round-robin' | 'one-on-one';
  selectedAgentId?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentId?: string;
}

function RunsPageContent() {
  const searchParams = useSearchParams();
  const initialRunId = searchParams.get('runId');
  const settings = useSettingsStore();
  const { agents, fetchAgents } = useAgentsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [runs, setRuns] = useState<CrewRunRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRunId);
  const [selectedRun, setSelectedRun] = useState<CrewRunRecord | null>(null);
  const [steps, setSteps] = useState<CrewRunStepRecord[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStats, setShowStats] = useState(false);
  const [crewAgents, setCrewAgents] = useState<any[]>([]);
  
  // Chat interface state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>({ type: 'round-robin' });
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(8192);

  const statusCounts = useMemo(() => {
    return runs.reduce(
      (acc, run) => {
        acc.total += 1;
        acc[run.status] += 1;
        return acc;
      },
      { total: 0, running: 0, completed: 0, failed: 0 }
    );
  }, [runs]);

  // Filter runs based on search and status
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const matchesSearch = !searchQuery || 
        run.crewName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.input.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [runs, searchQuery, statusFilter]);

  // Calculate advanced stats
  const stats = useMemo(() => {
    const completed = runs.filter(r => r.status === 'completed');
    const avgDuration = completed.length > 0
      ? completed.reduce((sum, r) => {
          const duration = r.completedAt 
            ? new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()
            : 0;
          return sum + duration;
        }, 0) / completed.length / 1000
      : 0;

    const successRate = runs.length > 0
      ? (completed.length / runs.length) * 100
      : 0;

    return {
      avgDuration: avgDuration.toFixed(1),
      successRate: successRate.toFixed(1),
      totalSteps: steps.length,
    };
  }, [runs, steps]);

  const handleExportRun = () => {
    if (!selectedRun) return;

    const exportData = {
      run: selectedRun,
      steps: steps.map(step => ({
        agentName: step.agentName,
        input: step.input,
        output: step.output,
        success: step.success,
        duration: step.duration,
        error: step.error,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crew-run-${selectedRun.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crews/runs?limit=100');
      if (!response.ok) throw new Error('Failed to fetch runs');
      const data = await response.json();
      setRuns(data);
      if (!selectedRunId && data.length > 0) {
        setSelectedRunId(data[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchRunDetails = async (runId: string) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/crews/runs/${runId}`);
      if (!response.ok) throw new Error('Failed to fetch run details');
      const data = await response.json();
      setSelectedRun(data.run);
      setSteps(data.steps || []);
      setRuns((prev) => prev.map((run) => (run.id === data.run.id ? data.run : run)));
    } catch {
      // ignore
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (!confirm('Delete this run and its steps?')) return;
    try {
      const response = await fetch(`/api/crews/runs/${runId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete run');
      setRuns((prev) => prev.filter((run) => run.id !== runId));
      if (selectedRunId === runId) {
        setSelectedRunId(null);
        setSelectedRun(null);
        setSteps([]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (selectedRunId) {
      fetchRunDetails(selectedRunId);
    }
  }, [selectedRunId]);

  useEffect(() => {
    const hasRunning = runs.some((run) => run.status === 'running');
    if (!hasRunning && selectedRun?.status !== 'running') return;

    const interval = setInterval(() => {
      fetchRuns();
      if (selectedRunId) {
        fetchRunDetails(selectedRunId);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [runs, selectedRun, selectedRunId]);

  // Fetch crew agents and initialize messages when selectedRun changes
  useEffect(() => {
    const fetchCrewAgents = async () => {
      if (!selectedRun?.crewId) return;
      try {
        const crewResponse = await fetch(`/api/crews/${selectedRun.crewId}`);
        if (crewResponse.ok) {
          const crewData = await crewResponse.json();
          const crewAgentIds = crewData.agents || [];
          const filteredAgents = agents.filter((a) => crewAgentIds.includes(a.id));
          setCrewAgents(filteredAgents);
          
          // Set default agent for one-on-one mode
          if (filteredAgents.length > 0 && chatMode.type === 'one-on-one' && !chatMode.selectedAgentId) {
            setChatMode({ type: 'one-on-one', selectedAgentId: filteredAgents[0].id });
          }
        }
      } catch {
        // ignore
      }
    };
    fetchCrewAgents();
  }, [selectedRun, agents]);

  // Initialize messages from steps
  useEffect(() => {
    if (steps.length > 0) {
      const initialMessages: Message[] = [];
      steps.forEach((step) => {
        initialMessages.push({
          id: `step-${step.id}-user`,
          role: 'user',
          content: step.input,
          timestamp: new Date(step.createdAt),
        });
        initialMessages.push({
          id: `step-${step.id}-assistant`,
          role: 'assistant',
          content: step.success ? step.output : `Error: ${step.error || 'Unknown error'}`,
          timestamp: new Date(step.createdAt),
          agentName: step.agentName,
          agentId: step.agentId,
        });
      });
      setMessages(initialMessages);
    } else {
      setMessages([]);
    }
  }, [steps]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.max(0, endTime - startTime);
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating || crewAgents.length === 0 || !selectedRun) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (chatMode.type === 'round-robin') {
        // Round robin: all agents respond in sequence
        const baseRequest = input.trim();
        const roundOutputs: string[] = [];
        let rollingHistory: Message[] = [...messages, userMessage];
        for (let i = 0; i < crewAgents.length; i++) {
          const agent = crewAgents[i];
          const isFinalAgent = i === crewAgents.length - 1;
          const priorOutputs = roundOutputs.length
            ? roundOutputs.map((output, index) => `Agent ${index + 1} Output:\n${output}`).join('\n\n')
            : 'None yet.';
          
          // Build context from recent messages
          const conversationHistory = rollingHistory
            .slice(-12)
            .map((m) => ({
              role: m.role,
              content: m.content,
            }));

          const stageInstruction = isFinalAgent
            ? 'You are the final synthesizer. Provide the complete, user-ready answer. Do not mention other agents or your process. Format in Markdown with a single H1 title, clear H2/H3 section headings, and proper paragraphs.'
            : 'Provide your contribution to the final answer. Avoid repetition and focus on unique value. Use concise Markdown notes with headings or bullets.';

          const message = `User request:\n${baseRequest}\n\nPrior agent outputs:\n${priorOutputs}`;

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              model: selectedRun.model,
              systemPrompt: `${agent.systemPrompt}\n\nYou are agent ${i + 1} of ${crewAgents.length} in a crew. ${stageInstruction}`,
              temperature,
              topP,
              maxTokens,
              stream: false,
              conversationHistory,
            }),
            signal: abortController.signal,
          });

          if (!response.ok) throw new Error(`Agent ${agent.name} failed to respond`);

          const data = await response.json();

          const assistantMessage: Message = {
            id: `assistant-${Date.now()}-${i}`,
            role: 'assistant',
            content: data.response || 'No response received.',
            timestamp: new Date(),
            agentName: agent.name,
            agentId: agent.id,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          roundOutputs.push(assistantMessage.content);
          rollingHistory = [...rollingHistory, assistantMessage];
          
          // Small delay between agents for readability
          if (i < crewAgents.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } else {
        // One-on-one: single agent responds with full history
        const agent = crewAgents.find((a) => a.id === chatMode.selectedAgentId);
        if (!agent) throw new Error('Selected agent not found');

        const conversationHistory = messages
          .slice(-12)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input.trim(),
            model: selectedRun.model,
            systemPrompt: `${agent.systemPrompt}\n\nYou are having a one-on-one conversation. Provide detailed, comprehensive responses.`,
            temperature,
            topP,
            maxTokens,
            stream: false,
            conversationHistory,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error('Failed to generate response');

        const data = await response.json();

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || 'No response received.',
          timestamp: new Date(),
          agentName: agent.name,
          agentId: agent.id,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to generate response'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusBadge = (status: CrewRunRecord['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default:
        return <Badge>Idle</Badge>;
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Sidebar with runs list */}
      <div className="w-80 border-r border-border/60 flex flex-col bg-secondary/40 backdrop-blur-sm">
        {/* Header */}
        <div className="border-b border-border/60 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Crew Runs</h2>
            <Link href="/crews">
              <Button variant="ghost" size="sm">Back</Button>
            </Link>
          </div>
          
          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search runs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter runs by status"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 p-4 border-b border-border/60">
          <div className="text-center p-2 rounded-lg bg-background/60">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{statusCounts.total}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/60">
            <p className="text-xs text-muted-foreground">Running</p>
            <p className="text-lg font-semibold text-blue-500">{statusCounts.running}</p>
          </div>
        </div>

        {/* Runs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && runs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {searchQuery || statusFilter !== 'all' ? 'No matching runs found.' : 'No runs yet.'}
            </p>
          ) : (
            filteredRuns.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
                className={`w-full text-left border border-border/60 rounded-lg p-3 space-y-2 transition-all duration-200 ${
                  selectedRunId === run.id
                    ? 'bg-primary/10 border-primary/30 shadow-sm'
                    : 'bg-background/60 hover:bg-secondary/60 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate flex-1">{run.crewName}</p>
                  {statusBadge(run.status)}
                </div>
                <p className="text-xs text-muted-foreground">{new Date(run.startedAt).toLocaleString()}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {run.status === 'completed' ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : run.status === 'failed' ? (
                    <XCircle className="w-3 h-3 text-red-500" />
                  ) : (
                    <Loader className="w-3 h-3 text-blue-500 animate-spin" />
                  )}
                  <span>{formatDuration(run.startedAt, run.completedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedRun ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <p className="text-lg font-medium mb-2">No run selected</p>
              <p className="text-sm">Select a run from the sidebar to continue</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="border-b border-border/60 bg-background/80 backdrop-blur p-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-1">{selectedRun.crewName}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {statusBadge(selectedRun.status)}
                    <Badge variant="default" className="text-xs">{selectedRun.model}</Badge>
                    <Badge variant="default" className="text-xs">{crewAgents.length} agents</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    title="Toggle settings"
                  >
                    <Settings2 className={`w-4 h-4 ${showSettings ? 'text-primary' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRun(selectedRun.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="border-t border-border/60 pt-4 mt-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs mb-2 block">Temperature: {temperature}</Label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full"
                        aria-label={`Temperature: ${temperature}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Top P: {topP}</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={topP}
                        onChange={(e) => setTopP(parseFloat(e.target.value))}
                        className="w-full"
                        aria-label={`Top P: ${topP}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Max Tokens: {maxTokens}</Label>
                      <input
                        type="range"
                        min="1024"
                        max="32768"
                        step="1024"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        className="w-full"
                        aria-label={`Max Tokens: ${maxTokens}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Selector */}
              <div className="border-t border-border/60 pt-4 mt-4">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-semibold">Chat Mode:</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={chatMode.type === 'round-robin' ? 'primary' : 'ghost'}
                      onClick={() => setChatMode({ type: 'round-robin' })}
                      disabled={crewAgents.length === 0}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Round Robin
                    </Button>
                    <Button
                      size="sm"
                      variant={chatMode.type === 'one-on-one' ? 'primary' : 'ghost'}
                      onClick={() => setChatMode({ type: 'one-on-one', selectedAgentId: crewAgents[0]?.id })}
                      disabled={crewAgents.length === 0}
                    >
                      <User className="w-4 h-4 mr-2" />
                      One-on-One
                    </Button>
                  </div>
                  
                  {chatMode.type === 'one-on-one' && crewAgents.length > 0 && (
                    <Select
                      value={chatMode.selectedAgentId || crewAgents[0]?.id}
                      onChange={(e) => setChatMode({ type: 'one-on-one', selectedAgentId: e.target.value })}
                      className="flex-1 max-w-xs"
                    >
                      {crewAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.role})
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {chatMode.type === 'round-robin'
                    ? 'All agents respond in sequence to each message'
                    : 'Have a focused conversation with a single agent'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
              {detailsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <p className="text-sm font-medium mb-2">No messages yet</p>
                    <p className="text-xs">Start a conversation with the crew below</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.agentName && message.role === 'assistant' && (
                        <div className="mb-2 pl-1">
                          <Badge variant="default" className="text-xs font-medium">
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
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-4">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>
                        {chatMode.type === 'round-robin'
                          ? 'Agents are responding...'
                          : 'Agent is thinking...'}
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border/60 p-4 bg-background/80 backdrop-blur">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    chatMode.type === 'round-robin'
                      ? 'Message all agents in the crew...'
                      : 'Chat with the selected agent...'
                  }
                  rows={3}
                  className="flex-1 resize-none"
                  disabled={isGenerating || crewAgents.length === 0}
                />
                <div className="flex flex-col gap-2">
                  {isGenerating ? (
                    <Button
                      onClick={handleStop}
                      variant="destructive"
                      size="sm"
                      className="h-full px-4"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || crewAgents.length === 0}
                      size="sm"
                      className="h-full px-4 font-semibold"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • Shift+Enter for new line • Up to {maxTokens.toLocaleString()} tokens per response
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RunsPage() {
  return (
    <Suspense>
      <RunsPageContent />
    </Suspense>
  );
}
