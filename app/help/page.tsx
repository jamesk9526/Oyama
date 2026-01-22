'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HelpCircle, Search, Book, Video, FileText, ExternalLink } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: 'chat',
    title: 'Using the Chat Interface',
    category: 'Chat',
    description: 'Learn how to interact with agents through chat',
    content: `
## What is Chat?

The Chat interface provides an interactive way to communicate with AI agents. You can:
- Send messages to agents
- Receive streaming responses in real-time
- View conversation history
- Execute code in messages

## When to use it

Use Chat for:
- Quick questions and answers
- Interactive problem-solving
- Testing agent behavior
- Ad-hoc tasks that don't require workflows

## How it works

1. Select an agent from the dropdown
2. Choose a model/provider
3. Type your message and press Send
4. Watch the response stream in real-time

## Common mistakes

- Forgetting to select an agent before sending
- Not configuring Ollama URL in Settings
- Expecting instant responses (streaming takes time)
    `
  },
  {
    id: 'agents',
    title: 'Creating and Managing Agents',
    category: 'Agents',
    description: 'Build specialized AI agents for different tasks',
    content: `
## What are Agents?

Agents are specialized AI workers with:
- A name and role
- Custom system prompts
- Specific capabilities
- Tool permissions
- Memory access controls

## When to use them

Create agents for:
- Recurring tasks (Research Agent, Writing Agent)
- Specialized domains (Code Reviewer, Data Analyst)
- Different communication styles (Formal, Casual)

## How they work

Agents use system prompts to define their behavior. You can:
- Set temperature and creativity levels
- Grant tool access
- Configure memory scope
- Assign to crews

## Examples

- **Research Agent**: High creativity, web search tools
- **Code Reviewer**: Low temperature, code analysis tools
- **Writer**: Medium creativity, document tools
    `
  },
  {
    id: 'crews',
    title: 'Multi-Agent Crews',
    category: 'Crews',
    description: 'Orchestrate multiple agents to collaborate on tasks',
    content: `
## What are Crews?

Crews coordinate multiple agents to work together on complex tasks. They support:
- Sequential execution (one after another)
- Parallel execution (simultaneously)
- Manager-led orchestration
- Consensus voting

## When to use them

Use crews for:
- Complex multi-step projects
- Tasks requiring different expertise
- Quality review processes
- Creative collaboration

## How they work

1. Create a crew with a goal
2. Add agents with specific roles
3. Define the workflow type
4. Set conflict resolution rules
5. Execute and monitor

## Workflow Types

- **Sequential**: Output from one agent feeds into the next
- **Parallel**: All agents work simultaneously
- **Manager-led**: A manager agent coordinates others
- **Consensus**: Agents vote on decisions
    `
  },
  {
    id: 'workflows',
    title: 'Staged Workflows',
    category: 'Workflows',
    description: 'Long-running automations with approval gates',
    content: `
## What are Workflows?

Workflows are multi-stage automations with:
- Defined goals
- Ordered stages
- Human approval gates
- Artifact generation
- Resume/fork capability

## When to use them

Use workflows for:
- Long-running projects (writing a book)
- Multi-day tasks with checkpoints
- Processes requiring human oversight
- Tasks that produce artifacts

## How they work

1. Define workflow stages
2. Configure approval requirements
3. Start execution
4. Review and approve at checkpoints
5. Collect artifacts

## Lifecycle

Draft → Planning → Stage 1 → Approval → Stage 2 → Approval → ... → Completed

## Example: Writing a Book

1. Understand theme (approval)
2. Research topics (approval)
3. Generate outline (approval)
4. Draft chapters (approval per chapter)
5. Editing pass (approval)
6. Compilation (final approval)
    `
  },
  {
    id: 'tools-server',
    title: 'MCP Tools Server',
    category: 'Tools Server',
    description: 'Local tool orchestration engine',
    content: `
## What is the MCP Tools Server?

A local, embedded MCP-compatible tool orchestration engine that:
- Runs fully locally
- Exposes tools to agents & crews
- Tracks stages, memory, artifacts, and approvals
- Is inspectable and interruptible
- Uses only open-source tools

## When to use it

The Tools Server:
- Automatically registers available tools
- Manages tool permissions
- Logs all tool calls
- Tracks active workflows

## How it works

Tools are registered from the /tools directory. Each tool has:
- A name and description
- Input/output schemas
- Permission requirements
- Open-source validation

## Tool Categories

- File system tools
- Markdown processors
- Text analyzers
- Code generators
- Search tools
- Exporters (MD, JSON, PDF)

## Important Rules

ALL tools must be open source. No closed APIs or proprietary binaries.
    `
  },
  {
    id: 'memory',
    title: 'Memory System',
    category: 'Memory',
    description: 'Persistent, inspectable memory',
    content: `
## What is the Memory System?

Persistent storage for agents and workflows with:
- Short-term (session) memory
- Long-term (indexed) memory
- Project-scoped memory
- Agent-scoped memory
- Crew-shared memory

## When to use it

Memory is used for:
- Storing conversation context
- Remembering user preferences
- Tracking project facts
- Sharing information between agents

## How it works

Memory can be:
- Scanned from conversation history
- Extracted as facts
- Stored with relevance scores
- Retrieved when needed
- Edited or deleted

## Memory Types

- **Short-term**: Current session only
- **Long-term**: Persists across sessions
- **Project**: Scoped to a project
- **Agent**: Private to an agent
- **Crew**: Shared by crew members

## Approval System

All memory writes require approval. You can:
- Approve or reject new memories
- Edit existing memories
- Delete outdated memories
- Tag memories for organization
    `
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = helpArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(helpArticles.map(a => a.category)));

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Help & Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Learn how to use Oyama effectively
            </p>
          </div>
        </div>

        {/* Info Panel */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Getting Help</p>
                <p className="text-muted-foreground mt-1">
                  Look for the <HelpCircle className="inline w-3 h-3" /> icon throughout the app for 
                  context-sensitive help. This page provides comprehensive documentation for all features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Articles List */}
          <div className="md:col-span-1 space-y-2">
            <h2 className="text-lg font-semibold mb-3">Topics</h2>
            {categories.map(category => (
              <div key={category} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1">
                  {category}
                </p>
                {filteredArticles
                  .filter(a => a.category === category)
                  .map(article => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedArticle?.id === article.id
                          ? 'bg-accent text-foreground'
                          : 'hover:bg-accent/40 text-muted-foreground'
                      }`}
                    >
                      {article.title}
                    </button>
                  ))}
              </div>
            ))}
          </div>

          {/* Article Content */}
          <div className="md:col-span-2">
            {selectedArticle ? (
              <Card>
                <CardHeader>
                  <Badge variant="default" className="w-fit">{selectedArticle.category}</Badge>
                  <CardTitle className="text-2xl mt-2">{selectedArticle.title}</CardTitle>
                  <CardDescription>{selectedArticle.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {selectedArticle.content.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
                      } else if (line.startsWith('- ')) {
                        return <li key={i} className="ml-4">{line.slice(2)}</li>;
                      } else if (line.match(/^\d+\./)) {
                        return <li key={i} className="ml-4 list-decimal">{line.slice(line.indexOf('.') + 1)}</li>;
                      } else if (line.startsWith('**')) {
                        const match = line.match(/\*\*(.+?)\*\*: (.+)/);
                        if (match) {
                          return <p key={i} className="mb-2"><strong>{match[1]}:</strong> {match[2]}</p>;
                        }
                      }
                      return line ? <p key={i} className="mb-2">{line}</p> : <br key={i} />;
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Book className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Select a topic</p>
                  <p className="text-muted-foreground text-sm">
                    Choose a help article from the list to view its content
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors text-left">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Documentation</p>
                  <p className="text-xs text-muted-foreground">Full technical docs</p>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </button>
              <button className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors text-left">
                <Video className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Video Tutorials</p>
                  <p className="text-xs text-muted-foreground">Step-by-step guides</p>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </button>
              <button className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors text-left">
                <Book className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Examples</p>
                  <p className="text-xs text-muted-foreground">Sample workflows</p>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
