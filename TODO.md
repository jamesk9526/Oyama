# Oyama - Project TODO

## Project Overview
Oyama is a comprehensive AI Agent Collaboration Platform for building, customizing, and orchestrating AI agents with multi-agent workflows, advanced prompt engineering, and a modern interface.

---

## ✅ COMPLETED

### Project Foundation
- [x] Next.js 14.2.20 project setup with TypeScript
- [x] Tailwind CSS v3.4.16 configured with custom design tokens
- [x] Dark-first design system with RGB CSS variables (`app/globals.css`)
- [x] Component library created (Button, Input, Textarea, Select, Label, Card, Badge, Tabs, Modal)
- [x] Type system defined (`types/index.ts` with Agent, Template, Chat, Workspace, etc.)

### Database & Storage
- [x] Database schema designed (12 tables: agents, templates, chats, workspaces, etc.)
- [x] In-memory storage implementation (temporary solution, SQLite pending)
- [x] API routes for CRUD operations:
  - [x] `app/api/templates/route.ts` (GET/POST)
  - [x] `app/api/templates/[id]/route.ts` (GET/PUT/DELETE)
  - [x] `app/api/agents/route.ts` (GET/POST)
  - [x] `app/api/agents/[id]/route.ts` (GET/PUT/DELETE)
  - [x] `app/api/crews/route.ts` (GET/POST)
  - [x] `app/api/crews/[id]/route.ts` (GET/PUT/DELETE placeholders)
- [x] Seed data with 3 templates and 3 agents

### State Management
- [x] Zustand store for templates (`lib/stores/templates.ts`) with methods:
  - [x] fetchTemplates, createTemplate, updateTemplate, deleteTemplate, toggleFavorite
- [x] Zustand store for agents (`lib/stores/agents.ts`) with methods:
  - [x] fetchAgents, createAgent, updateAgent, deleteAgent
- [x] Zustand store for crews (`lib/stores/crews.ts`) with methods:
  - [x] fetchCrews, createCrew, updateCrew, deleteCrew
- [x] Zustand store for UI state (`lib/stores/ui.ts`):
  - [x] Sidebar open/close management

### UI & Layout
- [x] Sidebar with navigation:
  - [x] Mobile hamburger menu (visible < lg)
  - [x] Slide-in/out animation
  - [x] Backdrop overlay for mobile
  - [x] Auto-closes on route change
  - [x] Navigation links to all pages
  - [x] "New Chat" button wired to `/chats`
- [x] Responsive main layout (`app/layout.tsx`)
- [x] Pages created and styled:
  - [x] Homepage (`app/page.tsx`) - responsive hero section with CTAs
  - [x] Templates page (`app/templates/page.tsx`) - full CRUD with search/filter
  - [x] Agents page (`app/agents/page.tsx`) - full CRUD with search/filter
  - [x] Chats page (`app/chats/page.tsx`) - message interface
  - [x] Crews page (`app/crews/page.tsx`) - crew management interface
  - [x] Settings page (`app/settings/page.tsx`) - tabbed interface

### Components
- [x] TemplateCard component with actions (edit, delete, test, favorite)
- [x] TemplateEditor modal with form inputs
- [x] AgentCard component with actions (edit, delete, test, duplicate)
- [x] AgentBuilder modal with multi-tab configuration

### Mobile Responsiveness
- [x] Sidebar responsive (fixed on mobile, static on desktop)
- [x] Homepage responsive (text sizes, button stacking, grid layout)
- [x] Templates page responsive (grid: 1 col mobile → 3 col desktop)
- [x] Agents page responsive (grid: 1 col mobile → 3 col desktop)
- [x] Crews page responsive (grid: 1 col mobile → 3 col desktop)
- [x] Settings page responsive (tab labels, grid layout)
- [x] Chats page responsive (message bubbles, input area)

### Functionality
- [x] Templates page wired to store:
  - [x] Fetch on mount
  - [x] Create templates
  - [x] Update templates
  - [x] Delete templates with confirmation
  - [x] Toggle favorite status
  - [x] Search by name/tags/description
  - [x] Filter by category
  - [x] Filter by favorites
- [x] Agents page wired to store:
  - [x] Fetch on mount
  - [x] Create agents
  - [x] Update agents
  - [x] Delete agents with confirmation
  - [x] Duplicate agents
  - [x] Search by name/role
  - [x] Filter by role
