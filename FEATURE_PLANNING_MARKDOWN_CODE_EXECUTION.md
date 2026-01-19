# Feature Planning: Markdown & Code Execution

**Document:** Architectural planning and implementation strategy  
**Date:** January 18, 2026  
**Status:** Planning phase - Ready for Sprint 2 implementation

---

## Part 1: Markdown Rendering in Chat Messages

### Current State
- Chat messages are plain text strings
- Assistant responses are not formatted
- No code highlighting or special formatting

### Requirements
The markdown rendering feature should support:
- ✅ Basic markdown (bold, italic, strikethrough)
- ✅ Code blocks with syntax highlighting
- ✅ Inline code snippets
- ✅ Lists (ordered and unordered)
- ✅ Tables
- ✅ Links and images
- ✅ Blockquotes
- ✅ Headers

### Implementation Plan

#### Phase 1: Setup & Basic Rendering
**Estimated Effort:** 2-3 hours

**Step 1.1: Install Dependencies**
```bash
npm install react-markdown remark-gfm remark-math rehype-katex rehype-highlight
```

**Dependencies:**
- `react-markdown@^8.0.0` - Core markdown renderer
- `remark-gfm@^4.0.0` - GitHub Flavored Markdown support
- `remark-math@^5.0.0` - LaTeX math support
- `rehype-katex@^6.0.0` - LaTeX rendering
- `rehype-highlight@^7.0.0` - Syntax highlighting

**Step 1.2: Create ChatMessage Component Update**
```typescript
// components/chat/ChatMessage.tsx (new or updated)

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  return (
    <div className={`flex gap-3 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
      
      <div className="flex-1">
        {/* Markdown content */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
          components={{
            code: CodeBlockComponent,
            pre: PreComponent,
            table: TableComponent,
            // ... other custom components
          }}
        >
          {content}
        </ReactMarkdown>
        
        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1">
          {timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
```

#### Phase 2: Code Block Enhancements
**Estimated Effort:** 2-3 hours

**Step 2.1: Code Block Component**
```typescript
// components/chat/CodeBlock.tsx

interface CodeBlockProps {
  language?: string;
  children: string;
}

export function CodeBlock({ language = 'text', children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative bg-secondary rounded-lg overflow-hidden">
      {/* Header with language and copy button */}
      <div className="flex justify-between items-center px-4 py-2 bg-secondary border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">
          {language}
        </span>
        <button
          onClick={copyToClipboard}
          className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      {/* Code content */}
      <pre className="p-4 overflow-x-auto">
        <code className={`language-${language}`}>
          {children}
        </code>
      </pre>
    </div>
  );
}
```

**Step 2.2: Syntax Highlighting Setup**
- Use `rehype-highlight` for automatic syntax highlighting
- Install highlight.js: `npm install highlight.js`
- Apply dark theme CSS from highlight.js
- Support for 100+ programming languages

#### Phase 3: Specialized Components
**Estimated Effort:** 2-3 hours

**Step 3.1: Table Component**
```typescript
export function TableComponent({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="border-collapse border border-border">
        {children}
      </table>
    </div>
  );
}
```

**Step 3.2: Link Component**
```typescript
export function LinkComponent({ href, children }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  );
}
```

**Step 3.3: Math/LaTeX Component**
```typescript
// For math rendering using katex
// Automatically handled by rehype-katex
// Supports both inline $x = y$ and block $$ ... $$
```

#### Phase 4: Integration & Testing
**Estimated Effort:** 1-2 hours

**Step 4.1: Update Chat Page**
- Replace plain text message display with ChatMessage component
- Pass markdown content directly
- Ensure styling matches rest of application

**Step 4.2: Testing Scenarios**
```markdown
# Test Cases

1. **Simple markdown:**
   - **bold** text
   - *italic* text
   - ~~strikethrough~~

2. **Code blocks:**
   ```javascript
   function hello() {
     console.log("world");
   }
   ```

3. **Lists:**
   - Item 1
   - Item 2
   1. Numbered
   2. Items

4. **Links & images:**
   [Link text](https://example.com)
   ![Alt text](image.jpg)

5. **Tables:**
   | Header 1 | Header 2 |
   |----------|----------|
   | Cell 1   | Cell 2   |

6. **Math:**
   $E = mc^2$
```

### File Structure
```
components/
├── chat/
│   ├── ChatMessage.tsx          (new - markdown renderer)
│   ├── CodeBlock.tsx            (new - syntax highlighting)
│   ├── TableComponent.tsx       (new - table styling)
│   └── MathComponent.tsx        (new - LaTeX rendering)
└── ...

app/chats/
└── page.tsx                      (update to use ChatMessage)
```

### CSS & Styling
- Create `styles/highlight.css` - Import highlight.js theme
- Create `styles/markdown.css` - Custom markdown styling
- Ensure dark mode compatibility
- Match existing design system (Tailwind + CSS variables)

---

## Part 2: Code Execution / Sandbox Feature

### Current State
- Users can see code in chat messages
- No ability to execute code
- No interactive playground

### Requirements
The code execution feature should support:
- ✅ Running JavaScript/TypeScript code
- ✅ Running Python code
- ✅ Running shell scripts
- ✅ Safe sandboxed execution (no access to system)
- ✅ Timeout protection (prevent infinite loops)
- ✅ Output capture (stdout/stderr)
- ✅ Error handling and reporting
- ✅ Resource limits (memory, CPU time)

### Architectural Options

#### Option A: Worker Threads (Recommended for Simple Cases)
**Pros:**
- ✅ No external dependencies
- ✅ Fast execution
- ✅ Same machine (Electron)
- ✅ Good for JavaScript/Node.js

**Cons:**
- ❌ Limited to Node.js/JavaScript
- ❌ Not fully isolated (shared memory)
- ❌ No automatic cleanup

**Implementation:**
```typescript
// lib/execution/worker-sandbox.ts
import { Worker } from 'worker_threads';

export async function executeCode(
  code: string,
  language: string,
  timeout: number = 5000
): Promise<{ stdout: string; stderr: string; error?: string }> {
  
  return new Promise((resolve, reject) => {
    const worker = new Worker('./code-executor.worker.js');
    
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Code execution timeout'));
    }, timeout);
    
    worker.on('message', (result) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    });
    
    worker.on('error', reject);
    worker.send({ code, language });
  });
}
```

**Use Case:** 
- JavaScript/TypeScript testing
- Quick calculations
- Debugging agent responses

---

#### Option B: Docker Containers (Recommended for Production)
**Pros:**
- ✅ Fully isolated and secure
- ✅ Support multiple languages
- ✅ Resource limits (memory, CPU)
- ✅ Automatic cleanup
- ✅ Scalable to cloud services

**Cons:**
- ❌ Requires Docker installation
- ❌ Slower startup time (~200ms per execution)
- ❌ More complex setup

**Implementation:**
```typescript
// lib/execution/docker-sandbox.ts
import { exec } from 'child_process';

