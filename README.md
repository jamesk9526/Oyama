# Oyama - AI Automation Studio

**A local, transparent, inspectable AI automation studio** with MCP Tools Server, staged workflows, persistent memory, and comprehensive tool orchestration. Built for power users who demand full visibility and control over their AI automation pipelines.

**Now featuring embedded MCP Tools Server, Ollama LAN support, and Electron desktop app!**

## Features

### Core Capabilities
- **MCP Tools Server**: Local, embedded tool orchestration compatible with Model Context Protocol
- **Staged Workflows**: Build automation pipelines with approval gates and conditional execution
- **Persistent Memory System**: Inspectable, searchable memory across all agents and sessions
- **Library System**: Reusable templates, tools, workflows, and components
- **Ollama LAN Support**: Connect to Ollama instances across your network for distributed LLM access
- **In-App Help**: Comprehensive documentation and guides built directly into the interface

### Agent & Chat
- **Multi-Agent "Crew" Workflows**: Orchestrate multiple AI agents to collaborate on complex tasks
- **Real-time Chat Streaming**: Watch responses appear character-by-character with smooth animations
- **Markdown Support**: Full GitHub Flavored Markdown rendering with syntax-highlighted code blocks
- **Auto-scrolling Chat**: Messages automatically scroll to latest with smooth behavior
- **System Prompt Hierarchy**: Global → Workspace → Agent → Chat level customization

### Developer Experience
- **Code Execution Sandbox**: Safe JavaScript/TypeScript execution with worker threads
- **Template Library**: Reusable prompt templates with variables and live preview
- **Agent Builder**: Create specialized agents (Planner, Researcher, Writer, etc.)
- **Command Palette**: Quick access to all features with Ctrl+K
- **Electron Desktop App**: Run as native Windows/Mac/Linux application

### Infrastructure
- **SQLite Database**: Persistent storage with full export/import capabilities
- **Provider Agnostic**: Support for Ollama (local/LAN) and OpenAI-compatible APIs
- **Modern UI**: Flat, sleek design with dark-first color system
- **Custom Window Controls**: Native minimize/maximize/close buttons for Electron

## Architecture

### Core Components

- **MCP Tools Server**: Embedded, MCP-compatible tool orchestration with local execution
- **Workflows**: Staged automation pipelines with approval gates and conditional branching
- **Memory System**: Persistent, inspectable memory accessible across all agents and sessions
- **Library**: Centralized repository for templates, tools, workflows, and reusable components
- **Agents**: Named AI assistants with specific roles, system prompts, and capabilities
- **Templates**: Reusable prompt blocks with variable interpolation
- **Workspaces**: Collections of agents, templates, and chats
- **Crews**: Multi-agent workflows (Parallel, Pipeline, Debate, Planner/Executor)
- **Chats**: Interactive conversations with AI agents, powered by Ollama or OpenAI

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Desktop**: Electron 40 with electron-builder for Windows distribution
- **Database**: SQLite with better-sqlite3 (file-based persistent storage)
- **UI**: React, Tailwind CSS, custom component library
- **State**: Zustand for client state + localStorage persistence
- **Providers**: Ollama (local/LAN), OpenAI-compatible APIs
- **LLM**: Integrated OllamaProvider with streaming support
- **Execution**: Worker threads with VM sandbox for safe code execution

## Getting Started

### Prerequisites

- Node.js 18+ 
- Ollama (for local LLM support) - https://ollama.ai
  ```bash
  # Install Ollama, then pull a model:
  ollama pull llama2
  ollama serve  # Run in a separate terminal
  ```

### Installation

```bash
# Install dependencies
npm install

# (Optional) Run database migrations
npm run db:migrate

# (Optional) Seed with starter data
npm run db:seed

# Start development server (web only)
npm run dev

# Start development server with Electron desktop app
npm run dev:electron
```