- [x] Crews page wired to store:
  - [x] Fetch on mount
  - [x] Create crews
  - [x] Delete crews with confirmation
  - [x] Grid layout with status badges
  - [x] Workflow type display
- [x] Chat page basic functionality:
  - [x] Message input and send button
  - [x] User/assistant message display
  - [x] Timestamps on messages
  - [x] Loading state during response
  - [x] Placeholder response system

### Build System
- [x] Fixed all TypeScript compilation errors
- [x] Build passes successfully (`npm run build`)
- [x] All type issues resolved (Badge onClick, Card onClick, array types, etc.)
- [x] Ready for production

### Electron Desktop Integration
- [x] Electron 40.0.0 installed and configured
- [x] Electron main process (`electron/main.js`) with window management
- [x] Preload script (`electron/preload.cjs`) with contextBridge IPC
- [x] electron-builder configuration for Windows distribution (NSIS + portable)
- [x] Icon generation pipeline (SVG → PNG)
- [x] Development scripts: `npm run dev:electron`
- [x] Build scripts: `npm run build:desktop:win`
- [x] Custom window controls (minimize/maximize/close buttons)
- [x] Frameless window with draggable title bar
- [x] IPC handlers for window operations

### LLM Integration & Chat
- [x] **Settings Store** (`lib/stores/settings.ts`):
  - [x] Ollama URL and model configuration
  - [x] OpenAI API key storage
  - [x] LLM parameters (temperature, topP, maxTokens)
  - [x] System prompt management
  - [x] Persistent storage with Zustand middleware

- [x] **Settings Page**:
  - [x] Workspace tab with name/description/default provider
  - [x] Providers tab with Ollama configuration
  - [x] Ollama URL input and model selector
  - [x] Automatic model fetching from Ollama API
  - [x] Connection test button with status feedback
  - [x] LLM parameters tab (temperature, topP sliders)
  - [x] Global system prompt editor

- [x] **Chat Page**:
  - [x] Agent selector dropdown
  - [x] Model selector (loads from settings)
  - [x] Message history display
  - [x] User/assistant message styling
  - [x] Error handling and display
  - [x] Loading indicator during response

- [x] **Chat API** (`app/api/chat/route.ts`):
  - [x] POST endpoint for chat requests
  - [x] Integration with Ollama provider
  - [x] System prompt injection from agent or global settings
  - [x] Streaming response handling
  - [x] Error handling for Ollama failures

### Build System
- [x] Fixed all TypeScript compilation errors
- [x] Build passes successfully (`npm run build`)
- [x] All type issues resolved (Badge onClick, Card onClick, array types, topP in LLMRequest)
- [x] Ready for production

### Database Persistence
- [x] Installed better-sqlite3 v11.6.0 with type definitions
- [x] Created database client (`lib/db/client.ts`) with:
  - [x] Connection management
  - [x] Automatic initialization
  - [x] Schema creation (agents, templates, crews, chats, settings tables)
  - [x] Foreign key pragmas
  - [x] Graceful fallback to .data directory (Electron + dev environments)
- [x] Created database queries (`lib/db/queries.ts`) with:
  - [x] Agent CRUD operations
  - [x] Template CRUD operations
  - [x] Crew CRUD operations
  - [x] Settings CRUD operations
  - [x] Full type safety with TypeScript
- [x] Database initialization endpoint (`app/api/db/init/route.ts`)
- [x] Updated agent API routes to use database with fallback
- [x] Tested database creation and schema validation

### System Personalization
- [x] Created SystemSetupWizard component (`components/settings/SystemSetupWizard.tsx`):
  - [x] Multi-step wizard (3 steps: welcome, system name, user name)
  - [x] Form inputs for customization
  - [x] Progress indicator
  - [x] State management with Zustand integration
- [x] Added systemName and userName to settings store
- [x] Added wizard button to Settings page
- [x] Integrated wizard into Workspace tab
- [x] Settings store updates system prompt with actual names

### Chat Streaming & Auto-scroll
- [x] Implemented message streaming in chat API (`app/api/chat/route.ts`):
  - [x] Server-Sent Events (SSE) streaming support
  - [x] Real-time chunk delivery to client
  - [x] Fallback to non-streaming response
  - [x] Proper error handling during streaming
