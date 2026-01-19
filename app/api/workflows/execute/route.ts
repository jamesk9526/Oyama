import { NextRequest, NextResponse } from 'next/server';
import { WorkflowExecutor } from '@/lib/workflows/executor';
import { agentQueries } from '@/lib/db/queries';
import type { WorkflowDefinition } from '@/lib/workflows/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crewId, crewName, workflow, input, options } = body;

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
    const executor = new WorkflowExecutor(agents, options);
    const result = await executor.execute(
      crewId,
      crewName,
      workflow as WorkflowDefinition,
      input
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
