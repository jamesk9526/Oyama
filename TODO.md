# Oyama - Project TODO

## Project Overview
Oyama is a comprehensive AI Automation Studio with embedded MCP Tools Server, staged workflows, persistent memory, and transparent tool orchestration. The platform provides local-first, inspectable AI automation for power users.

---

## ✅ COMPLETED

### MCP Tools Server Architecture Upgrade
- [x] Complete UI redesign with new navigation structure
- [x] Workflows page - Staged automation with approval gates (UI complete)
- [x] Tools Server page - MCP-compatible tool orchestration (UI complete)
- [x] Library page - Reusable templates, tools, workflows (UI complete)
- [x] Memory page - Persistent memory inspection (UI complete)
- [x] Models/Providers page - Ollama LAN endpoint management (UI complete)
- [x] Help page - Comprehensive in-app documentation (UI complete)
- [x] Updated sidebar navigation with all new pages
- [x] Screenshot documentation for all major features

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

### MCP Tools Server Backend
- [ ] MCP protocol implementation
- [ ] Tool registration system
- [ ] Tool execution engine
- [ ] Tool discovery and indexing
- [ ] LAN-based tool sharing

### Workflow Execution Engine
- [ ] Approval gate implementation
- [ ] Stage execution orchestration
- [ ] Conditional branching logic
- [ ] Workflow state persistence
- [ ] Rollback and error recovery

### Memory System Backend
- [ ] Memory storage schema
- [ ] Memory indexing and search
- [ ] Cross-session memory access
- [ ] Memory visualization API
- [ ] Memory export/import

### Library System
- [ ] Component versioning
- [ ] Library synchronization
- [ ] Component sharing API
- [ ] Template instantiation
- [ ] Dependency resolution

---

## 📋 TODO (Highest Priority - Sprint 3)

### 1. MCP Tools Server Implementation
**Goal**: Implement backend for MCP-compatible tool orchestration
- [ ] Design MCP protocol adapter layer
- [ ] Create tool registration API (`app/api/tools/register/route.ts`)
- [ ] Implement tool execution endpoint (`app/api/tools/execute/route.ts`)
- [ ] Add tool discovery mechanism
- [ ] Build tool indexing system
- [ ] Create tool metadata schema (database)
- [ ] Implement tool security/sandboxing
- [ ] Add LAN tool sharing (mDNS discovery)
- [ ] Test with standard MCP tools
- [ ] Wire Tools Server page to backend

**Status**: UI complete, backend pending

### 2. Workflow Execution Engine with Approval Gates
**Goal**: Enable staged automation with human-in-the-loop approval
- [ ] Design workflow stage execution model
- [ ] Create workflow execution API (`app/api/workflows/execute/route.ts`)
- [ ] Implement approval gate system
- [ ] Add approval notification UI
- [ ] Build stage state management
- [ ] Implement conditional branching
- [ ] Add workflow pause/resume
- [ ] Create workflow execution logs
- [ ] Build rollback mechanism
- [ ] Wire Workflows page to execution engine

**Status**: UI complete, execution engine pending

### 3. Memory Storage Backend
**Goal**: Persistent, inspectable memory across agents and sessions
- [ ] Design memory storage schema (database)
- [ ] Create memory API endpoints:
  - [ ] `app/api/memory/store/route.ts` (create/update)
  - [ ] `app/api/memory/search/route.ts` (query)
  - [ ] `app/api/memory/get/route.ts` (retrieve)
- [ ] Implement memory indexing (tags, embeddings)
- [ ] Add cross-session memory access
- [ ] Build memory visualization API
- [ ] Implement memory lifecycle (TTL, archiving)
- [ ] Add memory export/import
- [ ] Create memory search UI
- [ ] Wire Memory page to backend

**Status**: UI complete, storage backend pending

### 4. Library API and Sync System
**Goal**: Centralized repository for reusable components
- [ ] Design library component schema
- [ ] Create library API endpoints:
  - [ ] `app/api/library/components/route.ts` (list/create)
  - [ ] `app/api/library/sync/route.ts` (synchronization)
  - [ ] `app/api/library/install/route.ts` (install components)
- [ ] Implement component versioning
- [ ] Add dependency resolution
- [ ] Build component search/filter
- [ ] Create template instantiation engine
- [ ] Add component sharing (export/import)
- [ ] Wire Library page to backend

**Status**: UI complete, API pending