- [x] Updated chat page with streaming UI (`app/chats/page.tsx`):
  - [x] ReadableStream parsing for streaming responses
  - [x] Character-by-character message rendering
  - [x] Visual "Streaming response..." indicator
  - [x] Auto-scroll to latest message with smooth behavior
  - [x] useRef for message container and end marker
  - [x] Scroll on message updates and loading state
  - [x] Auto-focus on input after message completes
  - [x] Input stays focused for rapid-fire messaging

### Markdown Rendering in Chat Messages
- [x] Installed dependencies (react-markdown, remark-gfm, remark-math, rehype-katex, rehype-highlight, highlight.js)
- [x] Created ChatMessage component (`components/chat/ChatMessage.tsx`):
  - [x] Full markdown rendering support
  - [x] GitHub Flavored Markdown (tables, strikethrough, etc.)
  - [x] Code block syntax highlighting with highlight.js
  - [x] Inline code styling
  - [x] Copy button for code blocks with visual feedback
  - [x] Custom styling for tables, links, lists, blockquotes
  - [x] LaTeX math support (via remark-math and rehype-katex)
  - [x] Proper prose styling with Tailwind typography
- [x] Integrated ChatMessage into chat page
- [x] Separated user messages (plain text) from assistant messages (markdown)
- [x] Smooth scrolling still works with markdown rendering

---

## 🔨 IN PROGRESS / PARTIALLY COMPLETE

None - All Sprint 2 priority features complete!

---

## 📋 TODO (Highest Priority - Sprint 2)

### Chat & Message Features
1. **Markdown Rendering in Chat Messages** (`components/chat/ChatMessage.tsx`)
   - [x] Install react-markdown and remark plugins
   - [x] Render markdown in assistant messages
   - [x] Support for:
     - [x] Code blocks with syntax highlighting
     - [x] Lists (ordered and unordered)
     - [x] Tables
     - [x] Links and emphasis
     - [x] Inline code
   - [x] Copy code button for code blocks
   - [x] Theme-aware code syntax highlighting

2. **Code Execution / Sandbox Feature**
   - [x] Plan architecture for safe code execution:
     - [x] Option A: Isolated Worker Threads (simple, fast, same-machine only) ✓ CHOSEN
     - [ ] Option B: Docker containers (secure, scalable, requires Docker)
     - [ ] Option C: WebAssembly VM (sandboxed, limited capabilities)
   - [x] Implementation approach: Node.js worker threads with VM sandbox
   - [x] Code playground in chat for testing snippets (Run button in code blocks)
   - [x] Execution results display in chat (ExecutionOutput under code blocks)
   - [x] Error handling and timeout management (5s timeout, captured errors)
   - [x] Phase 1 Complete:
     - [x] Worker thread executor with sandbox context
     - [x] Code sanitizer with blocked module detection
     - [x] Security policies (NO_NETWORK, NO_FILESYSTEM, etc.)
     - [x] /api/execute endpoint created
     - [x] Run button added to code blocks in ChatMessage
     - [x] Execution state management (running, result display)
     - [x] Output display with stdout/stderr/error sections
     - [x] Language filtering (JavaScript/TypeScript only in Phase 1)

### Message Persistence
3. **Chat Message History Persistence**
   - [x] Migrate chat storage from in-memory to SQLite
   - [x] API routes for chat history (GET/POST/DELETE)
   - [x] Load message history on chat page mount
   - [x] Save new messages to database
   - [x] Delete conversation functionality
   - [x] Phase Complete:
     - [x] Messages table created with chatId foreign key
     - [x] Chats table updated (removed messages TEXT column)
     - [x] messageQueries: getAllByChatId, create, deleteByChatId
     - [x] chatQueries: getAll, getById, create, update, delete
     - [x] /api/messages route (GET with chatId, POST, DELETE)
     - [x] /api/chats route (GET, POST)
     - [x] /api/chats/[id] route (GET, PUT, DELETE)
     - [x] Chat page: session management with sessionStorage
     - [x] Auto-load messages on mount
     - [x] Auto-save messages as sent/received
     - [x] New Chat button to create fresh conversations
     - [x] Clear Chat button to delete all messages

