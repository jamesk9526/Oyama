# Oyama - Development Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Building](#building)
7. [Contributing](#contributing)
8. [Release Process](#release-process)

## Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: Latest version
- **Ollama**: For local LLM testing (optional)
- **VS Code**: Recommended editor

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/jamesk9526/Oyama.git
cd Oyama

# Install dependencies
npm install

# Initialize database
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Development Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:electron     # Start with Electron desktop app

# Building
npm run build            # Build for production
npm run start            # Start production server
npm run build:desktop    # Build Electron app for all platforms
npm run dist:win         # Build Windows installer/portable

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed with sample data

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
npm run type-check       # Run TypeScript compiler check

# Utilities
npm run generate:icon    # Generate app icons from SVG
```

## Development Environment

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Environment Variables

Create `.env.local`:

```bash
# Ollama Configuration
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_api_key_here

# Database
DATABASE_PATH=./.data/oyama.db

# Development
NODE_ENV=development
DEBUG=oyama:*
```

## Project Structure

```
Oyama/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── agents/          # Agent CRUD
│   │   ├── templates/       # Template CRUD
│   │   ├── crews/           # Crew CRUD
│   │   ├── chats/           # Chat CRUD
│   │   ├── messages/        # Message CRUD
│   │   ├── workflows/       # Workflow execution
│   │   ├── chat/            # Chat streaming
│   │   ├── execute/         # Code execution
│   │   └── settings/        # Settings CRUD
│   ├── agents/              # Agent page
│   ├── chats/               # Chat page
│   ├── crews/               # Crews page
│   ├── playground/          # Playground page
│   ├── settings/            # Settings page
│   ├── templates/           # Templates page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── agents/              # Agent-specific components
│   ├── chat/                # Chat components
│   ├── crews/               # Crew components
│   ├── layout/              # Layout components
│   ├── settings/            # Settings components
│   ├── templates/           # Template components
│   ├── ui/                  # Reusable UI components
│   └── CommandPalette.tsx   # Command palette
├── lib/                     # Core libraries
│   ├── agents/              # Agent logic
│   ├── crews/               # Crew logic
│   ├── db/                  # Database layer
│   │   ├── client.ts        # DB connection
│   │   ├── queries.ts       # Query functions
│   │   └── schema.sql       # DB schema
│   ├── execution/           # Code execution sandbox
│   ├── prompts/             # Prompt composition
│   ├── providers/           # LLM providers
│   │   ├── ollama.ts        # Ollama integration
│   │   └── openai.ts        # OpenAI integration
│   ├── stores/              # Zustand state stores
│   │   ├── agents.ts        # Agent store
│   │   ├── crews.ts         # Crew store
│   │   ├── settings.ts      # Settings store
│   │   └── templates.ts     # Template store
│   ├── templates/           # Template logic
│   └── workflows/           # Workflow engine
│       ├── executor.ts      # Workflow executor
│       ├── types.ts         # Workflow types
│       └── index.ts         # Public API
├── types/                   # TypeScript types
│   └── index.ts             # Core type definitions
├── electron/                # Electron desktop app
│   ├── main.js              # Main process
│   └── preload.cjs          # Preload script
├── scripts/                 # Utility scripts
│   ├── migrate.js           # Database migration
│   ├── seed.js              # Database seeding
│   └── generate-icon.js     # Icon generation
├── public/                  # Static assets
├── .data/                   # SQLite database files
├── .gitignore              # Git ignore rules
├── .eslintrc.json          # ESLint configuration
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── README.md               # Project overview
├── ARCHITECTURE.md         # System architecture
├── API_REFERENCE.md        # API documentation
├── USER_GUIDE.md           # User documentation
└── DEVELOPMENT.md          # This file
```

### Key Directories Explained

#### `/app`
Next.js 14 App Router pages and API routes. Each directory is a route.

#### `/components`
React components organized by feature. Use `/ui` for reusable components.

#### `/lib`
Core business logic, utilities, and state management. Keep pure logic here.

#### `/types`
TypeScript type definitions. Maintain strict types for all data structures.

#### `/electron`
Electron-specific code for desktop application.

## Coding Standards

### TypeScript

- **Strict Mode**: Always enabled
- **No `any`**: Use `unknown` or proper types
- **Interface over Type**: Prefer interfaces for objects
- **Explicit Return Types**: On all functions

```typescript
// Good
interface Agent {
  id: string;
  name: string;
}

function getAgent(id: string): Agent | null {
  // implementation
}

// Bad
function getAgent(id: any): any {
  // implementation
}
```

### React Components

- **Function Components**: Use function components, not classes
- **TypeScript**: Type all props and state
- **Hooks**: Follow Rules of Hooks
- **Memoization**: Use React.memo for expensive components

```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary' 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};
```

### Naming Conventions

- **Components**: PascalCase (e.g., `AgentCard.tsx`)
- **Functions**: camelCase (e.g., `fetchAgents`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (e.g., `Agent`, `AgentRole`)
- **Files**: kebab-case for utilities (e.g., `db-client.ts`)

### File Organization

```typescript
// 1. Imports - external first, then internal
import { useState, useEffect } from 'react';
import { Agent } from '@/types';
import { useAgentsStore } from '@/lib/stores/agents';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Constants
const MAX_AGENTS = 100;

// 4. Component
export const MyComponent: React.FC<ComponentProps> = () => {
  // Hooks
  const [state, setState] = useState();
  const store = useAgentsStore();
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Event handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    // JSX
  );
};
```

### Code Comments

```typescript
/**
 * Fetches an agent by ID from the database
 * @param id - The agent's unique identifier
 * @returns The agent object or null if not found
 * @throws {DatabaseError} If database connection fails
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  // Implementation
}
```

### Styling

- **Tailwind CSS**: Use utility classes
- **Component Classes**: Use `clsx` for conditional classes
- **Custom Styles**: Only when Tailwind is insufficient
- **Responsive**: Mobile-first approach

```typescript
import { clsx } from 'clsx';

const buttonClasses = clsx(
  'px-4 py-2 rounded',
  variant === 'primary' && 'bg-blue-500 text-white',
  variant === 'secondary' && 'bg-gray-200 text-gray-800',
  disabled && 'opacity-50 cursor-not-allowed'
);
```

### Error Handling

```typescript
// API Routes
try {
  const result = await operation();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { 
      success: false, 
      error: 'Operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    },
    { status: 500 }
  );
}

// Components
try {
  await riskyOperation();
  setSuccess(true);
} catch (error) {
  setError(error instanceof Error ? error.message : 'An error occurred');
}
```

## Testing

### Unit Tests (Future)

```typescript
// __tests__/lib/workflows/executor.test.ts
import { describe, it, expect } from '@jest/globals';
import { WorkflowExecutor } from '@/lib/workflows/executor';

describe('WorkflowExecutor', () => {
  it('should execute sequential workflow', async () => {
    const executor = new WorkflowExecutor();
    const result = await executor.execute({
      type: 'sequential',
      agents: ['agent-1', 'agent-2'],
      input: 'test'
    });
    
    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(2);
  });
});
```

### Integration Tests (Future)

```typescript
// __tests__/api/agents.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Agents API', () => {
  it('should create an agent', async () => {
    const response = await fetch('/api/agents', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        role: 'custom'
      })
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.agent.name).toBe('Test Agent');
  });
});
```

### Manual Testing

Before submitting PR:

1. **Build Test**: `npm run build` must pass
2. **Type Check**: `npm run type-check` must pass
3. **Lint**: `npm run lint` must pass
4. **Functionality**: Test all modified features
5. **Cross-browser**: Test in Chrome, Firefox, Safari
6. **Desktop App**: Test Electron if UI changes made

## Building

### Production Build

```bash
# Build Next.js application
npm run build

# Test production build locally
npm run start
```

### Desktop Build

```bash
# Generate app icons first
npm run generate:icon

# Build for current platform
npm run build:desktop

# Build for Windows
npm run dist:win

# Output in /dist directory
```

### Build Configuration

#### next.config.js

```javascript
module.exports = {
  output: 'export', // Static export
  images: {
    unoptimized: true
  },
  // ...
};
```

#### electron-builder

Configuration in `package.json`:

```json
{
  "build": {
    "appId": "com.oyama.app",
    "productName": "Oyama",
    "files": ["..."],
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}
```

## Contributing

### Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Pull Request Guidelines

#### PR Title Format

```
type(scope): description

Examples:
feat(agents): add agent cloning functionality
fix(chat): resolve streaming connection issue
docs(readme): update installation instructions
refactor(db): optimize query performance
```

#### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests (if applicable)
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Code Review Process

1. **Automated Checks**: CI runs linting, type checking, tests
2. **Reviewer Assignment**: Maintainer reviews code
3. **Feedback**: Address review comments
4. **Approval**: At least one approval required
5. **Merge**: Squash and merge to main

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

**Examples**:
```
feat(agents): add agent versioning
fix(chat): resolve message ordering bug
docs(api): update endpoint documentation
refactor(db): simplify query structure
```

## Release Process

### Version Numbering

Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

### Release Steps

1. **Update Version**: `npm version [major|minor|patch]`
2. **Update CHANGELOG**: Document changes
3. **Create Tag**: `git tag -a v1.2.3 -m "Release v1.2.3"`
4. **Push**: `git push && git push --tags`
5. **Build**: `npm run build:desktop`
6. **Create Release**: GitHub Releases with binaries
7. **Announce**: Update README, post in community

### Changelog Format

```markdown
## [1.2.3] - 2026-01-21

### Added
- Agent cloning functionality
- Template interpolation API

### Changed
- Improved chat streaming performance
- Updated UI for better accessibility

### Fixed
- Database connection issue
- Memory leak in workflow executor

### Deprecated
- Old agent API endpoints (use v2)

### Removed
- Legacy prompt system

### Security
- Fixed XSS vulnerability in chat input
```

## Development Best Practices

### Performance

1. **Lazy Loading**: Use dynamic imports for large components
2. **Memoization**: Use React.memo, useMemo, useCallback
3. **Database**: Use indexes, prepared statements
4. **Bundle Size**: Analyze with `next/bundle-analyzer`

### Security

1. **Input Validation**: Validate all user inputs
2. **SQL Injection**: Use prepared statements only
3. **XSS**: Use React's built-in escaping
4. **Secrets**: Never commit API keys or secrets
5. **Dependencies**: Regularly update and audit

### Accessibility

1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Labels**: Add labels for screen readers
3. **Keyboard Navigation**: Ensure all features keyboard-accessible
4. **Color Contrast**: Meet WCAG AA standards
5. **Focus Indicators**: Visible focus states

### Documentation

1. **Code Comments**: Explain complex logic
2. **JSDoc**: Document public APIs
3. **README**: Keep up to date
4. **Changelogs**: Document all changes
5. **Examples**: Provide usage examples

## Common Tasks

### Adding a New Agent Role

1. Update `types/index.ts`:
```typescript
export type AgentRole = 
  | 'planner' 
  | 'researcher'
  // ... existing roles
  | 'newrole';
```

2. Add preset in `components/agents/AgentBuilder.tsx`:
```typescript
const rolePresets: Record<AgentRole, {...}> = {
  // ... existing presets
  newrole: {
    icon: '🆕',
    prompt: 'You are a...',
    description: 'Does...'
  }
};
```

3. Add color in `components/agents/AgentCard.tsx`:
```typescript
const roleColors: Record<AgentRole, string> = {
  // ... existing colors
  newrole: 'bg-color-500/10 text-color-300/90 border-color-500/20'
};
```

### Adding a New API Endpoint

1. Create file `app/api/newfeature/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed' },
      { status: 500 }
    );
  }
}
```

2. Add types to `types/index.ts`
3. Update API documentation in `API_REFERENCE.md`
4. Add tests (when testing framework is set up)

### Adding a New UI Component

1. Create component file `components/ui/NewComponent.tsx`:
```typescript
import React from 'react';

interface NewComponentProps {
  // Props
}

export const NewComponent: React.FC<NewComponentProps> = (props) => {
  return (
    // JSX
  );
};
```

2. Export from `components/ui/index.ts` (if exists)
3. Add Storybook story (future)
4. Add tests (future)

## Debugging

### VS Code Debug Configuration

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Debug Logging

```typescript
// Enable debug logging
const DEBUG = process.env.DEBUG === 'true';

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}
```

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Electron Docs](https://www.electronjs.org/docs)

### Tools
- [VS Code](https://code.visualstudio.com)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Ollama](https://ollama.ai)

### Community
- [GitHub Discussions](https://github.com/jamesk9526/Oyama/discussions)
- [GitHub Issues](https://github.com/jamesk9526/Oyama/issues)

## License

See [LICENSE](./LICENSE) for license information.

---

Happy coding! 🚀