### 5. Theme System Implementation
**Goal**: Customizable UI themes and appearance
- [ ] Design theme configuration schema
- [ ] Create theme API (`app/api/themes/route.ts`)
- [ ] Build theme switcher component
- [ ] Implement CSS variable injection
- [ ] Add theme preview
- [ ] Create default theme presets
- [ ] Add custom theme editor
- [ ] Persist theme preferences
- [ ] Wire to Settings page

**Status**: Not started

---

## 📋 TODO (Medium Priority - Sprint 4)

---

## 📋 TODO (Medium Priority - Sprint 4)

### Ollama LAN Support Enhancement
- [ ] Implement mDNS discovery for Ollama instances
- [ ] Add LAN endpoint management UI
- [ ] Create endpoint health monitoring
- [ ] Implement load balancing across endpoints
- [ ] Add failover mechanism
- [ ] Build endpoint performance metrics
- [ ] Create endpoint configuration API

### Enhanced Chat Features
- [ ] Stop generation button during streaming
- [ ] Message editing and regeneration
- [ ] Conversation branching
- [ ] Message bookmarking
- [ ] Chat export (markdown, JSON)
- [ ] Multi-modal support (images, files)
- [ ] Voice input/output integration

### Advanced Workflow Features
- [ ] Workflow templates library
- [ ] Visual workflow editor (drag-and-drop)
- [ ] Workflow scheduling (cron-like)
- [ ] Workflow triggers (webhooks, events)
- [ ] Parallel execution optimization
- [ ] Workflow analytics and insights

### Agent Improvements
- [ ] Agent capability tags with metadata
- [ ] Agent performance metrics dashboard
- [ ] Agent version history viewer
- [ ] Agent testing console
- [ ] Per-agent parameter defaults
- [ ] Agent collaboration patterns
- [ ] Agent skill composition

---

## 📋 TODO (Lower Priority - Polish & Enhancement)

---

## 📋 TODO (Lower Priority - Polish & Enhancement)

### UI/UX Polish
- [ ] Loading skeletons for all data fetching
- [ ] Toast notifications system
- [ ] Enhanced confirmation dialogs
- [ ] Smooth animation transitions
- [ ] Accessibility audit (ARIA, keyboard nav)
- [ ] Component refinements (buttons, inputs, modals)
- [ ] Typography consistency audit
- [ ] Color system refinements

### Data Management
- [ ] Workspace export/import
- [ ] Automated backup system
- [ ] Data migration tools
- [ ] Import from other platforms
- [ ] Data archiving system

### Analytics & Monitoring
- [ ] Usage statistics dashboard
- [ ] Token usage tracking
- [ ] Agent performance metrics
- [ ] Workflow execution analytics
- [ ] Error tracking and logging
- [ ] System health monitoring

### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Setup guide updates
- [ ] Architecture documentation
- [ ] Component library documentation
- [ ] User guide expansion
- [ ] Video tutorials

### Performance Optimization
- [ ] Virtualized lists for large datasets
- [ ] Lazy loading optimization
- [ ] Code splitting improvements
- [ ] Database query optimization
- [ ] Memory usage profiling
- [ ] Bundle size optimization

---

## 🐛 KNOWN ISSUES

### Critical
None currently - all blocking issues resolved

### Medium Priority
1. **Database**
   - better-sqlite3 native module requires rebuild for Electron (Windows)
   - Current workaround: Working for dev environment

2. **UI Polish Needed**
   - Some empty states need better design
   - Loading states could be more consistent
   - Error messages need standardization

3. **Missing Backend Implementation**
   - MCP Tools Server backend not implemented (UI ready)
   - Workflow execution engine needs approval gates
   - Memory storage backend pending
   - Library sync system pending

---

## 📊 FILE STRUCTURE & KEY LOCATIONS

### Pages (Updated Architecture)
- `app/page.tsx` - Homepage with navigation
- `app/workflows/page.tsx` - Staged workflow automation (UI complete)
- `app/tools/page.tsx` - MCP Tools Server interface (UI complete)
- `app/library/page.tsx` - Reusable components library (UI complete)
- `app/memory/page.tsx` - Persistent memory system (UI complete)
- `app/models/page.tsx` - Ollama endpoint management (UI complete)
- `app/help/page.tsx` - In-app documentation (UI complete)
- `app/chats/page.tsx` - Chat interface (functional)
- `app/agents/page.tsx` - Agent management (functional)
- `app/templates/page.tsx` - Template library (functional)
- `app/crews/page.tsx` - Multi-agent workflows (functional)
- `app/settings/page.tsx` - Application settings (functional)