### Crew Workflows
4. **Multi-Agent Crews Execution** (`lib/workflows/executor.ts`)
   - [x] Workflow parser
   - [x] Sequential execution
   - [x] Parallel execution  
   - [x] Conditional branching
   - [x] Variable passing between agents
   - [x] Error handling and rollback
   - [x] Execution logging
   - [x] Phase Complete:
     - [x] WorkflowExecutor class with execute() method
     - [x] Sequential: Pass output from one agent to next
     - [x] Parallel: Execute all agents simultaneously with Promise.allSettled
     - [x] Conditional: Evaluate conditions (success/failure/always) before executing steps
     - [x] Agent invocation via Ollama API
     - [x] Timeout handling per agent (configurable)
     - [x] WorkflowStepResult tracking (input, output, duration, errors)
     - [x] WorkflowExecutionResult with overall success/failure
     - [x] /api/workflows/execute endpoint
     - [x] CrewExecutionModal component with input form
     - [x] Real-time execution status display
     - [x] Step-by-step results with expand/collapse
     - [x] Integrated into Crews page with Run button

### Medium Priority Features
5. **Command Palette** (`components/CommandPalette.tsx`)
   - [ ] Page layout and header
   - [ ] Crew creation form
   - [ ] Agent selection and ordering
   - [ ] Workflow definition (sequential, parallel, conditional)
   - [ ] Crew execution interface
   - [ ] Results visualization
   - [ ] API routes for crew CRUD

4. **Crew Workflow Engine** (`lib/workflows/executor.ts`)
   - [ ] Workflow parser
   - [ ] Sequential execution
   - [ ] Parallel execution
   - [ ] Conditional branching
   - [ ] Variable passing between agents
   - [ ] Error handling and rollback
   - [ ] Execution logging

### Medium Priority Features
5. **Command Palette** (`components/CommandPalette.tsx`)
   - [x] Keyboard shortcut (Ctrl+K)
   - [x] Command registration system
   - [x] Fuzzy search
   - [x] Action categories
   - [x] Quick navigation
   - [x] Quick agent/template access
   - [x] Phase Complete:
     - [x] CommandPalette component with modal interface
     - [x] Global Ctrl+K keyboard shortcut handler
     - [x] ClientLayout wrapper for keyboard event handling
     - [x] Fuzzy search filtering across all commands
     - [x] Command categories: navigation, actions, agents, templates, crews
     - [x] Dynamic command generation from agents/templates/crews
     - [x] Keyboard navigation (↑↓ arrows, Enter, Esc)
     - [x] Visual command grouping by category
     - [x] Quick access to all pages and entities
     - [x] Sidebar hint with Ctrl+K shortcut display
     - [x] Search through command labels, descriptions, keywords

6. **Prompt Composition Engine** (`lib/prompts/composer.ts`)
   - [ ] Prompt variable interpolation
   - [ ] System prompt hierarchy (Global → Workspace → Agent → Chat)
   - [ ] Prompt versioning
   - [ ] Prompt templates with slots
   - [ ] Context injection

7. **Template Variables & Preview**
   - [ ] Template variable editor in TemplateEditor
   - [ ] Live preview with sample data
   - [ ] Variable type validation (string, number, array, etc.)
   - [ ] Default value support
   - [ ] Required/optional fields

8. **Settings Implementation**
   - [ ] Workspace name/description editing
   - [ ] Provider configuration (Ollama URL, OpenAI key)
   - [ ] Default model selection
   - [ ] Global system prompt setting
   - [ ] UI theme preferences
   - [ ] Workspace export/import
   - [ ] Data backup settings

### Lower Priority / Polish
9. **UI Enhancements**
   - [ ] Loading skeletons for data fetching
   - [ ] Toast notifications for actions
   - [ ] Confirmation dialogs with better UX
   - [ ] Animation transitions
   - [ ] Dark mode toggle (currently forced dark)
   - [ ] Accessibility improvements (ARIA labels, keyboard nav)

10. **Analytics & Monitoring**
    - [ ] Chat usage statistics
    - [ ] Token usage tracking
    - [ ] Agent performance metrics
    - [ ] Error tracking and logging

11. **Documentation**
    - [ ] API documentation
    - [ ] Setup guide for Ollama/OpenAI
    - [ ] Architecture documentation
    - [ ] Component storybook

---

## 🐛 KNOWN ISSUES

