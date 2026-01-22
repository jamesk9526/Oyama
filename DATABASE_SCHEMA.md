# Oyama Database Schema

This document describes the database schema for the Oyama AI Automation Studio.

## Database Engine

- **Engine**: SQLite (via better-sqlite3)
- **Location**: `.data/oyama.db` (development) or app data directory (production)
- **Initialization**: Automatic on first access via `getDatabase()`

## Core Tables

### agents

Stores AI agent definitions with their configurations.

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  systemPrompt TEXT,
  description TEXT,
  capabilities TEXT,  -- JSON array of capabilities
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

### templates

Stores reusable prompt templates.

```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT,  -- JSON array
  variables TEXT,  -- JSON array
  isFavorite INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

### crews

Stores multi-agent crew configurations (legacy workflow storage).

```sql
CREATE TABLE crews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  agentIds TEXT NOT NULL,  -- JSON array of agent IDs
  workflowType TEXT DEFAULT 'sequential',
  status TEXT DEFAULT 'idle',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

## Chat & Messaging Tables

### chats

Stores conversation threads.

```sql
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  agentId TEXT,
  model TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

### messages

Stores individual messages within chats.

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chatId TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
)
```

### memories

Stores long-term context and facts for memory retention.

```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  chatId TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'fact',
  importance INTEGER DEFAULT 5,
  keywords TEXT,  -- JSON array
  createdAt TEXT NOT NULL,
  lastAccessedAt TEXT,
  accessCount INTEGER DEFAULT 0
)
```

## Workflow Tables (New)

### workflows

Stores workflow definitions with stages and approval gates.

```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  stages TEXT NOT NULL,  -- JSON array of workflow stages
  workflowType TEXT DEFAULT 'sequential',  -- 'sequential' | 'parallel' | 'conditional'
  status TEXT DEFAULT 'draft',  -- 'draft' | 'planning' | 'executing' | 'paused' | 'completed' | 'failed'
  crewId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (crewId) REFERENCES crews(id) ON DELETE SET NULL
)
```

**Stages JSON Structure:**
```json
[
  {
    "id": "stage-1",
    "name": "Stage Name",
    "agentId": "agent-uuid",
    "status": "pending",
    "requiresApproval": false
  }
]
```

### workflow_states

Stores active execution state for running workflows.

```sql
CREATE TABLE workflow_states (
  id TEXT PRIMARY KEY,
  workflowId TEXT NOT NULL,
  crewId TEXT NOT NULL,
  crewName TEXT NOT NULL,
  workflowDefinition TEXT NOT NULL,  -- JSON serialized workflow definition
  status TEXT NOT NULL,  -- 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  currentStepIndex INTEGER NOT NULL,
  steps TEXT NOT NULL,  -- JSON array of completed step results
  startTime TEXT NOT NULL,
  endTime TEXT,
  pausedAt TEXT,
  resumedAt TEXT,
  error TEXT,
  context TEXT,  -- JSON object with workflow variables
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE
)
```

### workflow_approvals

Stores approval gate requests and decisions.

```sql
CREATE TABLE workflow_approvals (
  id TEXT PRIMARY KEY,
  workflowId TEXT NOT NULL,
  workflowStateId TEXT,
  stepIndex INTEGER NOT NULL,
  stepName TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'pending' | 'approved' | 'rejected'
  requestedAt TEXT NOT NULL,
  resolvedAt TEXT,
  resolvedBy TEXT,  -- User ID who made the decision
  comment TEXT,
  data TEXT,  -- JSON object with additional approval data
  FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (workflowStateId) REFERENCES workflow_states(id) ON DELETE CASCADE
)
```

### workflow_executions

Stores workflow execution history.

```sql
CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY,
  workflowId TEXT NOT NULL,
  workflowStateId TEXT,
  crewId TEXT NOT NULL,
  crewName TEXT NOT NULL,
  workflowType TEXT NOT NULL,
  initialInput TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'running' | 'completed' | 'failed'
  totalDuration INTEGER,  -- Duration in milliseconds
  startTime TEXT NOT NULL,
  endTime TEXT,
  error TEXT,
  FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (workflowStateId) REFERENCES workflow_states(id) ON DELETE SET NULL
)
```

### workflow_execution_steps

Stores individual step execution results within workflow runs.

```sql
CREATE TABLE workflow_execution_steps (
  id TEXT PRIMARY KEY,
  executionId TEXT NOT NULL,
  stepIndex INTEGER NOT NULL,
  agentId TEXT NOT NULL,
  agentName TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  success INTEGER NOT NULL,  -- 0 or 1 (boolean)
  error TEXT,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  duration INTEGER NOT NULL,  -- Duration in milliseconds
  FOREIGN KEY (executionId) REFERENCES workflow_executions(id) ON DELETE CASCADE
)
```

## Execution Tables

### crew_runs

Stores crew execution history.

