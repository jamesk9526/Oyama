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
  const [error, setError] = useState('');

  const handleExecute = async () => {
    if (!input.trim()) {
      setError('Please enter an input message');
      return;
    }

    setExecuting(true);
    setError('');
    setResult(null);

    try {
      // Build workflow definition from crew
      const workflow = {
        type: crew.workflowType,
        steps: crew.agents.map((agentId) => ({
          agentId: agentId,
        })),
      };

      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crewId: crew.id,
          crewName: crew.name,
          workflow,
          input: input.trim(),
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

      const executionResult = await response.json();
      setResult(executionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExecuting(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
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
        {result && (
          <div className="space-y-3">
            {/* Summary */}
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

            {/* Step Results */}
            <div className="space-y-2">
              <Label className="text-sm">Step Results</Label>
              {result.steps.map((step, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-3 space-y-2"
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
