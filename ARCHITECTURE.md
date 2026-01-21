# Oyama - System Architecture

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [Agent System](#agent-system)
9. [Workflow Engine](#workflow-engine)
10. [Security Considerations](#security-considerations)

## Overview

Oyama is a local-first AI agent collaboration platform built with Next.js 14. It provides a comprehensive framework for building, customizing, and orchestrating AI agents with multi-agent workflows, advanced prompt engineering, and a modern interface.

### Key Design Principles

- **Local-First**: All data stored locally in SQLite, no external dependencies required
- **Privacy-Focused**: User data never leaves the local machine
- **Provider-Agnostic**: Support for multiple LLM providers (Ollama, OpenAI-compatible APIs)
- **Modular**: Clean separation of concerns with pluggable components
- **Type-Safe**: Full TypeScript coverage for reliability

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 5.0
- **Type System**: TypeScript 5
- **Icons**: Lucide React
- **Markdown**: react-markdown with remark-gfm, rehype-highlight

### Backend
- **Runtime**: Node.js 20+
- **Database**: SQLite with better-sqlite3
- **API Routes**: Next.js API Routes (App Router)
- **Streaming**: Server-Sent Events (SSE)
- **Code Execution**: Worker Threads with VM sandbox

### Desktop
- **Framework**: Electron 40
- **Builder**: electron-builder
- **IPC**: Electron's contextBridge

### LLM Integration
- **Primary**: Ollama (local models)
- **Secondary**: OpenAI-compatible APIs
- **Streaming**: Native streaming support via SSE

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Oyama Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │   Desktop    │  │     CLI      │      │
│  │   (Next.js)  │  │   (Electron) │  │   (Future)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │              Application Layer                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │    │
│  │  │  React   │ │  Zustand │ │   UI     │ │ Router │ │    │
│  │  │Components│ │  Stores  │ │Components│ │ (App)  │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │    │
│  └────────────────────────┬─────────────────────────────┘   │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │              Business Logic Layer                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │    │
│  │  │  Agent   │ │ Workflow │ │ Prompt   │ │Template│ │    │
│  │  │  System  │ │  Engine  │ │Composer  │ │ Engine │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │    │
│  └────────────────────────┬─────────────────────────────┘   │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │              Data Access Layer                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │    │
│  │  │ Database │ │  Cache   │ │  File    │ │  API   │ │    │
│  │  │ Queries  │ │  Layer   │ │  System  │ │ Client │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │    │
│  └────────────────────────┬─────────────────────────────┘   │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │              Infrastructure Layer                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │    │
│  │  │  SQLite  │ │  Ollama  │ │  Worker  │ │  IPC   │ │    │
│  │  │    DB    │ │   API    │ │ Threads  │ │(Elect) │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │    │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Agent System (`lib/agents/`)

The agent system is the core of Oyama. Each agent is a specialized AI assistant with:

- **Identity**: Name, role, bio, icon
- **Behavior**: System prompt, style rules, capabilities
- **Configuration**: Model, provider, parameters
- **State**: Version, timestamps, metadata

**Key Files**:
- `lib/agents/store.ts` - Agent state management
- `components/agents/AgentCard.tsx` - Agent UI component
- `components/agents/AgentBuilder.tsx` - Agent creation/editing

### 2. Workflow Engine (`lib/workflows/`)

Orchestrates multi-agent collaboration with multiple workflow types:

- **Sequential**: Agents process in order, output flows to next
- **Parallel**: All agents process simultaneously
- **Conditional**: Agents execute based on conditions
- **Round-Robin**: Sequential processing with multiple iterations

**Key Files**:
- `lib/workflows/executor.ts` - Core workflow execution engine
- `lib/workflows/types.ts` - Workflow type definitions
- `app/api/workflows/execute/route.ts` - Workflow API endpoint

### 3. Prompt Composition (`lib/prompts/`)

Hierarchical prompt system with multiple layers:

1. **Global System Prompt**: Base instructions for all interactions
2. **Workspace Prompt**: Workspace-specific additions
3. **Agent Prompt**: Agent-specific behavior
4. **Chat Prompt**: Conversation-specific overrides

**Key Files**:
- `lib/prompts/composer.ts` - Prompt composition logic
- `lib/prompts/hierarchy.ts` - Hierarchy resolution

### 4. Template Engine (`lib/templates/`)

Reusable prompt templates with variable interpolation:

- **Variables**: Typed placeholders (string, number, boolean, text)
- **Interpolation**: Safe variable substitution
- **Categories**: Organized by use case
- **Favorites**: Quick access to commonly used templates

**Key Files**:
- `lib/templates/store.ts` - Template state management
- `components/templates/TemplateCard.tsx` - Template UI component
- `components/templates/TemplateEditor.tsx` - Template creation/editing

### 5. Chat System (`app/chats/`)

Interactive conversation interface with streaming support:

- **Message History**: Persistent chat storage
- **Streaming Responses**: Real-time SSE streaming
- **Markdown Rendering**: Full GFM support with syntax highlighting
- **Code Execution**: Sandboxed JavaScript/TypeScript execution

**Key Files**:
- `app/chats/page.tsx` - Main chat interface
- `components/chat/ChatMessage.tsx` - Message rendering
- `components/chat/FloatingToolbar.tsx` - Agent/model selector
- `app/api/chat/route.ts` - Chat API endpoint

### 6. Provider System (`lib/providers/`)

Abstraction layer for multiple LLM providers:

- **Ollama**: Local model support
- **OpenAI**: Cloud-based models
- **Generic**: Any OpenAI-compatible API

**Key Files**:
- `lib/providers/ollama.ts` - Ollama integration
- `lib/providers/openai.ts` - OpenAI integration
- `lib/providers/types.ts` - Provider interfaces

### 7. Database Layer (`lib/db/`)

SQLite-based persistence with type-safe queries:

- **Schema**: Normalized relational schema
- **Migrations**: Version-controlled schema changes
- **Queries**: Type-safe query builders
- **Transactions**: ACID compliance

**Key Files**:
- `lib/db/client.ts` - Database connection management
- `lib/db/queries.ts` - Query implementations
- `lib/db/schema.sql` - Database schema definition

## Data Flow

### Chat Message Flow

```
User Input
    │
    ▼
┌─────────────────┐
│  Chat Interface │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Route     │ /api/chat
│  (POST)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Prompt Composer │ Combines: Global + Workspace + Agent + Message
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Provider Client │ Ollama / OpenAI
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Streaming SSE  │ Server-Sent Events
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Chat Interface │ Render markdown, syntax highlighting
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database Save  │ Persist message
└─────────────────┘
```

### Crew Workflow Flow

```
User Defines Task
    │
    ▼
┌─────────────────┐
│  Crew Interface │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Route     │ /api/workflows/execute
│  (POST)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Workflow Engine │ Parse workflow type and agents
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │         │
    ▼         ▼
Sequential  Parallel
    │         │
    ▼         ▼
┌─────────────────┐
│  Agent Executor │ For each agent
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Provider Client │ Get agent response
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Output Aggregator│ Combine results
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database Save  │ Persist run results
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Return Results │ Display in UI
└─────────────────┘
```

## Database Schema

### Core Tables

#### agents
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  system_prompt TEXT,
  bio TEXT,
  style_rules TEXT,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  capabilities TEXT, -- JSON array
  color_tag TEXT,
  icon TEXT,
  workspace_id TEXT,
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### templates
```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT, -- JSON array
  body TEXT NOT NULL,
  variables TEXT, -- JSON array
  system_additions TEXT,
  examples TEXT, -- JSON array
  output_schema TEXT,
  workspace_id TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### crews
```sql
CREATE TABLE crews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL, -- sequential, parallel, conditional, round_robin
  agents TEXT, -- JSON array of agent IDs (deprecated)
  config TEXT, -- JSON workflow config
  workspace_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### crew_agents
```sql
CREATE TABLE crew_agents (
  crew_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  PRIMARY KEY (crew_id, agent_id)
);
```

#### chats
```sql
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  workspace_id TEXT,
  agent_id TEXT,
  crew_id TEXT,
  system_prompt_overrides TEXT,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
  FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE SET NULL
);
```

#### messages
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
```

#### runs
```sql
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  crew_id TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed'
  steps TEXT, -- JSON array of step results
  error TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE CASCADE
);
```

### Relationship Diagram

```
workspaces
    │
    ├── agents ────┐
    │              │
    ├── templates  │
    │              │
    └── crews ─────┤
         │         │
         └─────────┼─── crew_agents (junction table)
                   │
chats ─────────────┤
  │                │
  └── messages     │
                   │
runs ──────────────┘
```

## API Architecture

### REST API Structure

```
/api
├── agents
│   ├── GET     - List all agents
│   ├── POST    - Create agent
│   ├── [id]
│   │   ├── GET     - Get agent by ID
│   │   ├── PUT     - Update agent
│   │   └── DELETE  - Delete agent
│   ├── clone
│   │   └── POST    - Clone agent
│   └── metrics
│       └── GET     - Get agent metrics
├── templates
│   ├── GET     - List all templates
│   ├── POST    - Create template
│   └── [id]
│       ├── GET     - Get template by ID
│       ├── PUT     - Update template
│       ├── DELETE  - Delete template
│       ├── clone
│       │   └── POST    - Clone template
│       └── interpolate
│           └── POST    - Interpolate variables
├── crews
│   ├── GET     - List all crews
│   ├── POST    - Create crew
│   ├── [id]
│   │   ├── GET     - Get crew by ID
│   │   ├── PUT     - Update crew
│   │   └── DELETE  - Delete crew
│   ├── clone
│   │   └── POST    - Clone crew
│   ├── metrics
│   │   └── GET     - Get crew metrics
│   └── runs
│       ├── GET     - List all runs
│       └── [id]
│           ├── GET     - Get run by ID
│           └── DELETE  - Delete run
├── chats
│   ├── GET     - List all chats
│   ├── POST    - Create chat
│   └── [id]
│       ├── GET     - Get chat by ID
│       ├── PUT     - Update chat
│       └── DELETE  - Delete chat
├── messages
│   ├── GET     - List messages (by chatId)
│   ├── POST    - Create message
│   └── DELETE  - Delete messages (by chatId)
├── chat
│   └── POST    - Send chat message (streaming)
├── workflows
│   └── execute
│       └── POST    - Execute workflow
├── execute
│   └── POST    - Execute code
└── settings
    ├── GET     - Get settings
    └── PUT     - Update settings
```

### API Response Format

All API responses follow a consistent format:

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Streaming API

The chat API supports Server-Sent Events (SSE) for real-time streaming:

```javascript
// Client
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, agentId })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Process chunk
}
```

## Agent System

### Agent Lifecycle

```
Creation → Configuration → Activation → Execution → Feedback → Improvement
    │           │              │            │           │            │
    ▼           ▼              ▼            ▼           ▼            ▼
 Define     Set prompt      Ready for   Process     Collect      Update
  role     capabilities      use        requests    metrics      prompt