### Components
- `components/layout/Sidebar.tsx` - Navigation sidebar (updated)
- `components/ui/` - Reusable UI components
- `components/workflows/` - Workflow components (new)
- `components/tools/` - Tools Server components (new)
- `components/library/` - Library components (new)
- `components/memory/` - Memory components (new)
- `components/chat/` - Chat components
- `components/agents/` - Agent components
- `components/templates/` - Template components

### State Management
- `lib/stores/workflows.ts` - **TODO: Create**
- `lib/stores/tools.ts` - **TODO: Create**
- `lib/stores/memory.ts` - **TODO: Create**
- `lib/stores/library.ts` - **TODO: Create**
- `lib/stores/templates.ts` - Template store
- `lib/stores/agents.ts` - Agent store
- `lib/stores/settings.ts` - Settings store
- `lib/stores/ui.ts` - UI state

### API Routes (To Be Created)
- `app/api/tools/` - Tool registration and execution
- `app/api/workflows/` - Workflow execution with gates
- `app/api/memory/` - Memory storage and retrieval
- `app/api/library/` - Library components and sync
- `app/api/themes/` - Theme management

### Libraries & Utilities
- `lib/providers/` - LLM provider implementations
- `lib/prompts/` - Prompt composition
- `lib/db/` - Database layer (SQLite)
- `lib/workflows/` - Workflow execution (existing crew system)
- `lib/mcp/` - **TODO: Create MCP protocol implementation**
- `types/index.ts` - TypeScript types

---

## 🎯 NEXT IMMEDIATE STEPS (Priority Order)

### Sprint 3 Focus: Backend Implementation
1. **MCP Tools Server Backend** (Week 1-2)
   - Design MCP protocol adapter
   - Implement tool registration API
   - Build tool execution engine
   - Add security/sandboxing
   - Test with standard MCP tools

2. **Workflow Execution Engine** (Week 3-4)
   - Design approval gate system
   - Implement stage execution
   - Add pause/resume functionality
   - Build rollback mechanism
   - Wire to Workflows UI

3. **Memory Storage Backend** (Week 5-6)
   - Design memory schema
   - Implement storage API
   - Add indexing and search
   - Build visualization API
   - Wire to Memory UI

4. **Library System API** (Week 7-8)
   - Design library schema
   - Implement sync system
   - Add versioning
   - Build search/filter
   - Wire to Library UI

5. **Testing & Polish** (Week 9-10)
   - Integration testing
   - Performance optimization
   - Bug fixes
   - Documentation updates
   - User feedback incorporation

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

**Overall Completion: ~70%**

### UI/Frontend: 95%
- ✅ All pages designed and implemented
- ✅ Navigation structure complete
- ✅ Component library mature
- ✅ Mobile responsiveness complete
- ✅ Command palette and shortcuts
- 🔨 Minor polish items remaining

### Backend/Core: 60%
- ✅ Database layer (SQLite)
- ✅ Chat and messaging system
- ✅ Agent management
- ✅ Crew execution (basic)
- ✅ Code execution sandbox
- 🔨 MCP Tools Server backend (pending)
- 🔨 Workflow approval gates (pending)
- 🔨 Memory storage backend (pending)
- 🔨 Library sync system (pending)

### Integration: 75%
- ✅ Ollama integration with streaming
- ✅ Command palette
- ✅ Markdown rendering
- ✅ Code execution
- ✅ Message persistence
- 🔨 Theme system (pending)
- 🔨 Export/import (pending)

### Architecture Upgrade (MCP Tools Server): 50%
- ✅ Complete UI redesign
- ✅ All new pages implemented (Workflows, Tools, Library, Memory, Models, Help)
- ✅ Updated navigation
- ✅ Screenshot documentation
- 🔨 Backend implementation (5 major components pending)

**Recent Session Accomplishments (MCP Tools Server Upgrade):**
- ✅ Designed and implemented 7 new pages
- ✅ Completely redesigned navigation structure
- ✅ Updated branding to "AI Automation Studio"
- ✅ Added comprehensive feature documentation
- ✅ Created screenshot gallery
- ✅ Updated README with new architecture
- ✅ Restructured TODO with clear Sprint 3 priorities

**Next Major Milestone: Sprint 3 - Backend Implementation**
- Focus: Implement backends for all new MCP Tools Server features
- Timeline: 10 weeks
- Deliverables: MCP Tools Server, Workflow Engine, Memory System, Library API, Theme System

---

**Last Updated:** [Current Date - MCP Tools Server Architecture Upgrade]