export async function executeCode(
  code: string,
  language: string,
  timeout: number = 5000
): Promise<{ stdout: string; stderr: string; error?: string }> {
  
  const container = await startContainer(language);
  
  try {
    const result = await runCodeInContainer(container, code, timeout);
    return result;
  } finally {
    await stopContainer(container);
  }
}

// Docker images needed:
// - node:20-alpine (JavaScript/TypeScript)
// - python:3.11-alpine (Python)
// - ruby:3.2-alpine (Ruby)
// - go:1.21-alpine (Go)
```

**Docker Compose Example:**
```yaml
version: '3.8'
services:
  code-executor:
    image: node:20-alpine
    cpus: '0.5'
    mem_limit: '128m'
    read_only: true
    tmpfs:
      - /tmp
    environment:
      - NODE_ENV=production
```

**Use Case:**
- Production deployment
- Multi-language support
- Maximum security
- Horizontal scaling

---

#### Option C: WebAssembly VM (Future Enhancement)
**Pros:**
- ✅ No external dependencies
- ✅ Browser-compatible
- ✅ Lightweight
- ✅ Great for small snippets

**Cons:**
- ❌ Limited to WASM-compatible languages
- ❌ Limited standard library access
- ❌ Still early technology

**Implementation:**
```typescript
// Future: Using Wasmtime or WASMER
// Current ecosystem: Limited for practical use
```

**Use Case:**
- Future enhancement for browser-based execution
- Lightweight sandboxing

---

### Recommended Approach: Hybrid Strategy

**Phase 1 (MVP - Sprint 2):** Worker Threads for JavaScript
- Fast, no external dependencies
- Good for testing LLM-generated code
- Works in Electron

**Phase 2 (Sprint 3):** Docker Support
- Add Docker execution option
- Support Python, JavaScript, etc.
- Use in production mode

**Phase 3 (Sprint 4+):** WebAssembly
- Browser-safe execution
- Cloud deployment option
- WASM pool management

### Implementation Plan

#### Phase 1: Worker Thread Executor (2-3 hours)
**Step 1.1: Create Executor Worker**
```typescript
// lib/execution/worker-executor.ts
import { parentPort, workerData } from 'worker_threads';
import vm from 'vm';