```

### Agent Capabilities

Agents can have the following capabilities:

- **web**: Web search and scraping
- **files**: File system operations
- **code**: Code generation and execution
- **image**: Image generation and analysis

### Agent Roles

Oyama includes 17 predefined agent roles:

1. **Planner** - Strategic planning and roadmaps
2. **Researcher** - Information gathering and research
3. **Writer** - Content creation
4. **Editor** - Content review and improvement
5. **Critic** - Critical analysis
6. **Coder** - Code writing and review
7. **QA** - Quality assurance and testing
8. **Summarizer** - Information distillation
9. **Synthesizer** - Multi-source information synthesis
10. **Debugger** - Issue investigation and fixing
11. **Analyst** - Data analysis and insights
12. **DevOps** - Infrastructure and deployment
13. **Security** - Security assessment
14. **Designer** - UX/UI design
15. **Backend** - Backend service development
16. **Product** - Product management
17. **Custom** - User-defined behavior

### Agent Configuration

Each agent has the following configuration options:

```typescript
interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  bio?: string;
  styleRules?: string;
  model: string;
  provider: string;
  capabilities: AgentCapability[];
  colorTag?: string;
  icon?: string;
  workspaceId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

## Workflow Engine

### Workflow Types

#### 1. Sequential Workflow
Agents process in order, passing output to the next agent.

