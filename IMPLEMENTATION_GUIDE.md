# MCP Tools Server Backend & Workflow Execution Engine - Implementation Guide

This document provides guidance on using the newly implemented features.

## MCP Tools Server Backend

### 1. Tool Discovery and Indexing

The tool discovery system provides powerful search and indexing capabilities for finding tools.

#### Usage Example:

```typescript
import { toolDiscovery } from '@/lib/mcp';

// Search for tools by keywords
const results = toolDiscovery.search({
  keywords: ['calculator', 'math'],
  categories: ['data'],
  enabled: true
});

// Discover tools by capability
const tools = toolDiscovery.discoverByCapability('calculation');

// Get related tools
const related = toolDiscovery.getRelatedTools('tool-id', 5);

// Get statistics
const stats = toolDiscovery.getStatistics();
```

#### API Endpoint:

```
GET /api/tools/discover?action=search&keywords=calculator&enabled=true
GET /api/tools/discover?action=byCapability&capability=calculation
GET /api/tools/discover?action=related&toolId=tool-echo&limit=5
GET /api/tools/discover?action=statistics
POST /api/tools/discover { "action": "refreshIndex" }
```

### 2. LAN-Based Tool Sharing

Share and discover tools across your local network.

#### Usage Example:

```typescript
import { lanToolSharing } from '@/lib/mcp';

// Configure LAN sharing
lanToolSharing.configure({
  enabled: true,
  port: 8765,
  broadcast: true,
  advertiseInterval: 30000,
  discoveryInterval: 60000
});

// Start the service
await lanToolSharing.start();

// Get discovered servers
const servers = lanToolSharing.getServers(true); // online only

// Get all tools from LAN
const lanTools = lanToolSharing.getAllLANTools();

// Execute remote tool
const result = await lanToolSharing.executeRemoteTool(
  serverId,
  toolId,
  inputs
);

// Stop the service
lanToolSharing.stop();
```

## Workflow Execution Engine

### 1. Approval Gate System

Implement human-in-the-loop approval for staged automation.

#### Usage Example:

```typescript
import { approvalGateManager } from '@/lib/workflows';

// Request approval
const decision = await approvalGateManager.requestApproval(workflowId, {
  stepIndex: 2,
  stepName: 'Deploy to Production',
  data: { environment: 'production' },
  timeout: 300000 // 5 minutes
});

// Get pending approvals
const pending = approvalGateManager.getPendingApprovals(workflowId);

// Provide approval decision
await approvalGateManager.provideDecision(gateId, {
  approved: true,
  comment: 'Looks good to deploy',
  userId: 'user-123'
});

// Cancel approval
approvalGateManager.cancelApproval(gateId);
```

#### API Endpoints:

```
GET /api/workflows/approvals?workflowId=workflow-123
POST /api/workflows/approvals { "gateId": "gate-id", "decision": { "approved": true } }
DELETE /api/workflows/approvals?gateId=gate-id
```

### 2. Workflow State Management

Persist and manage workflow execution state.

#### Usage Example:

```typescript
import { workflowStateManager } from '@/lib/workflows';

// Create workflow state
const state = workflowStateManager.createState(
  workflowId,
  crewId,
  crewName,
  workflowDefinition,
  initialInput
);

// Update status
workflowStateManager.updateStatus(workflowId, 'running');

// Pause/Resume
workflowStateManager.pauseWorkflow(workflowId);
workflowStateManager.resumeWorkflow(workflowId);

// Update context
workflowStateManager.updateContext(workflowId, {
  currentIteration: 2,
  processedItems: 150
});

// Add step result
workflowStateManager.addStepResult(workflowId, stepResult);

// Get state with snapshots
const state = workflowStateManager.getState(workflowId);
const snapshots = workflowStateManager.getSnapshots(workflowId);

// List states
const runningWorkflows = workflowStateManager.listStates({ 
  status: 'running' 
});

// Cleanup old workflows
const cleaned = workflowStateManager.cleanupOldWorkflows(
  7 * 24 * 60 * 60 * 1000 // 7 days
);
```

#### API Endpoints:

```
GET /api/workflows/state?workflowId=workflow-123&includeSnapshots=true
GET /api/workflows/state?status=running&crewId=crew-123
PATCH /api/workflows/state { "workflowId": "w-123", "action": "pause" }
PATCH /api/workflows/state { "workflowId": "w-123", "action": "updateContext", "data": {...} }
DELETE /api/workflows/state?workflowId=workflow-123
```

### 3. Rollback and Error Recovery

Recover from errors and rollback workflows to previous states.

#### Usage Example:

```typescript
import { rollbackManager } from '@/lib/workflows';

// Rollback to specific step
const state = await rollbackManager.rollbackToStep(workflowId, targetStepIndex);

// Rollback to last successful step
const state = await rollbackManager.rollbackToLastSuccess(workflowId);

// Recover from error with retry strategy
const recovery = await rollbackManager.recoverFromError(
  workflowId,
  failedStep,
  {
    type: 'retry',
    maxRetries: 3,
    retryDelay: 5000
  }
);

// Recover with skip strategy
const recovery = await rollbackManager.recoverFromError(
  workflowId,
  failedStep,
  { type: 'skip' }
);

// Recover with rollback strategy
const recovery = await rollbackManager.recoverFromError(
  workflowId,
  failedStep,
  {
    type: 'rollback',
    rollbackSteps: 2
  }
);

// Get compensation actions
const actions = await rollbackManager.getCompensationActions(
  workflowId,
  fromStepIndex,
  toStepIndex
);

// Clear retry counters
rollbackManager.clearRetryCounters(workflowId);
```

#### API Endpoints:

```
POST /api/workflows/rollback { "workflowId": "w-123", "action": "rollbackToStep", "targetStepIndex": 2 }
POST /api/workflows/rollback { "workflowId": "w-123", "action": "rollbackToLastSuccess" }
POST /api/workflows/rollback { "workflowId": "w-123", "action": "recoverFromError", "failedStep": {...}, "recoveryStrategy": {...} }
GET /api/workflows/rollback?workflowId=w-123&fromStepIndex=5&toStepIndex=2
```

## Features Summary

### MCP Tools Server Backend ✅
- ✅ MCP protocol implementation (JSON-RPC 2.0)
- ✅ Tool registration system with validation
- ✅ Tool execution engine with timeout/retry
- ✅ Tool discovery and indexing system
- ✅ LAN-based tool sharing (mDNS-ready)

### Workflow Execution Engine ✅
- ✅ Approval gate implementation
- ✅ Stage execution orchestration (pause/resume)
- ✅ Conditional branching logic
- ✅ Workflow state persistence
- ✅ Rollback and error recovery

## Next Steps

1. **Integration Testing**: Test the complete workflow with approval gates
2. **Performance Testing**: Test with large numbers of tools and workflows
3. **Security Review**: Ensure proper authorization for workflow operations
4. **Documentation**: Add JSDoc comments and API documentation
5. **UI Integration**: Connect the backend features to the UI components

## Notes

- All new features use singleton patterns for global state management
- State is currently in-memory; consider adding database persistence for production
- LAN tool sharing uses placeholder implementation; integrate real mDNS library for production
- Approval gates use promise-based waiting; consider adding WebSocket for real-time updates