parentPort?.on('message', async (message) => {
  try {
    const context = {
      console: {
        log: (...args) => parentPort?.postMessage({ type: 'stdout', data: args }),
        error: (...args) => parentPort?.postMessage({ type: 'stderr', data: args }),
      },
      // ... other sandbox globals
    };
    
    const script = new vm.Script(message.code);
    const result = script.runInNewContext(context, { timeout: 5000 });
    
    parentPort?.postMessage({ type: 'complete', result });
  } catch (error) {
    parentPort?.postMessage({ type: 'error', error: error.message });
  }
});
```

**Step 1.2: Create Execution Service**
```typescript
// lib/execution/executor.ts
import { Worker } from 'worker_threads';

export class CodeExecutor {
  async execute(code: string, language: string): Promise<ExecutionResult> {
    // Validate language
    // Create worker
    // Execute with timeout
    // Capture output
    // Return result
  }
}
```

**Step 1.3: Integrate with Chat**
```typescript
// components/chat/CodeBlock.tsx
const [executing, setExecuting] = useState(false);
const [result, setResult] = useState<ExecutionResult | null>(null);

const handleExecute = async () => {
  setExecuting(true);
  try {
    const result = await executor.execute(children, language);
    setResult(result);
  } finally {
    setExecuting(false);
  }
};

