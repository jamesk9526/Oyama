'use client';

import { Suspense, useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader, Play, CheckCircle, XCircle, Clock, Trash2, Search, Download, Filter, TrendingUp } from 'lucide-react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { useSettingsStore } from '@/lib/stores/settings';

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

function RunsPageContent() {
  const searchParams = useSearchParams();
  const initialRunId = searchParams.get('runId');
  const settings = useSettingsStore();
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const [runs, setRuns] = useState<CrewRunRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRunId);
  const [selectedRun, setSelectedRun] = useState<CrewRunRecord | null>(null);
  const [steps, setSteps] = useState<CrewRunStepRecord[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStats, setShowStats] = useState(false);

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
    if (selectedRunId) {
      fetchRunDetails(selectedRunId);
    }
  }, [selectedRunId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRuns();
      if (selectedRun?.status === 'running' && selectedRunId) {
        fetchRunDetails(selectedRunId);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedRun?.status, selectedRunId]);

  // Auto-scroll to bottom when steps change
  useEffect(() => {
    if (settings.autoScrollToLatest && selectedRun?.status === 'running') {
      stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps, selectedRun?.status, settings.autoScrollToLatest]);

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.max(0, endTime - startTime);
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b border-border/60 bg-background/80 backdrop-blur p-4 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Crew Runs</h1>
            <p className="text-sm text-muted-foreground">Monitor executions and review outputs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowStats(!showStats)}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Stats
            </Button>
            {selectedRun && (
              <Button variant="ghost" size="sm" onClick={handleExportRun}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="secondary" onClick={fetchRuns} disabled={loading}>
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </Button>
            <Link href="/crews">
              <Button>Back to Crews</Button>
            </Link>
          </div>
        </div>
        
        {showStats && (
          <div className="grid grid-cols-3 gap-3 mt-4 p-4 rounded-lg border border-border bg-background/60">
            <div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="text-xl font-semibold">{stats.successRate}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
              <p className="text-xl font-semibold">{stats.avgDuration}s</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Steps</p>
              <p className="text-xl font-semibold">{stats.totalSteps}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <Card>
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Total Runs</p>
              <p className="text-lg font-semibold">{statusCounts.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Running</p>
              <p className="text-lg font-semibold text-blue-500">{statusCounts.running}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-semibold text-green-500">{statusCounts.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold text-red-500">{statusCounts.failed}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 p-4 overflow-hidden">
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Runs</CardTitle>
            <CardDescription className="text-xs">Latest activity across crews</CardDescription>
            
            {/* Search and Filter */}
            <div className="space-y-2 pt-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search runs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filter runs by status"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2">
            {loading && runs.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? 'No matching runs found.' : 'No runs yet.'}
              </p>
            ) : (
              filteredRuns.map((run) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className={`w-full text-left border border-border/60 rounded-lg p-3 space-y-2 transition-colors ${
                    selectedRunId === run.id
                      ? 'bg-accent/40 border-primary/40'
                      : 'bg-background/60 hover:bg-accent/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{run.crewName}</p>
                    {statusBadge(run.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(run.startedAt).toLocaleString()}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {run.status === 'running' ? (
                      <Play className="w-3 h-3 text-blue-500" />
                    ) : run.status === 'completed' ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    <span>{formatDuration(run.startedAt, run.completedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Run Details</CardTitle>
            <CardDescription className="text-xs">
              {selectedRun ? `Run ${selectedRun.id}` : 'Select a run to view output'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {!selectedRun && !detailsLoading && (
              <p className="text-sm text-muted-foreground">No run selected.</p>
            )}
            {detailsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader className="w-4 h-4 animate-spin" /> Loading run details...
              </div>
            )}
            {selectedRun && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(selectedRun.status)}
                  <Badge className="bg-muted/60">{selectedRun.workflowType}</Badge>
                  <Badge className="bg-muted/60">{selectedRun.model}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Crew</p>
                    <p className="font-medium">{selectedRun.crewName}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteRun(selectedRun.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Run
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(selectedRun.startedAt, selectedRun.completedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="font-medium">{new Date(selectedRun.startedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-medium">{selectedRun.completedAt ? new Date(selectedRun.completedAt).toLocaleString() : '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Input</p>
                  <div className="bg-background rounded p-2 text-xs font-mono max-h-24 overflow-y-auto">
                    {selectedRun.input}
                  </div>
                </div>
                {selectedRun.error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                    {selectedRun.error}
                  </div>
                )}
              </div>
            )}

            {selectedRun && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Conversation Output</p>
                  {selectedRun.status === 'running' && (
                    <span className="text-xs text-blue-500">Live updating…</span>
                  )}
                </div>
                {steps.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No steps recorded yet.</p>
                ) : (
                  <div className="space-y-6">
                    {steps.map((step) => (
                      <div key={step.id} className="space-y-3">
                        <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                          <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
                            Step {step.stepIndex + 1}
                          </Badge>
                          <Badge className="bg-muted/60 font-medium">
                            {step.agentName}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            {step.success ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-destructive" />
                            )}
                            <span>{step.duration}ms</span>
                          </div>
                        </div>
                        <div className="space-y-3 pl-2">
                          <ChatMessage
                            role="user"
                            content={step.input}
                            timestamp={new Date(step.createdAt)}
                          />
                          <ChatMessage
                            role="assistant"
                            content={step.success ? step.output : `Error: ${step.error || 'Unknown error'}`}
                            timestamp={new Date(step.createdAt)}
                          />
                        </div>
                      </div>
                    ))}
                    <div ref={stepsEndRef} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
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