```
Input → Agent 1 → Agent 2 → Agent 3 → Output
```

#### 2. Parallel Workflow
All agents process simultaneously with the same input.

```
        ┌─ Agent 1 ─┐
Input ──┼─ Agent 2 ─┼─→ Aggregated Output
        └─ Agent 3 ─┘
```

#### 3. Conditional Workflow
Agents execute based on conditions.

```
Input → Condition?
         │
         ├─ True → Agent 1 → Output
         │
         └─ False → Agent 2 → Output
```

#### 4. Round-Robin Workflow
Sequential processing with multiple iterations.

```
Round 1: Input → Agent 1 → Agent 2 → Agent 3
Round 2: Output → Agent 1 → Agent 2 → Agent 3
Round N: Output → Agent 1 → Agent 2 → Agent 3 → Final Output
```

### Execution Context

Each workflow execution has:

```typescript
interface WorkflowExecutionResult {
  success: boolean;
  steps: WorkflowStepResult[];
  finalOutput: string;
  error?: string;
  duration: number;
}

interface WorkflowStepResult {
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  error?: string;
  duration: number;
  timestamp: string;
}
```

## Security Considerations

### Code Execution Sandbox

Oyama includes a sandboxed code execution environment:

- **Worker Threads**: Isolated execution context
- **VM Module**: Additional sandboxing via Node's VM
- **Timeout**: 5-second execution limit
- **No Network**: Network access disabled
- **No File System**: File system access disabled
- **No Process**: Process manipulation disabled
- **Limited Modules**: Only safe built-in modules allowed

