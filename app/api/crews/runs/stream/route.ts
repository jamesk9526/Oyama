import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowExecutor } from '@/lib/workflows/executor';
import { agentQueries, attachmentQueries, crewRunQueries, crewRunStepQueries } from '@/lib/db/queries';
import type { WorkflowDefinition } from '@/lib/workflows/types';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { crewId, crewName, workflow, input, options, attachmentIds = [], rounds = 1 } = body;

  if (!crewId || !crewName || !workflow || !input || !options) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: crewId, crewName, workflow, input, options' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!workflow.type || !workflow.steps || !Array.isArray(workflow.steps)) {
    return new Response(JSON.stringify({ error: 'Invalid workflow definition' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!options.ollamaUrl || !options.model) {
    return new Response(JSON.stringify({ error: 'Missing required options: ollamaUrl, model' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const agents = agentQueries.getAll();
  const agentIds = workflow.steps.map((step: any) => step.agentId);
  const missingAgents = agentIds.filter((id: string) => !agents.find((a) => a.id === id));
  if (missingAgents.length > 0) {
    return new Response(
      JSON.stringify({ error: `Agents not found: ${missingAgents.join(', ')}` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let attachments: { name: string; path: string }[] = [];
  if (attachmentIds.length > 0) {
    attachments = attachmentQueries.getByIds(attachmentIds);
  } else {
    attachments = attachmentQueries.getByScope('crew', crewId);
  }

  const attachmentContext = attachments
    .map((attachment) => {
      const absolutePath = path.join(process.cwd(), '.data', attachment.path);
      let content = '';
      try {
        content = fs.readFileSync(absolutePath, 'utf-8');
      } catch {
        content = '[Unable to read file]';
      }
      const maxCharsPerFile = 6000;
      const clipped = content.length > maxCharsPerFile
        ? `${content.slice(0, maxCharsPerFile)}\n...[truncated]`
        : content;
      return `File: ${attachment.name}\n${clipped}`;
    })
    .join('\n\n');

  const enrichedInput = attachmentContext
    ? `${input}\n\nAttached Files:\n${attachmentContext}`
    : input;

  const normalizedRounds = Number.isFinite(rounds) && rounds > 0 ? Math.min(rounds, 20) : 1;
  const expandedWorkflow: WorkflowDefinition = {
    ...workflow,
    steps:
      workflow.type === 'sequential'
        ? Array.from({ length: normalizedRounds }).flatMap(() => workflow.steps)
        : workflow.steps,
  };

  const runId = uuidv4();
  const startedAt = new Date().toISOString();
  crewRunQueries.createRun({
    id: runId,
    crewId,
    crewName,
    workflowType: workflow.type,
    input: enrichedInput,
    status: 'running',
    model: options.model,
    provider: 'ollama',
    temperature: options.temperature,
    topP: options.topP,
    maxTokens: options.maxTokens,
    startedAt,
  });

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      const encoder = new TextEncoder();
      const send = (event: string, data: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          isClosed = true;
        }
      };

      const safeClose = () => {
        if (isClosed) return;
        isClosed = true;
        try {
          controller.close();
        } catch {
          // ignore double-close
        }
      };

      send('run', { runId, status: 'running', startedAt, crewId, crewName, workflowType: workflow.type });

      const executor = new WorkflowExecutor(agents, options);
      executor
        .executeWithCallbacks(
          crewId,
          crewName,
          expandedWorkflow,
          enrichedInput,
          (step) => {
            const stepId = uuidv4();
            crewRunStepQueries.addStep({
              id: stepId,
              runId,
              stepIndex: step.stepIndex,
              agentId: step.agentId,
              agentName: step.agentName,
              input: step.input,
              output: step.output,
              success: step.success,
              error: step.error,
              duration: step.duration,
              createdAt: new Date().toISOString(),
            });
            send('step', { runId, step });
          }
        )
        .then((result) => {
          crewRunQueries.updateRun(runId, {
            status: result.success ? 'completed' : 'failed',
            completedAt: new Date().toISOString(),
            error: result.error,
          });
          send('complete', {
            runId,
            success: result.success,
            totalDuration: result.totalDuration,
            error: result.error,
          });
          safeClose();
        })
        .catch((error) => {
          crewRunQueries.updateRun(runId, {
            status: 'failed',
            completedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          send('error', {
            runId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          safeClose();
        });
    },
    cancel() {
      // client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
