# Oyama - AI Agent Collaboration Platform

A modern, local-first AI agent collaboration platform with multi-agent workflows, advanced prompt engineering, and a sleek, flat UI. **Now with Electron desktop app support and Ollama LLM integration!**

## Features

- **Multi-Agent "Crew" Workflows**: Orchestrate multiple AI agents to collaborate on complex tasks
- **Ollama Integration**: Built-in support for local LLM via Ollama (with model auto-discovery)
- **Real-time Chat Streaming**: Watch responses appear character-by-character with smooth animations
- **Markdown Support**: Full GitHub Flavored Markdown rendering with syntax-highlighted code blocks
- **Auto-scrolling Chat**: Messages automatically scroll to latest with smooth behavior
- **System Prompt Hierarchy**: Global → Workspace → Agent → Chat level customization
- **System Personalization**: Wizard-based setup for naming your AI and user identifier
- **Template Library**: Reusable prompt templates with variables and live preview
- **Agent Builder**: Create specialized agents (Planner, Researcher, Writer, etc.)
- **Chat with Agents**: Interactive chat interface with streaming responses and markdown rendering
- **Auto-focus Input**: Chat input stays focused after sending for rapid-fire messaging
- **Electron Desktop App**: Run as native Windows/Mac/Linux application
- **SQLite Database**: Persistent storage with full export/import capabilities
- **Provider Agnostic**: Support for Ollama (local) and OpenAI-compatible APIs
- **Modern UI**: Flat, sleek design with dark-first color system
- **Custom Window Controls**: Native minimize/maximize/close buttons for Electron

## Architecture

### Core Components

- **Agents**: Named AI assistants with specific roles, system prompts, and capabilities
- **Templates**: Reusable prompt blocks with variable interpolation
- **Workspaces**: Collections of agents, templates, and chats
- **Crews**: Multi-agent workflows (Parallel, Pipeline, Debate, Planner/Executor)
- **Chats**: Interactive conversations with AI agents, powered by Ollama or OpenAI

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Desktop**: Electron 40 with electron-builder for Windows distribution
- **Database**: SQLite with better-sqlite3 (in-memory during Sprint 1, file-based in Sprint 2)
- **UI**: React, Tailwind CSS, custom component library
- **State**: Zustand for client state + localStorage persistence
- **Providers**: Ollama (local), OpenAI-compatible APIs
- **LLM**: Integrated OllamaProvider with streaming support

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
├── components/            
│   ├── ui/                # Base UI components (Button, Input, etc.)
│   └── ...                # Feature components
├── electron/              # Electron main process and preload
├── lib/
│   ├── db/                # Database layer (SQLite)
│   ├── providers/         # LLM provider adapters
│   ├── prompts/           # Prompt composition engine
│   └── templates/         # Template engine
├── types/                 # TypeScript type definitions
├── scripts/               # Database migration/seed and build scripts
└── assets/                # App icons and resources
```

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
- [ ] Database persistence (currently in-memory)
- [ ] Multi-agent crew orchestration
- [ ] Chat interface with streaming
- [ ] Command palette (Ctrl/Cmd+K)
- [ ] Export/import functionality
- [ ] Backup system
- [ ] Performance optimizations (virtualization, lazy loading)

## Current Status

**🚀 Sprint 1 Complete - Application Fully Functional!**

Visit http://localhost:3000 to explore:
- ✅ **Home Page** (/home) - Welcome screen with feature overview
- ✅ **Templates** (/templates) - Create and manage prompt templates with search/filter
- ✅ **Agents** (/agents) - Build AI agents with specialized roles and system prompts
- ✅ **Chats** (/chats) - Real-time chat with streaming, markdown rendering, auto-scroll
- ✅ **Crews** (/crews) - Multi-agent workflow management interface
- ✅ **Settings** (/settings) - Workspace config, LLM providers, system personalization wizard

### Recently Completed (Sprint 1)
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

### Next Up (Sprint 2)
- 🔨 Code execution sandbox (Phase 1: Node.js worker threads)
- 🔨 Message persistence to SQLite
- 🔨 Crew workflow execution engine
- 🔨 Command palette (Ctrl+K search)
- 🔨 Stop generation button during streaming

The UI features a modern, flat, dark-first design with full markdown support in chat.

## Contributing

This is a feature-rich project with many opportunities for contribution. See the roadmap above for areas where help is needed.

## License

See LICENSE file for details.