### Data Security

- **Local Storage**: All data stored locally in SQLite
- **No Telemetry**: No usage data sent to external servers
- **API Keys**: Stored locally, never transmitted
- **Sandboxed Execution**: Code runs in isolated environment

### Input Validation

- **Type Validation**: Zod schemas for all inputs
- **Sanitization**: User input sanitized before processing
- **SQL Injection Prevention**: Prepared statements only
- **XSS Prevention**: React's built-in escaping

## Performance Considerations

### Database Optimization

- **Indexes**: Appropriate indexes on frequently queried columns
- **Prepared Statements**: Statement caching for performance
- **Connection Pooling**: Single connection with transaction support
- **Batch Operations**: Bulk inserts for efficiency

### Frontend Optimization

- **Code Splitting**: Dynamic imports for large components
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Virtualization**: Virtual scrolling for large lists (planned)

### Streaming

- **Server-Sent Events**: Efficient real-time updates
- **Chunked Responses**: Progressive rendering
- **Backpressure**: Flow control for large responses

## Extension Points

### 1. Provider Integration

Add new LLM providers by implementing the `Provider` interface:

```typescript
interface Provider {
  name: string;
  chat(params: ChatParams): Promise<ChatResponse>;
  chatStream(params: ChatParams): AsyncGenerator<string>;
}
```

### 2. Workflow Types

Add new workflow types by extending the `WorkflowExecutor`:

```typescript
class CustomWorkflow extends WorkflowExecutor {
  async execute(config: WorkflowConfig): Promise<WorkflowResult> {
    // Custom execution logic
  }
}
```

### 3. Agent Capabilities

Add new capabilities by extending the agent configuration and implementing handlers.

### 4. Template Functions

Add custom template functions for advanced interpolation.

## Future Enhancements

### Planned Features

1. **Plugin System**: Third-party plugin support
2. **Multi-User**: Collaboration and sharing
3. **Cloud Sync**: Optional cloud backup
4. **Advanced Analytics**: Usage metrics and insights
5. **Agent Marketplace**: Share and discover agents
6. **Webhook Support**: External integrations
7. **API Gateway**: RESTful API for external access
8. **Mobile App**: iOS and Android clients
9. **Voice Interface**: Voice input/output
10. **Visual Workflow Builder**: Drag-and-drop workflow creation

### Architecture Evolution

As the platform grows, consider:

- **Microservices**: Split into independent services
- **Event-Driven**: Event bus for decoupled communication
- **CQRS**: Separate read/write models
- **GraphQL**: Alternative to REST API
- **Real-time**: WebSocket support for real-time features

## Troubleshooting

### Common Issues

1. **Database Locked**: Ensure only one instance accessing DB
2. **Build Errors**: Run `npm install` and verify Node version
3. **Ollama Connection**: Check Ollama service is running
4. **Memory Issues**: Increase Node memory with `--max-old-space-size`

### Debug Mode

Enable debug logging:

```javascript
// Set in .env.local
DEBUG=oyama:*
LOG_LEVEL=debug
```

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup and contribution guidelines.

## License

See [LICENSE](./LICENSE) for license information.