1. **Database Issues**
   - better-sqlite3 native module compilation fails on Windows (ClangCL error)
   - Current workaround: In-memory storage
   - Solution needed: Use sqlite3 package or find alternative

2. **TypeScript Configuration**
   - `forceConsistentCasingInFileNames` not enabled in tsconfig.json
   - CSS linting warnings for @tailwind and @apply (expected, not errors)

3. **Missing Implementations**
   - Crews page doesn't exist yet (route `/crews`)
   - No actual LLM response generation
   - Chat interface uses placeholder responses
   - Settings page has no functional form handlers

---

## 📊 FILE STRUCTURE & KEY LOCATIONS

### Pages
- `app/page.tsx` - Homepage
- `app/chats/page.tsx` - Chat interface
- `app/templates/page.tsx` - Template library
- `app/agents/page.tsx` - Agent management
- `app/settings/page.tsx` - Settings
- `app/crews/page.tsx` - **TODO: Create**

### Components
- `components/layout/Sidebar.tsx` - Navigation sidebar
- `components/ui/` - Reusable UI components
- `components/templates/` - Template-related components
- `components/agents/` - Agent-related components

### State Management
- `lib/stores/templates.ts` - Template store
- `lib/stores/agents.ts` - Agent store
- `lib/stores/ui.ts` - UI state

### API Routes
- `app/api/templates/` - Template endpoints
- `app/api/agents/` - Agent endpoints
- `app/api/chats/` - **TODO: Create**
- `app/api/crews/` - **TODO: Create**

### Libraries & Utilities
- `lib/providers/` - LLM provider implementations
- `lib/prompts/` - Prompt composition
- `lib/db/` - Database layer (currently in-memory)
- `lib/workflows/` - Multi-agent workflow execution
- `types/index.ts` - TypeScript types

---

## 🎯 NEXT IMMEDIATE STEPS (Priority Order)

1. Fix build errors and ensure `npm run build` passes
2. Create crews page and API routes
3. Implement LLM provider connections (test Ollama first)
4. Wire chat interface to LLM providers with streaming
5. Replace in-memory storage with persistent database
6. Implement command palette
7. Add more comprehensive error handling
8. Write documentation

---

## 🔗 DEPENDENCIES

### Core
- next@14.2.20
- react@18.3.1
- react-dom@18.3.1

### Styling
- tailwindcss@3.4.16
- postcss@8.4.47

### State & Data
- zustand@5.0.3
- uuid@9.0.1

### UI
- lucide-react@0.468.0
- clsx@2.1.1

### Future (Not Yet Installed)
- sqlite3 (database)
- axios or fetch (HTTP client for LLM APIs)
- markdown-it or remark (for prompt rendering)

---

## 📈 PROGRESS SUMMARY

**Overall Completion: ~75%**

- ✅ Architecture & Setup: 100%
- ✅ UI & Components: 100%
- ✅ State Management: 100%
- ✅ Mobile Responsiveness: 100%
- ✅ Core Pages: 100% (Homepage, Templates, Agents, Chats, Crews, Settings)
- ✅ Build System: 100%
- ✅ Database: 100% (SQLite with better-sqlite3)
- ✅ LLM Integration: 100% (Ollama with streaming)
- ✅ Crew Workflows: 100% (Sequential, parallel, conditional execution)
- ✅ Code Execution: 100% (Worker threads sandbox, Phase 1 complete)
- ✅ Message Persistence: 100% (Chat history in SQLite)
- ✅ Command Palette: 100% (Ctrl+K quick search)
- 📋 Advanced Features: 15%

**Recent Session Accomplishments (Sprint 2 - ALL COMPLETE):**
- ✅ Fixed settings infinite loop and personalization wizard
- ✅ SQLite database integration with full schema
- ✅ Message streaming with SSE
- ✅ Auto-scroll and auto-focus in chat
- ✅ Markdown rendering with GitHub Flavored Markdown
- ✅ Code execution infrastructure (worker threads, sandbox, security)
- ✅ Run button for code blocks with execution output
- ✅ Message persistence to SQLite database
- ✅ Crew workflow executor (sequential/parallel/conditional)
- ✅ Command palette with Ctrl+K shortcut
- ✅ All 5 Sprint 2 tasks completed

---

**Last Updated:** January 18, 2026