Open [http://localhost:3000](http://localhost:3000) for the web version, or use `npm run dev:electron` to run as a desktop application.

### Building for Desktop

```bash
# Build Windows installer and portable exe
npm run build:desktop:win

# Build for all platforms
npm run build:desktop
```

See [DESKTOP_SETUP.md](./DESKTOP_SETUP.md) for detailed desktop/Electron setup instructions.

## Project Structure

```
.
├── app/                    # Next.js app router pages
│   ├── workflows/          # Staged workflow automation
│   ├── tools/              # MCP Tools Server interface
│   ├── library/            # Reusable components library
│   ├── memory/             # Persistent memory system
│   ├── models/             # Ollama endpoint management
│   ├── help/               # In-app documentation
│   ├── chats/              # Chat interface
│   ├── agents/             # Agent management
│   ├── templates/          # Template library
│   └── settings/           # Application settings
├── components/            
│   ├── ui/                 # Base UI components (Button, Input, etc.)
│   └── ...                 # Feature components
├── electron/               # Electron main process and preload
├── lib/
│   ├── db/                 # Database layer (SQLite)
│   ├── providers/          # LLM provider adapters
│   ├── prompts/            # Prompt composition engine
│   ├── workflows/          # Workflow execution engine
│   └── templates/          # Template engine
├── types/                  # TypeScript type definitions
├── scripts/                # Database migration/seed and build scripts
└── assets/                 # App icons and resources
```

## Screenshots

### Home & Navigation
![Home Navigation](https://github.com/user-attachments/assets/9130a3f1-069e-439d-b881-e862553f6d8c)

### Workflows - Staged Automation
![Workflows](https://github.com/user-attachments/assets/aadd8c35-1acd-488b-9d62-fc0551dc917e)

### Tools Server - MCP Compatible
![Tools Server](https://github.com/user-attachments/assets/65c8a96e-9c01-4f65-8913-9f209daf8d97)

### Library - Reusable Components
![Library](https://github.com/user-attachments/assets/ba20f2bb-118b-487d-8928-918f9a2dfb6e)

### Memory - Persistent System
![Memory](https://github.com/user-attachments/assets/4473d016-8d37-44d0-b5a1-ba917dd4abf7)

### Models/Providers - Ollama Management
![Models/Providers](https://github.com/user-attachments/assets/49b3a2db-dadc-4e4a-bc2d-b2c66080dd4c)

## Database Schema

- `workspaces` - Workspace configurations
- `agents` - AI agent definitions
- `templates` - Prompt templates
- `crews` - Multi-agent workflows
- `chats` - Conversation threads
- `messages` - Chat messages
- `runs` - Execution records
- `system_prompt_versions` - Version history for prompts
- `prompt_blocks` - Reusable prompt components
- `provider_configs` - LLM provider configurations

## Roadmap

- [x] Core architecture and database schema
- [x] Provider layer (Ollama, OpenAI-compatible)
- [x] System prompt hierarchy and composition
- [x] Template engine with variables
- [x] Base UI component library (flat, sleek design)
- [x] Template library UI with search/tags/editor
- [x] Agent builder UI with role presets
- [x] Main layout with sidebar navigation
- [x] Database persistence with SQLite
- [x] Multi-agent crew orchestration
- [x] Chat interface with streaming
- [x] Command palette (Ctrl/Cmd+K)
- [x] Code execution sandbox
- [x] Message persistence
- [x] Markdown rendering with syntax highlighting
- [x] Electron desktop app with custom window controls
- [x] Ollama integration with model auto-discovery
- [ ] **MCP Tools Server backend implementation**
- [ ] **Workflow execution engine with approval gates**
- [ ] **Memory storage backend**
- [ ] **Library API and sync system**
- [ ] **Theme customization system**
- [ ] Export/import functionality
- [ ] Backup system
- [ ] Performance optimizations (virtualization, lazy loading)

## Current Status

**🚀 Major Upgrade Complete - MCP Tools Server Architecture!**

Visit http://localhost:3000 to explore:
- ✅ **Home** (/) - Welcome screen with navigation to all features
- ✅ **Workflows** (/workflows) - Staged automation with approval gates (UI complete)
- ✅ **Tools Server** (/tools) - MCP-compatible tool orchestration interface (UI complete)
- ✅ **Library** (/library) - Reusable templates, tools, workflows (UI complete)
- ✅ **Memory** (/memory) - Persistent, inspectable memory system (UI complete)
- ✅ **Models/Providers** (/models) - Ollama LAN endpoint management (UI complete)
- ✅ **Help** (/help) - Comprehensive in-app documentation (UI complete)
- ✅ **Chats** (/chats) - Real-time chat with streaming, markdown rendering, auto-scroll
- ✅ **Agents** (/agents) - Build AI agents with specialized roles and system prompts
- ✅ **Templates** (/templates) - Create and manage prompt templates with search/filter
- ✅ **Crews** (/crews) - Multi-agent workflow management with execution
- ✅ **Settings** (/settings) - Workspace config, LLM providers, system personalization

### Recently Completed (MCP Tools Server Upgrade)
- ✅ Complete UI redesign with new navigation structure
- ✅ Workflows page with staged automation interface
- ✅ Tools Server page for MCP tool orchestration
- ✅ Library page for reusable components
- ✅ Memory page for persistent memory inspection
- ✅ Models/Providers page for Ollama LAN management
- ✅ Help page with comprehensive documentation
- ✅ Updated navigation with all new pages

### Previously Completed (Sprint 1 & 2)
- ✅ SQLite database layer with schema and migrations
- ✅ Message streaming with Server-Sent Events (SSE)
- ✅ Auto-scroll to latest messages with smooth behavior
- ✅ Markdown rendering with GitHub Flavored Markdown support
- ✅ Code block syntax highlighting (100+ languages)
- ✅ Copy code button with visual feedback
- ✅ System personalization wizard (name AI and user)
- ✅ Auto-focus chat input after sending messages
- ✅ Electron desktop application with custom window controls
- ✅ Ollama integration with model auto-discovery
- ✅ Code execution sandbox with worker threads
- ✅ Command palette (Ctrl+K) for quick navigation
- ✅ Multi-agent crew execution engine

### Next Up (Backend Implementation)
- 🔨 MCP Tools Server backend implementation
- 🔨 Workflow execution engine with approval gates
- 🔨 Memory storage backend integration
- 🔨 Library API and synchronization system
- 🔨 Theme system implementation

The UI features a modern, flat, dark-first design with full markdown support and comprehensive feature coverage.

## Contributing

This is a feature-rich project with many opportunities for contribution. See the roadmap above for areas where help is needed.

## License

See LICENSE file for details.
