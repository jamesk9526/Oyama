# Oyama - API Reference

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Agents API](#agents-api)
4. [Templates API](#templates-api)
5. [Crews API](#crews-api)
6. [Chats API](#chats-api)
7. [Messages API](#messages-api)
8. [Workflows API](#workflows-api)
9. [Settings API](#settings-api)
10. [Code Execution API](#code-execution-api)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

## Overview

The Oyama API provides RESTful endpoints for managing AI agents, templates, crews, chats, and workflows. All endpoints return JSON responses and follow consistent patterns.

**Base URL**: `http://localhost:3000/api`

**Content-Type**: `application/json`

## Authentication

Currently, Oyama runs locally and does not require authentication. Future versions may include API key authentication for external access.

## Agents API

### List All Agents

Retrieve a list of all agents.

**Endpoint**: `GET /api/agents`

**Response**:
```json
{
  "agents": [
    {
      "id": "agent-123",
      "name": "Research Assistant",
      "role": "researcher",
      "systemPrompt": "You are a thorough research assistant...",
      "bio": "Specialized in academic research",
      "model": "llama2",
      "provider": "ollama",
      "capabilities": ["web", "files"],
      "colorTag": "#3b82f6",
      "icon": "🔍",
      "workspaceId": "workspace-1",
      "version": 1,
      "createdAt": "2026-01-21T10:00:00Z",
      "updatedAt": "2026-01-21T10:00:00Z"
    }
  ]
}
```

### Get Agent by ID

Retrieve a specific agent by ID.

**Endpoint**: `GET /api/agents/[id]`

**Parameters**:
- `id` (string, required): Agent ID

**Response**:
```json
{
  "agent": {
    "id": "agent-123",
    "name": "Research Assistant",
    "role": "researcher",
    "systemPrompt": "You are a thorough research assistant...",
    "model": "llama2",
    "provider": "ollama",
    "capabilities": ["web", "files"],
    "createdAt": "2026-01-21T10:00:00Z",
    "updatedAt": "2026-01-21T10:00:00Z"
  }
}
```

### Create Agent

Create a new agent.

**Endpoint**: `POST /api/agents`

**Request Body**:
```json
{
  "name": "Code Reviewer",
  "role": "coder",
  "systemPrompt": "You are an expert code reviewer...",
  "bio": "Reviews code for best practices",
  "model": "llama2",
  "provider": "ollama",
  "capabilities": ["code"],
  "colorTag": "#10b981",
  "icon": "💻"
}
```

**Response**:
```json
{
  "agent": {
    "id": "agent-456",
    "name": "Code Reviewer",
    "role": "coder",
    "systemPrompt": "You are an expert code reviewer...",
    "model": "llama2",
    "provider": "ollama",
    "capabilities": ["code"],
    "createdAt": "2026-01-21T11:00:00Z",
    "updatedAt": "2026-01-21T11:00:00Z"
  }
}
```

### Update Agent

Update an existing agent.

**Endpoint**: `PUT /api/agents/[id]`

**Parameters**:
- `id` (string, required): Agent ID

**Request Body** (partial update supported):
```json
{
  "name": "Senior Code Reviewer",
  "systemPrompt": "You are a senior code reviewer..."
}
```

**Response**:
```json
{
  "agent": {
    "id": "agent-456",
    "name": "Senior Code Reviewer",
    "role": "coder",
    "systemPrompt": "You are a senior code reviewer...",
    "updatedAt": "2026-01-21T12:00:00Z"
  }
}
```

### Delete Agent

Delete an agent.

**Endpoint**: `DELETE /api/agents/[id]`

**Parameters**:
- `id` (string, required): Agent ID

**Response**:
```json
{
  "success": true,
  "message": "Agent deleted successfully"
}
```

### Clone Agent

Create a copy of an existing agent.

**Endpoint**: `POST /api/agents/[id]/clone`

**Parameters**:
- `id` (string, required): Agent ID to clone

**Response**:
```json
{
  "agent": {
    "id": "agent-789",
    "name": "Code Reviewer (Copy)",
    "role": "coder",
    "systemPrompt": "You are an expert code reviewer...",
    "createdAt": "2026-01-21T13:00:00Z"
  }
}
```

### Get Agent Metrics

Retrieve usage metrics for agents.

**Endpoint**: `GET /api/agents/metrics`

**Response**:
```json
{
  "totalAgents": 15,
  "roleDistribution": {
    "researcher": 3,
    "coder": 5,
    "writer": 4,
    "planner": 2,
    "custom": 1
  },
  "averageResponseTime": 1250,
  "totalUses": 0
}
```

## Templates API

### List All Templates

Retrieve a list of all templates.

**Endpoint**: `GET /api/templates`

**Query Parameters**:
- `category` (string, optional): Filter by category
- `favorite` (boolean, optional): Filter favorites
- `search` (string, optional): Search by name/description

**Response**:
```json
{
  "templates": [
    {
      "id": "template-123",
      "name": "Meeting Summary",
      "description": "Summarize meeting notes",
      "category": "productivity",
      "tags": ["meeting", "summary"],
      "body": "Summarize the following meeting notes:\n\n{{notes}}",
      "variables": [
        {
          "name": "notes",
          "type": "text",
          "description": "Meeting notes to summarize",
          "required": true
        }
      ],
      "isFavorite": true,
      "createdAt": "2026-01-21T10:00:00Z",
      "updatedAt": "2026-01-21T10:00:00Z"
    }
  ]
}
```

### Get Template by ID

Retrieve a specific template.

**Endpoint**: `GET /api/templates/[id]`

**Parameters**:
- `id` (string, required): Template ID

**Response**:
```json
{
  "template": {
    "id": "template-123",
    "name": "Meeting Summary",
    "body": "Summarize the following meeting notes:\n\n{{notes}}",
    "variables": [...]
  }
}
```

### Create Template

Create a new template.

**Endpoint**: `POST /api/templates`

**Request Body**:
```json
{
  "name": "Email Response",
  "description": "Generate professional email responses",
  "category": "communication",
  "tags": ["email", "professional"],
  "body": "Write a professional response to:\n\n{{email}}\n\nTone: {{tone}}",
  "variables": [
    {
      "name": "email",
      "type": "text",
      "description": "Email to respond to",
      "required": true
    },
    {
      "name": "tone",
      "type": "string",
      "description": "Response tone (formal/casual)",
      "defaultValue": "formal",
      "required": false
    }
  ]
}
```

**Response**:
```json
{
  "template": {
    "id": "template-456",
    "name": "Email Response",
    "createdAt": "2026-01-21T11:00:00Z"
  }
}
```

### Update Template

Update an existing template.

**Endpoint**: `PUT /api/templates/[id]`

**Parameters**:
- `id` (string, required): Template ID

**Request Body** (partial update supported):
```json
{
  "name": "Professional Email Response",
  "isFavorite": true
}
```

### Delete Template

Delete a template.

**Endpoint**: `DELETE /api/templates/[id]`

**Parameters**:
- `id` (string, required): Template ID

**Response**:
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### Clone Template

Create a copy of an existing template.

**Endpoint**: `POST /api/templates/[id]/clone`

**Parameters**:
- `id` (string, required): Template ID to clone

**Response**:
```json
{
  "template": {
    "id": "template-789",
    "name": "Email Response (Copy)",
    "createdAt": "2026-01-21T12:00:00Z"
  }
}
```

### Interpolate Template

Process a template with variables.

**Endpoint**: `POST /api/templates/[id]/interpolate`

**Parameters**:
- `id` (string, required): Template ID

**Request Body**:
```json
{
  "variables": {
    "email": "Hi, I need help with...",
    "tone": "professional"
  }
}
```

**Response**:
```json
{
  "content": "Write a professional response to:\n\nHi, I need help with...\n\nTone: professional"
}
```

## Crews API

### List All Crews

Retrieve a list of all crews.

**Endpoint**: `GET /api/crews`

**Response**:
```json
{
  "crews": [
    {
      "id": "crew-123",
      "name": "Research Team",
      "description": "Multi-agent research workflow",
      "workflowType": "sequential",
      "agents": ["agent-1", "agent-2", "agent-3"],
      "config": {
        "rounds": 1,
        "timeout": 30000
      },
      "createdAt": "2026-01-21T10:00:00Z",
      "updatedAt": "2026-01-21T10:00:00Z"
    }
  ]
}
```

### Get Crew by ID

Retrieve a specific crew.

**Endpoint**: `GET /api/crews/[id]`

**Parameters**:
- `id` (string, required): Crew ID

**Response**:
```json
{
  "crew": {
    "id": "crew-123",
    "name": "Research Team",
    "workflowType": "sequential",
    "agents": ["agent-1", "agent-2", "agent-3"]
  }
}
```

### Create Crew

Create a new crew.

**Endpoint**: `POST /api/crews`

**Request Body**:
```json
{
  "name": "Content Creation Team",
  "description": "Parallel content generation",
  "workflowType": "parallel",
  "agents": ["agent-writer", "agent-editor", "agent-designer"],
  "config": {
    "timeout": 60000
  }
}
```

**Response**:
```json
{
  "crew": {
    "id": "crew-456",
    "name": "Content Creation Team",
    "workflowType": "parallel",
    "createdAt": "2026-01-21T11:00:00Z"
  }
}
```

### Update Crew

Update an existing crew.

**Endpoint**: `PUT /api/crews/[id]`

**Parameters**:
- `id` (string, required): Crew ID

**Request Body**:
```json
{
  "name": "Advanced Research Team",
  "agents": ["agent-1", "agent-2", "agent-3", "agent-4"]
}
```

### Delete Crew

Delete a crew.

**Endpoint**: `DELETE /api/crews/[id]`

**Parameters**:
- `id` (string, required): Crew ID

**Response**:
```json
{
  "success": true,
  "message": "Crew deleted successfully"
}
```

### Clone Crew

Create a copy of an existing crew.

**Endpoint**: `POST /api/crews/[id]/clone`

**Parameters**:
- `id` (string, required): Crew ID to clone

**Response**:
```json
{
  "crew": {
    "id": "crew-789",
    "name": "Research Team (Copy)",
    "createdAt": "2026-01-21T12:00:00Z"
  }
}
```

### Get Crew Metrics

Retrieve metrics for crew execution.

**Endpoint**: `GET /api/crews/metrics`

**Response**:
```json
{
  "totalCrews": 8,
  "totalRuns": 156,
  "averageSuccessRate": 0.94,
  "workflowDistribution": {
    "sequential": 3,
    "parallel": 2,
    "conditional": 2,
    "round_robin": 1
  }
}
```

### List Crew Runs

Retrieve execution history for crews.

**Endpoint**: `GET /api/crews/runs`

**Query Parameters**:
- `crewId` (string, optional): Filter by crew ID
- `status` (string, optional): Filter by status (pending/running/completed/failed)
- `limit` (number, optional): Limit number of results

**Response**:
```json
{
  "runs": [
    {
      "id": "run-123",
      "crewId": "crew-456",
      "input": "Analyze market trends",
      "output": "Market analysis complete...",
      "status": "completed",
      "steps": [
        {
          "agentId": "agent-1",
          "agentName": "Researcher",
          "input": "Analyze market trends",
          "output": "Research findings...",
          "duration": 1500,
          "timestamp": "2026-01-21T10:00:00Z"
        }
      ],
      "startedAt": "2026-01-21T10:00:00Z",
      "completedAt": "2026-01-21T10:00:05Z"
    }
  ]
}
```

### Get Run by ID

Retrieve a specific run.

**Endpoint**: `GET /api/crews/runs/[id]`

**Parameters**:
- `id` (string, required): Run ID

**Response**:
```json
{
  "run": {
    "id": "run-123",
    "crewId": "crew-456",
    "status": "completed",
    "steps": [...]
  }
}
```

### Delete Run

Delete a run record.

**Endpoint**: `DELETE /api/crews/runs/[id]`

**Parameters**:
- `id` (string, required): Run ID

**Response**:
```json
{
  "success": true,
  "message": "Run deleted successfully"
}
```

## Chats API

### List All Chats

Retrieve a list of all chats.

**Endpoint**: `GET /api/chats`

**Response**:
```json
{
  "chats": [
    {
      "id": "chat-123",
      "title": "Project Planning Discussion",
      "agentId": "agent-planner",
      "model": "llama2",
      "createdAt": "2026-01-21T10:00:00Z",
      "updatedAt": "2026-01-21T12:00:00Z"
    }
  ]
}
```

### Get Chat by ID

Retrieve a specific chat.

**Endpoint**: `GET /api/chats/[id]`

**Parameters**:
- `id` (string, required): Chat ID

**Response**:
```json
{
  "chat": {
    "id": "chat-123",
    "title": "Project Planning Discussion",
    "agentId": "agent-planner",
    "createdAt": "2026-01-21T10:00:00Z"
  }
}
```

### Create Chat

Create a new chat.

**Endpoint**: `POST /api/chats`

**Request Body**:
```json
{
  "title": "New Discussion",
  "agentId": "agent-123",
  "model": "llama2"
}
```

**Response**:
```json
{
  "chat": {
    "id": "chat-456",
    "title": "New Discussion",
    "createdAt": "2026-01-21T11:00:00Z"
  }
}
```

### Update Chat

Update an existing chat.

**Endpoint**: `PUT /api/chats/[id]`

**Parameters**:
- `id` (string, required): Chat ID

**Request Body**:
```json
{
  "title": "Updated Discussion Title"
}
```

### Delete Chat

Delete a chat and all its messages.

**Endpoint**: `DELETE /api/chats/[id]`

**Parameters**:
- `id` (string, required): Chat ID

**Response**:
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

### Send Chat Message

Send a message and get AI response (streaming supported).

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "message": "Explain quantum computing",
  "chatId": "chat-123",
  "agentId": "agent-researcher",
  "model": "llama2",
  "temperature": 0.7,
  "systemPrompt": "You are a helpful assistant"
}
```

**Response** (Streaming - Server-Sent Events):
```
data: {"chunk": "Quantum"}
data: {"chunk": " computing"}
data: {"chunk": " is..."}
data: {"done": true}
```

**Response** (Non-streaming):
```json
{
  "response": "Quantum computing is a revolutionary technology..."
}
```

## Messages API

### List Messages

Retrieve messages for a specific chat.

**Endpoint**: `GET /api/messages?chatId=chat-123`

**Query Parameters**:
- `chatId` (string, required): Chat ID

**Response**:
```json
{
  "messages": [
    {
      "id": "msg-1",
      "chatId": "chat-123",
      "role": "user",
      "content": "What is AI?",
      "createdAt": "2026-01-21T10:00:00Z"
    },
    {
      "id": "msg-2",
      "chatId": "chat-123",
      "role": "assistant",
      "content": "AI stands for Artificial Intelligence...",
      "createdAt": "2026-01-21T10:00:05Z"
    }
  ]
}
```

### Create Message

Create a new message.

**Endpoint**: `POST /api/messages`

**Request Body**:
```json
{
  "chatId": "chat-123",
  "role": "user",
  "content": "Tell me more"
}
```

**Response**:
```json
{
  "message": {
    "id": "msg-3",
    "chatId": "chat-123",
    "role": "user",
    "content": "Tell me more",
    "createdAt": "2026-01-21T10:01:00Z"
  }
}
```

### Delete Messages

Delete all messages for a chat.

**Endpoint**: `DELETE /api/messages?chatId=chat-123`

**Query Parameters**:
- `chatId` (string, required): Chat ID

**Response**:
```json
{
  "success": true,
  "message": "Messages deleted successfully",
  "count": 15
}
```

## Workflows API

### Execute Workflow

Execute a crew workflow.

**Endpoint**: `POST /api/workflows/execute`

**Request Body**:
```json
{
  "crewId": "crew-123",
  "input": "Analyze this data and provide insights",
  "model": "llama2",
  "temperature": 0.7,
  "config": {
    "rounds": 2,
    "timeout": 30000
  }
}
```

**Response**:
```json
{
  "runId": "run-456",
  "status": "completed",
  "steps": [
    {
      "agentId": "agent-1",
      "agentName": "Analyst",
      "input": "Analyze this data and provide insights",
      "output": "Analysis results...",
      "duration": 2500,
      "timestamp": "2026-01-21T10:00:00Z"
    },
    {
      "agentId": "agent-2",
      "agentName": "Synthesizer",
      "input": "Analysis results...",
      "output": "Synthesized insights...",
      "duration": 1800,
      "timestamp": "2026-01-21T10:00:02Z"
    }
  ],
  "finalOutput": "Synthesized insights...",
  "duration": 4300
}
```

## Settings API

### Get Settings

Retrieve current settings.

**Endpoint**: `GET /api/settings`

**Response**:
```json
{
  "settings": {
    "workspaceName": "My Workspace",
    "defaultProvider": "ollama",
    "ollamaUrl": "http://localhost:11434",
    "ollamaModel": "llama2",
    "temperature": 0.7,
    "topP": 0.9,
    "maxTokens": 2048,
    "systemPrompt": "You are a helpful assistant",
    "autoScrollToLatest": true
  }
}
```

### Update Settings

Update settings.

**Endpoint**: `PUT /api/settings`

**Request Body** (partial update supported):
```json
{
  "temperature": 0.8,
  "maxTokens": 4096,
  "systemPrompt": "You are an expert assistant"
}
```

**Response**:
```json
{
  "settings": {
    "temperature": 0.8,
    "maxTokens": 4096,
    "systemPrompt": "You are an expert assistant"
  }
}
```

## Code Execution API

### Execute Code

Execute JavaScript/TypeScript code in a sandboxed environment.

**Endpoint**: `POST /api/execute`

**Request Body**:
```json
{
  "code": "console.log('Hello'); return 42;",
  "language": "javascript"
}
```

**Response** (Success):
```json
{
  "success": true,
  "output": {
    "stdout": "Hello\n",
    "stderr": "",
    "result": 42,
    "executionTime": 15
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "ReferenceError: undefined_variable is not defined",
  "output": {
    "stdout": "",
    "stderr": "",
    "executionTime": 10
  }
}
```

**Security Notes**:
- 5-second execution timeout
- No network access
- No file system access
- No process manipulation
- Limited to safe built-in modules

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_INPUT` | Request validation failed | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `ALREADY_EXISTS` | Resource already exists | 409 |
| `INTERNAL_ERROR` | Server error | 500 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `PROVIDER_ERROR` | LLM provider error | 502 |
| `TIMEOUT` | Operation timed out | 504 |
| `VALIDATION_ERROR` | Input validation failed | 400 |

### Example Error Responses

**Not Found**:
```json
{
  "success": false,
  "error": "Agent not found",
  "code": "NOT_FOUND"
}
```

**Validation Error**:
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "Name is required",
    "model": "Invalid model name"
  }
}
```

**Provider Error**:
```json
{
  "success": false,
  "error": "Failed to connect to Ollama",
  "code": "PROVIDER_ERROR",
  "details": {
    "url": "http://localhost:11434",
    "message": "Connection refused"
  }
}
```

## Rate Limiting

Currently, there is no rate limiting on the local API. Future versions may include:

- Request throttling for external API access
- Per-user rate limits
- Quota management for cloud sync

## Webhooks

Webhooks are not yet implemented but are planned for future releases. They will allow:

- Notifications on crew completion
- Integration with external systems
- Event-driven workflows

## GraphQL API

A GraphQL API is planned for future releases as an alternative to REST.

## WebSocket API

Real-time updates via WebSocket are planned for:

- Live workflow execution updates
- Multi-user collaboration
- Real-time notifications

## SDK Support

Official SDKs are planned for:

- **JavaScript/TypeScript**: Node.js and browser support
- **Python**: Python 3.8+
- **Go**: Go 1.20+

## Examples

### Complete Chat Flow

```javascript
// 1. Create a chat
const chatResponse = await fetch('/api/chats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Discussion',
    agentId: 'agent-123',
    model: 'llama2'
  })
});
const { chat } = await chatResponse.json();

// 2. Send a message
const messageResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello, AI!',
    chatId: chat.id,
    agentId: 'agent-123'
  })
});

