#!/usr/bin/env ts-node
/**
 * Seed script for workflows
 * Creates sample workflows for testing and development
 */

import { getDatabase } from '../lib/db/client';
import { workflowQueries, agentQueries, type WorkflowRecord } from '../lib/db/queries';
import crypto from 'crypto';

async function seedWorkflows() {
  console.log('Starting workflow seeding...');

  // Get all agents to use in workflows
  const agents = agentQueries.getAll();
  
  if (agents.length === 0) {
    console.log('No agents found. Please seed agents first.');
    return;
  }

  console.log(`Found ${agents.length} agents`);

  // Create sample workflows
  const sampleWorkflows: Omit<WorkflowRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Research & Analysis Pipeline',
      description: 'Multi-stage research workflow with approval gates',
      stages: [
        {
          id: 'stage-1',
          name: 'Initial Research',
          agentId: agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: false,
        },
        {
          id: 'stage-2',
          name: 'Data Analysis',
          agentId: agents[1]?.id || agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: true,
        },
        {
          id: 'stage-3',
          name: 'Report Generation',
          agentId: agents[2]?.id || agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: false,
        },
      ],
      workflowType: 'sequential',
      status: 'draft',
    },
    {
      name: 'Parallel Processing Workflow',
      description: 'Process multiple tasks simultaneously',
      stages: [
        {
          id: 'stage-1',
          name: 'Task A',
          agentId: agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: false,
        },
        {
          id: 'stage-2',
          name: 'Task B',
          agentId: agents[1]?.id || agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: false,
        },
        {
          id: 'stage-3',
          name: 'Task C',
          agentId: agents[2]?.id || agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: false,
        },
      ],
      workflowType: 'parallel',
      status: 'draft',
    },
    {
      name: 'Conditional Decision Workflow',
      description: 'Workflow with conditional branching based on results',
      stages: [
        {
          id: 'stage-1',
          name: 'Initial Assessment',
          agentId: agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: false,
        },
        {
          id: 'stage-2',
          name: 'Decision Point',
          agentId: agents[1]?.id || agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: true,
        },
        {
          id: 'stage-3',
          name: 'Follow-up Action',
          agentId: agents[0]?.id || 'unknown',
          status: 'pending',
          requiresApproval: false,
        },
      ],
      workflowType: 'conditional',
      status: 'draft',
    },
  ];

  let created = 0;
  
  for (const workflowData of sampleWorkflows) {
    try {
      const workflow: WorkflowRecord = {
        ...workflowData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      workflowQueries.create(workflow);
      console.log(`✓ Created workflow: ${workflow.name}`);
      created++;
    } catch (error) {
      console.error(`✗ Failed to create workflow: ${workflowData.name}`, error);
    }
  }

  console.log(`\nSeeding complete: ${created}/${sampleWorkflows.length} workflows created`);
}

// Run the seed function
seedWorkflows()
  .then(() => {
    console.log('Workflow seeding finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Workflow seeding failed:', error);
    process.exit(1);
  });