return (
  <div>
    <CodeBlock>{children}</CodeBlock>
    <button onClick={handleExecute}>
      {executing ? 'Running...' : 'Run Code'}
    </button>
    {result && <ExecutionOutput result={result} />}
  </div>
);
```

#### Phase 2: Docker Executor (3-4 hours)
**Step 2.1: Docker Service Integration**
```typescript
// lib/execution/docker-executor.ts
export class DockerExecutor {
  async execute(code: string, language: string): Promise<ExecutionResult> {
    const dockerfile = this.generateDockerfile(language);
    const containerId = await this.startContainer(dockerfile);
    const result = await this.runCode(containerId, code);
    await this.stopContainer(containerId);
    return result;
  }
}
```

**Step 2.2: Supported Languages**
- JavaScript (node:20-alpine)
- Python (python:3.11-alpine)
- Ruby (ruby:3.2-alpine)
- Go (go:1.21-alpine)
- Rust (rust:1.74-alpine)
- Java (eclipse-temurin:21-jdk-alpine)

**Step 2.3: Language Detection**
```typescript
const LANGUAGE_CONFIG = {
  'javascript': { docker: 'node:20-alpine', timeout: 5000 },
  'python': { docker: 'python:3.11-alpine', timeout: 10000 },
  'ruby': { docker: 'ruby:3.2-alpine', timeout: 5000 },
  // ... more
};
```

#### Phase 3: UI Components (2-3 hours)
**Step 3.1: Execution Output Display**
```typescript
// components/chat/ExecutionOutput.tsx
export function ExecutionOutput({ result }: { result: ExecutionResult }) {
  return (
    <div className="mt-4 bg-secondary rounded p-4 border border-border">
      {result.stdout && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Output</h4>
          <pre className="text-sm overflow-auto max-h-40">
            {result.stdout}
          </pre>
        </div>
      )}
      {result.stderr && (
        <div className="mt-2 text-red-500">
          <h4 className="text-sm font-semibold mb-2">Error</h4>
          <pre className="text-sm overflow-auto max-h-40">
            {result.stderr}
          </pre>
        </div>
      )}
      {result.error && (
        <div className="text-red-500">
          <h4 className="text-sm font-semibold mb-2">Execution Error</h4>
          <p className="text-sm">{result.error}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 3.2: Run Button Integration**
- Add "Run" button to code blocks
- Show loading state during execution
- Display output inline in chat
- Handle errors gracefully

#### Phase 4: Safety & Limits (2-3 hours)
**Step 4.1: Resource Limits**
- Timeout: 5-10 seconds (configurable)
- Memory limit: 128MB
- Disk I/O limits
- Network access: Disabled

**Step 4.2: Code Sanitization**
```typescript
// lib/execution/sanitizer.ts
const BLOCKED_IMPORTS = [
  'fs', 'path', 'os', 'child_process', 'net',
  'http', 'https', 'vm', 'repl', 'crypto'
];

function sanitizeCode(code: string): boolean {
  for (const blocked of BLOCKED_IMPORTS) {
    if (code.includes(`require('${blocked}')`)) {
      throw new Error(`Blocked import: ${blocked}`);
    }
  }
  return true;
}
```

**Step 4.3: Execution Policies**
```typescript
export interface ExecutionPolicy {
  maxTimeout: number;
  maxMemory: number;
  allowedLanguages: string[];
  enableNetworking: boolean;
  enableFileAccess: boolean;
}

const DEFAULT_POLICY: ExecutionPolicy = {
  maxTimeout: 5000,
  maxMemory: 128 * 1024 * 1024,
  allowedLanguages: ['javascript', 'python'],
  enableNetworking: false,
  enableFileAccess: false,
};
```

### File Structure
```
lib/execution/
├── executor.ts              (main interface)
├── worker-executor.ts       (Phase 1 - Node worker)
├── docker-executor.ts       (Phase 2 - Docker)
├── wasm-executor.ts         (Phase 3 - WebAssembly)
├── sanitizer.ts             (code validation)
├── policies.ts              (execution policies)
└── types.ts                 (interfaces)

components/chat/
├── ExecutionOutput.tsx      (result display)
├── RunButton.tsx            (run code UI)
└── CodeBlock.tsx            (enhanced with run button)
```

### API Route
```typescript
// app/api/execute/route.ts
export async function POST(req: Request) {
  const { code, language } = await req.json();
  
  try {
    const result = await executor.execute(code, language);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

---

## Implementation Timeline

### Sprint 2 (Next 1-2 weeks)
**Week 1:**
- ✅ Markdown rendering (Phase 1-3)
- ✅ Code execution worker threads (Phase 1)
- ✅ Basic UI integration

**Week 2:**
- ✅ Testing and bug fixes
- ✅ Docker executor setup (Phase 2)
- ✅ Multi-language support

### Sprint 3 (Following 1-2 weeks)
- Production Docker deployment
- Performance optimization
- Cloud deployment options
- WebAssembly exploration

---

## Dependencies to Install

**For Markdown:**
```bash
npm install react-markdown remark-gfm remark-math rehype-katex rehype-highlight highlight.js
```

**For Code Execution (Phase 1):**
```bash
# No additional npm packages needed (uses built-in worker_threads)
```

**For Docker (Phase 2):**
```bash
npm install dockerode
```

---

## Testing & Validation

### Markdown Rendering
```markdown
1. Test all markdown syntax
2. Test code block syntax highlighting
3. Test LaTeX math rendering
4. Test table rendering
5. Cross-browser testing
6. Mobile responsiveness
```

### Code Execution
```
1. Test JavaScript execution
2. Test error handling
3. Test timeout protection
4. Test memory limits
5. Test concurrent executions
6. Test Docker container cleanup
7. Stress test with 100+ executions
```

---

## Success Criteria

### Markdown Feature
- [ ] All markdown elements render correctly
- [ ] Code blocks show syntax highlighting
- [ ] Copy button works on code blocks
- [ ] Links are clickable
- [ ] Tables are responsive
- [ ] Math renders correctly
- [ ] Mobile friendly

### Code Execution Feature
- [ ] JavaScript code executes safely
- [ ] Output captured and displayed
- [ ] Errors handled gracefully
- [ ] Timeout protection works
- [ ] Docker containers auto-cleanup
- [ ] Multiple executions don't interfere
- [ ] Resource limits enforced

---

## Next Steps

1. **Approve Architecture** - Review this document with team
2. **Create Sprint 2 Tasks** - Break into Jira/GitHub issues
3. **Setup Development Environment** - Install Docker if needed
4. **Begin Phase 1** - Markdown rendering
5. **Test Thoroughly** - QA validation

---

**Document Status:** Ready for implementation  
**Author:** Development Team  
**Reviewed:** Pending team discussion