```sql
CREATE TABLE crew_runs (
  id TEXT PRIMARY KEY,
  crewId TEXT NOT NULL,
  crewName TEXT NOT NULL,
  workflowType TEXT NOT NULL,
  input TEXT NOT NULL,
  status TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  temperature REAL,
  topP REAL,
  maxTokens INTEGER,
  startedAt TEXT NOT NULL,
  completedAt TEXT,
  error TEXT
)
```

### crew_run_steps

Stores individual step results within crew runs.

```sql
CREATE TABLE crew_run_steps (
  id TEXT PRIMARY KEY,
  runId TEXT NOT NULL,
  stepIndex INTEGER NOT NULL,
  agentId TEXT NOT NULL,
  agentName TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  success INTEGER NOT NULL,
  error TEXT,
  duration INTEGER NOT NULL,
  createdAt TEXT NOT NULL
)
```

## Supporting Tables

### settings

Key-value store for application settings.

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

### attachments

Stores file attachments linked to various scopes.

```sql
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  scopeType TEXT NOT NULL,  -- 'crew' | 'chat' | 'workflow' etc.
  scopeId TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  mime TEXT,
  size INTEGER,
  createdAt TEXT NOT NULL
)
```

### tool_logs

Stores logs of tool executions for debugging and auditing.

```sql
CREATE TABLE tool_logs (
  id TEXT PRIMARY KEY,
  toolId TEXT NOT NULL,
  toolName TEXT NOT NULL,
  chatId TEXT,
  agentId TEXT,
  inputs TEXT NOT NULL,  -- JSON object
  outputs TEXT,  -- JSON object
  status TEXT NOT NULL,  -- 'success' | 'error' | 'pending'
  error TEXT,
  duration INTEGER,
  timestamp TEXT NOT NULL
)
```

## Indexes

Performance indexes for common queries:

```sql
-- Workflow indexes
CREATE INDEX idx_workflow_states_status ON workflow_states(status);
CREATE INDEX idx_workflow_states_workflow_id ON workflow_states(workflowId);
CREATE INDEX idx_workflow_approvals_status ON workflow_approvals(status);
CREATE INDEX idx_workflow_approvals_workflow_id ON workflow_approvals(workflowId);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflowId);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);

-- Other indexes
CREATE INDEX idx_crew_runs_crew_id ON crew_runs(crewId);
CREATE INDEX idx_messages_chat_id ON messages(chatId);
CREATE INDEX idx_memories_chat_id ON memories(chatId);
```

## Data Types

- **TEXT**: Used for all string data including IDs, names, descriptions, JSON
- **INTEGER**: Used for counts, flags (0/1 for boolean), and durations in milliseconds
- **REAL**: Used for floating-point numbers like temperature and topP

## JSON Fields

Several fields store JSON-serialized data:

| Field | Table | Structure |
|-------|-------|-----------|
| `capabilities` | agents | `string[]` - Array of capability names |
| `tags` | templates | `string[]` - Array of tag strings |
| `variables` | templates | `string[]` - Array of variable names |
| `agentIds` | crews | `string[]` - Array of agent IDs |
| `stages` | workflows | `WorkflowStage[]` - Array of stage objects |
| `workflowDefinition` | workflow_states | `WorkflowDefinition` - Complete workflow config |
| `steps` | workflow_states | `WorkflowStepResult[]` - Array of step results |
| `context` | workflow_states | `Record<string, unknown>` - Key-value pairs |
| `data` | workflow_approvals | `Record<string, unknown>` - Approval metadata |
| `inputs` | tool_logs | `Record<string, any>` - Tool input parameters |
| `outputs` | tool_logs | `any` - Tool output data |

## Migration Strategy

The database uses automatic initialization on first access. Existing databases are migrated using column checks (`ensureColumn()` helper) to add new columns without breaking existing data.

## Query Interfaces

All database operations are performed through typed query modules in `lib/db/queries.ts`:

- `agentQueries` - Agent CRUD operations
- `templateQueries` - Template CRUD operations
- `crewQueries` - Crew CRUD operations
- `workflowQueries` - Workflow CRUD operations
- `workflowStateQueries` - Workflow state management
- `workflowApprovalQueries` - Approval gate operations
- `workflowExecutionQueries` - Execution history
- `chatQueries` - Chat management
- `messageQueries` - Message operations
- `memoryQueries` - Memory storage and retrieval
- `settingsQueries` - Settings key-value store
- `attachmentQueries` - File attachment management
- `crewRunQueries` - Crew run history
- `toolLogsDb` - Tool execution logging

## Best Practices

1. **Always use ISO 8601 format** for timestamp fields (e.g., `new Date().toISOString()`)
2. **Serialize JSON fields** using `JSON.stringify()` before storing
3. **Parse JSON fields** using `JSON.parse()` when reading
4. **Use transactions** for multi-table operations (via better-sqlite3)
5. **Check table existence** before querying with `hasTable()` helper
6. **Handle migration gracefully** by checking for column existence before accessing
