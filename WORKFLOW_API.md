# Workflow API Documentation

This document describes the API endpoints for managing workflows in Oyama.

## Overview

Workflows are multi-stage automation pipelines with support for:
- Sequential, parallel, and conditional execution
- Human approval gates between stages
- State persistence and recovery
- Rollback and error recovery
- Execution history tracking

## Base URL

All workflow endpoints are prefixed with `/api/workflows`

## Endpoints

### List Workflows

Get all workflows in the system.

**GET** `/api/workflows`

**Response:**
```json
{
  "workflows": [
    {
      "id": "uuid",
      "name": "Workflow Name",
      "description": "Workflow description",
      "stages": [
        {
          "id": "stage-1",
          "name": "Stage Name",
          "agentId": "agent-uuid",
          "status": "pending",
          "requiresApproval": false
        }
      ],
      "workflowType": "sequential",
      "status": "draft",
      "crewId": "crew-uuid",
      "createdAt": "2026-01-22T19:00:00.000Z",
      "updatedAt": "2026-01-22T19:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Create Workflow

Create a new workflow.

**POST** `/api/workflows`

**Request Body:**
```json
{
  "name": "My Workflow",
  "description": "Optional description",
  "workflowType": "sequential",
  "crewId": "optional-crew-uuid",
  "stages": [
    {
      "name": "Stage 1",
      "agentId": "agent-uuid",
      "requiresApproval": false
    },
    {
      "name": "Stage 2",
      "agentId": "agent-uuid-2",
      "requiresApproval": true
    }
  ]
}
```

**Response:**
```json
{
  "workflow": {
    "id": "uuid",
    "name": "My Workflow",
    "description": "Optional description",
    "stages": [...],
    "workflowType": "sequential",
    "status": "draft",
    "createdAt": "2026-01-22T19:00:00.000Z",
    "updatedAt": "2026-01-22T19:00:00.000Z"
  }
}
```

### Get Workflow

Get a single workflow by ID.

**GET** `/api/workflows/:id`

**Response:**
```json
{
  "workflow": {
    "id": "uuid",
    "name": "My Workflow",
    ...
  }
}
```

### Update Workflow

Update an existing workflow.

**PUT** `/api/workflows/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "draft",
  "stages": [...]
}
```

**Response:**
```json
{
  "workflow": {...}
}
```

### Delete Workflow

Delete a workflow.

**DELETE** `/api/workflows/:id`

**Response:**
```json
{
  "success": true
}
```

## Workflow Execution

### Execute Workflow

Execute a workflow with the given input.

**POST** `/api/workflows/execute`

**Request Body:**
```json
{
  "crewId": "crew-uuid",
  "crewName": "Crew Name",
  "workflow": {
    "type": "sequential",
    "steps": [
      {
        "agentId": "agent-uuid",
        "input": "Optional custom input"
      }
    ]
  },
  "input": "Initial input for workflow",
  "options": {
    "ollamaUrl": "http://localhost:11434",
    "model": "llama2",
    "temperature": 0.7,
    "topP": 0.9,
    "maxTokens": 2000,
    "timeout": 30000
  },
  "attachmentIds": [],
  "rounds": 1
}
```

**Response:**
```json
{
  "crewId": "crew-uuid",
  "crewName": "Crew Name",
  "workflowType": "sequential",
  "steps": [
    {
      "stepIndex": 0,
      "agentId": "agent-uuid",
      "agentName": "Agent Name",
      "input": "Input text",
      "output": "Agent response",
      "success": true,
      "startTime": "2026-01-22T19:00:00.000Z",
      "endTime": "2026-01-22T19:00:05.000Z",
      "duration": 5000
    }
  ],
  "success": true,
  "totalDuration": 5000,
  "startTime": "2026-01-22T19:00:00.000Z",
  "endTime": "2026-01-22T19:00:05.000Z"
}
```

## Workflow State Management

### Get Workflow States

List all workflow states or get a specific state.

**GET** `/api/workflows/state`

**Query Parameters:**
- `workflowId` (optional) - Filter by workflow ID
- `status` (optional) - Filter by status: `pending`, `running`, `paused`, `completed`, `failed`
- `crewId` (optional) - Filter by crew ID
- `includeSnapshots` (optional) - Include state snapshots (only when `workflowId` is provided)

**Response (List):**
```json
{
  "states": [
    {
      "id": "state-uuid",
      "workflowId": "workflow-uuid",
      "crewId": "crew-uuid",
      "crewName": "Crew Name",
      "status": "running",
      "currentStepIndex": 1,
      ...
    }
  ],
  "count": 1
}
```

**Response (Single with Snapshots):**
```json
{
  "state": {...},
  "snapshots": [
    {
      "state": {...},
      "timestamp": "2026-01-22T19:00:00.000Z"
    }
  ]
}
```

### Update Workflow State

Perform state management actions on a workflow.

**PATCH** `/api/workflows/state`

**Request Body:**
```json
{
  "workflowId": "workflow-uuid",
  "action": "pause",
  "data": {}
}
```

**Actions:**
- `pause` - Pause a running workflow
- `resume` - Resume a paused workflow
- `updateContext` - Update workflow context (requires `data` field)
- `updateStatus` - Update workflow status (requires `data.status` field)

**Response:**
```json
{
  "success": true,
  "message": "Workflow paused"
}
```

### Delete Workflow State

Delete a workflow execution state.

**DELETE** `/api/workflows/state?workflowId=uuid`

**Response:**
```json
{
  "success": true,
  "message": "Workflow state deleted: uuid"
}
```

## Approval Gates

### Get Pending Approvals

Get all pending approval requests.

**GET** `/api/workflows/approvals?workflowId=uuid`

**Query Parameters:**
- `workflowId` (optional) - Filter by workflow ID

**Response:**
```json
{
  "approvals": [
    {
      "id": "approval-uuid",
      "workflowId": "workflow-uuid",
      "stepIndex": 1,
      "stepName": "Stage 2",
      "status": "pending",
      "requestedAt": "2026-01-22T19:00:00.000Z",
      "data": {}
    }
  ],
  "count": 1
}
```

### Provide Approval Decision

Approve or reject a pending approval.

**POST** `/api/workflows/approvals`

**Request Body:**
```json
{
  "gateId": "approval-uuid",
  "decision": {
    "approved": true,
    "comment": "Looks good",
    "userId": "user-id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Approval granted for gate approval-uuid"
}
```

### Cancel Approval

Cancel a pending approval or clear all approvals for a workflow.

**DELETE** `/api/workflows/approvals?gateId=uuid`

or

**DELETE** `/api/workflows/approvals?workflowId=uuid`

**Response:**
```json
{
  "success": true,
  "message": "Approval cancelled for gate uuid"
}
```

## Rollback & Recovery

### Rollback Workflow

Rollback a workflow to a previous step or recover from errors.

**POST** `/api/workflows/rollback`

**Request Body (Rollback to Step):**
```json
{
  "workflowId": "workflow-uuid",
  "action": "rollbackToStep",
  "targetStepIndex": 0
}
```

**Request Body (Rollback to Last Success):**
```json
{
  "workflowId": "workflow-uuid",
  "action": "rollbackToLastSuccess"
}
```

**Request Body (Recover from Error):**
```json
{
  "workflowId": "workflow-uuid",
  "action": "recoverFromError",
  "failedStep": {
    "stepIndex": 1,
    "agentId": "agent-uuid",
    "error": "Error message"
  },
  "recoveryStrategy": {
    "type": "retry",
    "maxRetries": 3,
    "retryDelay": 1000
  }
}
```

**Recovery Strategy Types:**
- `retry` - Retry the failed step (with `maxRetries` and `retryDelay`)
- `skip` - Skip the failed step and continue
- `rollback` - Rollback by N steps (with `rollbackSteps`)
- `manual` - Require manual intervention

**Response:**
```json
{
  "success": true,
  "message": "Workflow rolled back to step 0",
  "state": {...}
}
```

### Get Compensation Actions

Get compensation actions for rollback.

**GET** `/api/workflows/rollback?workflowId=uuid&fromStepIndex=2&toStepIndex=0`

**Response:**
```json
{
  "actions": [
    {
      "stepIndex": 2,
      "action": "compensate",
      "compensationData": {
        "originalOutput": "...",
        "originalInput": "..."
      }
    }
  ],
  "count": 1
}
```

## Workflow Types

### Sequential
Stages execute one after another, passing output to the next stage.

### Parallel
All stages execute simultaneously with the same input.

### Conditional
Stages execute based on conditions from previous step results.

## Workflow Status Values

- `draft` - Workflow is being designed
- `planning` - Workflow is being planned
- `executing` - Workflow is currently running
- `paused` - Workflow execution is paused
- `completed` - Workflow completed successfully
- `failed` - Workflow execution failed

## Stage Status Values

- `pending` - Stage has not started
- `executing` - Stage is currently running
- `approval_required` - Stage is waiting for approval
- `completed` - Stage completed successfully
- `failed` - Stage execution failed

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad request (missing or invalid parameters)
- `404` - Resource not found
- `500` - Internal server error

## Examples

### Creating and Executing a Sequential Workflow

1. **Create workflow:**
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Research Pipeline",
    "workflowType": "sequential",
    "stages": [
      {"name": "Research", "agentId": "agent-1", "requiresApproval": false},
      {"name": "Analysis", "agentId": "agent-2", "requiresApproval": true},
      {"name": "Report", "agentId": "agent-3", "requiresApproval": false}
    ]
  }'
```

2. **Execute workflow:**
```bash
curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "crewId": "crew-123",
    "crewName": "Research Crew",
    "workflow": {
      "type": "sequential",
      "steps": [
        {"agentId": "agent-1"},
        {"agentId": "agent-2"},
        {"agentId": "agent-3"}
      ]
    },
    "input": "Research topic: AI automation",
    "options": {
      "ollamaUrl": "http://localhost:11434",
      "model": "llama2"
    }
  }'
```

3. **Check for pending approvals:**
```bash
curl http://localhost:3000/api/workflows/approvals
```

4. **Approve a stage:**
```bash
curl -X POST http://localhost:3000/api/workflows/approvals \
  -H "Content-Type: application/json" \
  -d '{
    "gateId": "approval-uuid",
    "decision": {
      "approved": true,
      "comment": "Analysis looks good"
    }
  }'
```

### Monitoring Workflow State

```bash
# Get all running workflows
curl "http://localhost:3000/api/workflows/state?status=running"

# Get specific workflow state with snapshots
curl "http://localhost:3000/api/workflows/state?workflowId=uuid&includeSnapshots=true"

# Pause a workflow
curl -X PATCH http://localhost:3000/api/workflows/state \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "uuid",
    "action": "pause"
  }'
```

### Error Recovery

```bash
# Rollback to last successful step
curl -X POST http://localhost:3000/api/workflows/rollback \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "uuid",
    "action": "rollbackToLastSuccess"
  }'

# Retry failed step
curl -X POST http://localhost:3000/api/workflows/rollback \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "uuid",
    "action": "recoverFromError",
    "failedStep": {...},
    "recoveryStrategy": {
      "type": "retry",
      "maxRetries": 3
    }
  }'
```
