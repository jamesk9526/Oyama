'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Loader, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Crew } from '@/lib/stores/crews';
import type { WorkflowExecutionResult, WorkflowStepResult } from '@/lib/workflows/types';

interface CrewExecutionModalProps {
  crew: Crew;
  isOpen: boolean;
  onClose: () => void;
  ollamaUrl: string;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export function CrewExecutionModal({
  crew,
  isOpen,
  onClose,
  ollamaUrl,
  model,
  temperature,
  topP,
  maxTokens,
}: CrewExecutionModalProps) {
  const [input, setInput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<WorkflowExecutionResult | null>(null);
  const [steps, setSteps] = useState<WorkflowStepResult[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [rounds, setRounds] = useState(1);
  const [error, setError] = useState('');

  const handleExecute = async () => {
    if (!input.trim()) {
      setError('Please enter an input message');
      return;
    }

    setExecuting(true);
    setError('');
    setResult(null);
    setSteps([]);
    setRunId(null);

    try {
      // Build workflow definition from crew
      const workflow = {
        type: crew.workflowType,
        steps: crew.agents.map((agentId) => ({
          agentId: agentId,
        })),
      };

      const response = await fetch('/api/crews/runs/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crewId: crew.id,
          crewName: crew.name,
          workflow,
          input: input.trim(),
          rounds,
          options: {
            ollamaUrl,
            model,
            temperature,
            topP,
            maxTokens,
            timeout: 60000, // 60 seconds per agent
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Workflow execution failed');
      }

      if (!response.body) {
        throw new Error('Streaming response not available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let liveSteps: WorkflowStepResult[] = [];

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
          if (event === 'run') {
            setRunId(parsed.runId || null);
          }

          if (event === 'step') {
            const step = parsed.step as WorkflowStepResult;
            setSteps((prev) => {
              const existing = prev.find((s) => s.stepIndex === step.stepIndex);
              if (existing) {
                liveSteps = prev.map((s) => (s.stepIndex === step.stepIndex ? step : s));
                return liveSteps;
              }
              liveSteps = [...prev, step].sort((a, b) => a.stepIndex - b.stepIndex);
              return liveSteps;
            });
          }

          if (event === 'complete') {
            setResult({
              crewId: crew.id,
              crewName: crew.name,
              workflowType: crew.workflowType,
              steps: liveSteps,
              success: parsed.success,
              totalDuration: parsed.totalDuration || 0,
              startTime: new Date(),
              endTime: new Date(),
              error: parsed.error,
            });
            setExecuting(false);
          }

          if (event === 'error') {
            setError(parsed.error || 'Workflow execution failed');
            setExecuting(false);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setExecuting(false);
    } finally {
      // Streaming handlers control executing state
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    setSteps([]);
    setRunId(null);
    setRounds(1);
    setError('');
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Execute: ${crew.name}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Input Section */}
        {!result && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="workflow-input" className="mb-2 block">
                Input Message
              </Label>
              <Textarea
                id="workflow-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter the task or question for the crew to process..."
                rows={4}
                disabled={executing}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be processed by {crew.agents.length} agent(s) in {crew.workflowType} mode
              </p>
            </div>
            <div>
              <Label htmlFor="workflow-rounds" className="mb-2 block">
                Rounds (Round Robin)
              </Label>
              <Input
                id="workflow-rounds"
                type="number"
                min={1}
                max={20}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value) || 1)}
                disabled={executing || crew.workflowType !== 'sequential'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only applies to sequential workflows.
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Execution Progress */}
        {executing && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
            <Loader className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Executing workflow...</p>
              <p className="text-xs text-muted-foreground">
                Running {crew.workflowType} workflow with {crew.agents.length} agents
              </p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {(result || steps.length > 0) && (
          <div className="space-y-3">
            {/* Summary */}
            {result && (
              <div className={`rounded-lg p-3 border ${
                result.success
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-destructive/10 border-destructive/20'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <p className="font-medium">
                  {result.success ? 'Workflow Completed' : 'Workflow Failed'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(result.totalDuration)}
                </span>
                <span>{result.steps.length} steps executed</span>
              </div>
              </div>
            )}

            {/* Step Results */}
            <div className="space-y-2">
              <Label className="text-sm">Step Results</Label>
              {(result?.steps.length ? result.steps : steps).map((step, index) => (
                <div
                  key={index}
                  className="border border-border/60 rounded-lg p-3 space-y-2 bg-background/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        Step {step.stepIndex + 1}
                      </span>
                      <span className="text-sm font-medium">{step.agentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {step.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(step.duration)}
                      </span>
                    </div>
                  </div>

                  {/* Input */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Input:</p>
                    <div className="bg-background rounded p-2 text-xs font-mono max-h-20 overflow-y-auto">
                      {step.input}
                    </div>
                  </div>

                  {/* Output or Error */}
                  {step.success ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Output:</p>
                      <div className="bg-background rounded p-2 text-xs max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {step.output}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-destructive mb-1">Error:</p>
                      <div className="bg-destructive/10 rounded p-2 text-xs text-destructive">
                        {step.error}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {result ? (
            <>
              <Button variant="secondary" onClick={handleReset}>
                Run Again
              </Button>
              {runId && (
                <Button
                  variant="secondary"
                  onClick={() => window.open(`/crews/runs?runId=${runId}`, '_blank')}
                >
                  View Run
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose} disabled={executing}>
                Cancel
              </Button>
              <Button onClick={handleExecute} disabled={executing || !input.trim()}>
                {executing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  'Execute'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