// 3. Stream the response
const reader = messageResponse.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk);
}

// 4. Get message history
const historyResponse = await fetch(`/api/messages?chatId=${chat.id}`);
const { messages } = await historyResponse.json();
```

### Execute Workflow

```javascript
// Create a crew
const crewResponse = await fetch('/api/crews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Analysis Team',
    workflowType: 'sequential',
    agents: ['agent-1', 'agent-2', 'agent-3']
  })
});
const { crew } = await crewResponse.json();

// Execute workflow
const workflowResponse = await fetch('/api/workflows/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    crewId: crew.id,
    input: 'Analyze market trends for 2026'
  })
});
const result = await workflowResponse.json();

console.log('Workflow completed:', result.finalOutput);
console.log('Steps:', result.steps);
```

### Template Interpolation

```javascript
// Create template
const templateResponse = await fetch('/api/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Email Template',
    body: 'Write an email about {{topic}} in a {{tone}} tone.',
    variables: [
      { name: 'topic', type: 'string', required: true },
      { name: 'tone', type: 'string', required: true }
    ]
  })
});
const { template } = await templateResponse.json();

// Interpolate variables
const interpolateResponse = await fetch(`/api/templates/${template.id}/interpolate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variables: {
      topic: 'product launch',
      tone: 'professional'
    }
  })
});
const { content } = await interpolateResponse.json();

console.log('Interpolated:', content);
```

## Versioning

The API currently has no versioning. Future versions will use:

- URL versioning: `/api/v1/agents`
- Header versioning: `X-API-Version: 1`

## Support

For API support, please:

1. Check this documentation
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Check [GitHub Issues](https://github.com/jamesk9526/Oyama/issues)
4. Submit a bug report or feature request

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for API changes and updates.
