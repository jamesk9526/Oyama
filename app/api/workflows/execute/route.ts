import { NextRequest, NextResponse } from 'next/server';
import { WorkflowExecutor } from '@/lib/workflows/executor';
import { agentQueries, attachmentQueries } from '@/lib/db/queries';
import fs from 'fs';
import path from 'path';
import type { WorkflowDefinition } from '@/lib/workflows/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crewId, crewName, workflow, input, options, attachmentIds = [], rounds = 1 } = body;

    // Validate required fields
    if (!crewId || !crewName || !workflow || !input || !options) {
      return NextResponse.json(
        { error: 'Missing required fields: crewId, crewName, workflow, input, options' },
        { status: 400 }
      );
    }

    // Validate workflow
    if (!workflow.type || !workflow.steps || !Array.isArray(workflow.steps)) {
      return NextResponse.json(
        { error: 'Invalid workflow definition' },
        { status: 400 }
      );
    }

    // Validate options
    if (!options.ollamaUrl || !options.model) {
      return NextResponse.json(
        { error: 'Missing required options: ollamaUrl, model' },
        { status: 400 }
      );
    }

    // Load all agents from database
    const agents = agentQueries.getAll();

    // Verify all agents in workflow exist
    const agentIds = workflow.steps.map((step: any) => step.agentId);
    const missingAgents = agentIds.filter(
      (id: string) => !agents.find((a) => a.id === id)
    );

    if (missingAgents.length > 0) {
      return NextResponse.json(
        { error: `Agents not found: ${missingAgents.join(', ')}` },
        { status: 404 }
      );
    }

    // Create executor and run workflow
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

    const executor = new WorkflowExecutor(agents, options);
    const result = await executor.execute(
      crewId,
      crewName,
      expandedWorkflow,
      enrichedInput
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Workflow execution failed',
      },
      { status: 500 }
    );
  }
}
