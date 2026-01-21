# Oyama - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [First-Time Setup](#first-time-setup)
3. [Understanding Agents](#understanding-agents)
4. [Creating Your First Agent](#creating-your-first-agent)
5. [Working with Templates](#working-with-templates)
6. [Chat Interface](#chat-interface)
7. [Multi-Agent Crews](#multi-agent-crews)
8. [Workflows](#workflows)
9. [Settings and Configuration](#settings-and-configuration)
10. [Tips and Best Practices](#tips-and-best-practices)
11. [Troubleshooting](#troubleshooting)

## Getting Started

Welcome to Oyama! This guide will help you get started with building and orchestrating AI agents.

### What is Oyama?

Oyama is a local-first AI agent collaboration platform that lets you:
- Create specialized AI agents with custom behaviors
- Build multi-agent workflows
- Chat with AI assistants
- Create reusable prompt templates
- Execute code securely in a sandbox

### Prerequisites

Before you begin, make sure you have:
1. **Node.js 18+** installed
2. **Ollama** installed and running (for local AI models)
   ```bash
   # Install Ollama from https://ollama.ai
   # Pull a model:
   ollama pull llama2
   # Start Ollama:
   ollama serve
   ```

### Installation

```bash
# Clone the repository
git clone https://github.com/jamesk9526/Oyama.git
cd Oyama

# Install dependencies
npm install

# Start the development server
npm run dev

# Or run as desktop app
npm run dev:electron
```

Open http://localhost:3000 in your browser.

## First-Time Setup

### 1. Launch Oyama

When you first open Oyama, you'll see the home page with quick action buttons.

### 2. Configure Ollama

1. Go to **Settings** in the sidebar
2. Click on the **Providers** tab
3. Verify the Ollama URL (default: `http://localhost:11434`)
4. Click **Test Connection** to verify Ollama is running
5. Select a model from the dropdown (e.g., llama2)

### 3. Personalize Your System

1. In Settings, click the **Workspace** tab
2. Click **Run Setup Wizard**
3. Follow the wizard to:
   - Name your AI assistant
   - Set your user identifier
   - Configure your workspace

### 4. Explore the Interface

The main interface has several sections:

- **Home**: Welcome page with quick actions
- **Chats**: Talk to AI agents
- **Agents**: Create and manage AI agents
- **Templates**: Reusable prompt templates
- **Crews**: Multi-agent workflows
- **Playground**: Experimental workspace
- **Settings**: Configuration and preferences

## Understanding Agents

### What is an Agent?

An agent is a specialized AI assistant with:
- **Name**: A unique identifier (e.g., "Research Assistant")
- **Role**: Predefined specialty (e.g., researcher, coder, writer)
- **System Prompt**: Instructions defining behavior
- **Capabilities**: Skills like web, files, code, image
- **Model**: Which LLM to use (e.g., llama2)

### Agent Roles

Oyama includes 17 predefined roles:

1. **Planner**: Strategic planning and roadmaps
2. **Researcher**: Information gathering
3. **Writer**: Content creation
4. **Editor**: Content improvement
5. **Critic**: Critical analysis
6. **Coder**: Code writing and review
7. **QA**: Quality assurance
8. **Summarizer**: Information distillation
9. **Synthesizer**: Multi-source synthesis
10. **Debugger**: Issue investigation
11. **Analyst**: Data analysis
12. **DevOps**: Infrastructure
13. **Security**: Security assessment
14. **Designer**: UX/UI design
15. **Backend**: Backend development
16. **Product**: Product management
17. **Custom**: Your own custom behavior

Each role comes with an optimized system prompt and icon.

## Creating Your First Agent

### Step-by-Step Tutorial

1. **Navigate to Agents Page**
   - Click **Agents** in the sidebar
   - Click the **+ Create Agent** button

2. **Choose a Role**
   - Select a role from the dropdown (e.g., "Researcher")
   - The system prompt will auto-fill with role-specific instructions

3. **Customize Your Agent**
   
   **Basic Tab**:
   - **Name**: Give your agent a memorable name (e.g., "Market Researcher")
   - **Bio**: Short description of your agent's specialty
   - **System Prompt**: Edit or keep the default prompt
   - **Style Rules**: Optional guidelines for output format

   **Configuration Tab**:
   - **Model**: Choose your LLM (e.g., llama2)
   - **Provider**: Select Ollama or OpenAI
   - **Temperature**: Creativity level (0.0 = focused, 1.0 = creative)
   - **Top P**: Diversity of responses
   - **Max Tokens**: Maximum response length

   **Capabilities Tab**:
   - Check boxes for capabilities your agent needs:
     - **Web**: Internet search and scraping
     - **Files**: File system operations
     - **Code**: Code generation and execution
     - **Image**: Image generation and analysis

   **Appearance Tab**:
   - **Icon**: Choose an emoji or upload custom icon
   - **Color**: Select accent color for UI

4. **Save Your Agent**
   - Click **Save Agent**
   - Your agent appears in the agents list

### Example: Creating a Code Review Agent

```
Name: Senior Code Reviewer
Role: Coder
Bio: Experienced code reviewer focusing on best practices and security

System Prompt:
You are a senior software engineer with 10+ years of experience. 
Review code for:
- Code quality and readability
- Security vulnerabilities
- Performance issues
- Best practices
- Test coverage

Provide constructive feedback with specific examples.

Model: llama2
Temperature: 0.3 (focused and consistent)
Capabilities: [code]
```

## Working with Templates

### What are Templates?

Templates are reusable prompt structures with variables that you can fill in. They help you:
- Save commonly used prompts
- Maintain consistency
- Share prompts with team members
- Organize by category

### Creating a Template

1. **Navigate to Templates**
   - Click **Templates** in the sidebar
   - Click **+ Create Template**

2. **Fill in Details**
   - **Name**: Template name (e.g., "Email Response")
   - **Description**: What the template does
   - **Category**: productivity, communication, analysis, etc.
   - **Tags**: Keywords for searching (e.g., ["email", "professional"])

3. **Write Template Body**
   
   Use `{{variableName}}` for placeholders:
   ```
   Write a professional email response to:
   
   {{email_content}}
   
   Use a {{tone}} tone and keep it {{length}}.
   ```

4. **Define Variables**
   
   For each variable in your template:
   - **Name**: Variable identifier (e.g., "tone")
   - **Type**: string, number, boolean, or text
   - **Description**: Help text for the variable
   - **Required**: Is this variable mandatory?
   - **Default Value**: Optional default

5. **Save Template**
   - Click **Save**
   - Template appears in your library

### Using Templates

1. Find your template in the Templates page
2. Click **Test** to try it out
3. Fill in the variable values
4. The preview shows the interpolated result
5. Click **Use** to copy to chat

### Example Template: Meeting Summary

```
Name: Meeting Summary
Category: productivity
Tags: ["meeting", "summary", "notes"]

Body:
Summarize the following meeting notes into key points, 
action items, and decisions made:

{{meeting_notes}}

Format: {{format}}
Length: {{length}} words

Variables:
- meeting_notes: text, required, "The raw meeting notes"
- format: string, optional, "bullet points", "Format preference"
- length: number, optional, 200, "Summary length in words"
```

## Chat Interface

### Starting a Chat

1. **Navigate to Chats**
   - Click **Chats** in the sidebar
   - Or use the floating **+ New Chat** button

2. **Select an Agent**
   - Use the agent dropdown in the toolbar
   - Choose which agent you want to talk to

3. **Start Chatting**
   - Type your message in the input box
   - Press Enter or click Send
   - Watch the response stream in real-time

### Chat Features

#### Markdown Support

Chats support full GitHub Flavored Markdown:

- **Bold**: `**bold text**`
- **Italic**: `*italic text*`
- **Code**: `` `inline code` ``
- **Code Blocks**: ````javascript ...````
- **Lists**: `- item` or `1. item`
- **Links**: `[text](url)`
- **Tables**: Full table support
- **Math**: LaTeX equations

#### Code Execution

For JavaScript/TypeScript code blocks:
1. Click the **Run** button in the code block
2. See the output displayed below
3. View stdout, stderr, and return value

**Note**: Code execution is sandboxed and secure:
- 5-second timeout
- No network access
- No file system access
- No process manipulation

#### Message Actions

Each message has actions:
- **Copy**: Copy message content to clipboard
- **Regenerate**: Get a new response (assistant messages only)
- **Edit**: Edit your message (user messages only)

#### Attachments (Coming Soon)

Future versions will support:
- File uploads
- Image analysis
- Document processing

### Chat Management

#### Save Conversations

Chats are automatically saved to the database. Access them anytime from the chat list.

#### Clear Chat

Click the **Clear Chat** button to delete all messages in the current conversation.

#### Export Chat

Click **Export** to download chat history as:
- JSON (machine-readable)
- Markdown (human-readable)
- PDF (printable)

### Tips for Better Chats

1. **Be Specific**: Provide clear, detailed requests
2. **Use Context**: Reference previous messages
3. **Iterate**: Refine responses with follow-ups
4. **Try Different Agents**: Different agents excel at different tasks
5. **Adjust Temperature**: Lower for factual, higher for creative

## Multi-Agent Crews

### What is a Crew?

A crew is a group of agents working together on a task. Crews enable:
- Complex multi-step workflows
- Collaborative problem-solving
- Division of labor among specialists

### Creating a Crew

1. **Navigate to Crews**
   - Click **Crews** in the sidebar
   - Click **+ Create Crew**

2. **Configure Crew**
   - **Name**: Crew identifier (e.g., "Content Creation Team")
   - **Description**: What the crew does
   - **Workflow Type**: How agents collaborate

3. **Add Agents**
   - Click **Add Agent**
   - Select agents from your collection
   - Arrange them in order (for sequential workflows)

4. **Save Crew**
   - Click **Save Crew**
   - Crew appears in your crews list

### Workflow Types

#### Sequential Workflow

Agents process one after another:
```
Input → Agent 1 → Agent 2 → Agent 3 → Output
```

**Use Cases**:
- Content pipeline (writer → editor → critic)
- Analysis workflow (research → analyze → summarize)
- Development process (code → test → review)

**Example**:
```
Task: "Write a blog post about AI"

1. Writer: Drafts the post
2. Editor: Improves grammar and structure
3. Critic: Provides feedback and suggestions

Output: Polished blog post with feedback
```

#### Parallel Workflow

All agents process simultaneously:
```
        ┌─ Agent 1 ─┐
Input ──┼─ Agent 2 ─┼─→ Combined Output
        └─ Agent 3 ─┘
```

**Use Cases**:
- Multiple perspectives on same topic
- Competitive solutions
- Diverse ideation

**Example**:
```
Task: "Design a logo concept"

1. Designer A: Modern minimalist design
2. Designer B: Bold and colorful design
3. Designer C: Classic elegant design

Output: Three design options to choose from
```

#### Conditional Workflow

Agents execute based on conditions:
```
Input → Evaluate → Agent 1 (if condition)
                 └→ Agent 2 (otherwise)
```

**Use Cases**:
- Decision trees
- Error handling
- Adaptive responses

#### Round-Robin Workflow

Sequential processing with multiple rounds:
```
Round 1: Input → Agent 1 → Agent 2 → Agent 3
Round 2: Output → Agent 1 → Agent 2 → Agent 3
...
Round N: Final Output
```

**Use Cases**:
- Iterative refinement
- Consensus building
- Progressive improvement

### Executing a Crew

1. **Select Your Crew**
   - Go to Crews page
   - Click **Run** on a crew card

2. **Provide Input**
   - Enter your task or question
   - Adjust settings (rounds, model, temperature)

3. **Monitor Execution**
   - Watch each step execute in real-time
   - See individual agent outputs
   - View execution time for each step

4. **Review Results**
   - See the final output
   - Expand individual steps for details
   - Export results if needed

### Example Crew: Research Team

```
Name: Market Research Team
Workflow: Sequential
Agents:
1. Data Collector (Researcher)
2. Data Analyst (Analyst)
3. Report Writer (Writer)

Task: "Analyze the electric vehicle market in 2026"

Step 1 - Data Collector:
Gathers information about EV market trends, 
major players, sales data, and projections.

Step 2 - Data Analyst:
Analyzes the collected data, identifies patterns,
calculates growth rates, and creates insights.

Step 3 - Report Writer:
Synthesizes analysis into a professional report
with executive summary and recommendations.

Final Output: Comprehensive market research report
```

## Workflows

### Advanced Workflow Features

#### Workflow Configuration

When executing a crew, you can configure:

- **Model**: Which LLM to use for all agents
- **Temperature**: Creativity level (0.0 - 1.0)
- **Top P**: Response diversity (0.0 - 1.0)
- **Rounds**: Number of iterations (for round-robin)
- **Timeout**: Maximum execution time per agent

#### Viewing Run History

1. Go to **Crews** page
2. Click on a crew
3. Click **View Runs** to see execution history
4. Each run shows:
   - Input provided
   - Status (completed/failed)
   - Execution time
   - Individual step results

#### Run Management

- **View Details**: Click a run to see full details
- **Delete Run**: Remove old or failed runs
- **Export Run**: Download results as JSON or Markdown

## Settings and Configuration

### Workspace Settings

**Location**: Settings → Workspace tab

- **Workspace Name**: Your workspace identifier
- **Description**: Optional workspace description
- **Default Provider**: Ollama or OpenAI
- **Default Model**: Which model to use by default

### Provider Settings

**Location**: Settings → Providers tab

#### Ollama Configuration

- **Ollama URL**: Usually `http://localhost:11434`
- **Available Models**: Auto-detected when connected
- **Test Connection**: Verify Ollama is accessible

#### OpenAI Configuration (Future)

- **API Key**: Your OpenAI API key
- **Organization**: Optional organization ID
- **Model Selection**: gpt-3.5-turbo, gpt-4, etc.

### LLM Parameters

**Location**: Settings → Parameters tab

- **Temperature** (0.0 - 1.0):
  - 0.0: Focused and deterministic
  - 0.5: Balanced
  - 1.0: Creative and random

- **Top P** (0.0 - 1.0):
  - Controls diversity of responses
  - Lower = more focused vocabulary
  - Higher = more diverse language

- **Max Tokens**:
  - Maximum response length
  - Typical: 2048 for conversations
  - Higher for long-form content

### System Prompt

**Location**: Settings → System Prompt tab

The global system prompt is prepended to all conversations. Use it to:
- Set default behavior for all agents
- Define output format preferences
- Add organizational guidelines

**Example**:
```
You are a helpful, accurate, and professional AI assistant.
Always:
- Provide accurate information
- Cite sources when possible
- Admit when you don't know something
- Be concise but thorough
```

### Memory Settings (Future)

Configure how Oyama remembers context:
- Conversation history length
- Long-term memory storage
- Memory retrieval methods

## Tips and Best Practices

### Agent Creation

1. **Start with Roles**: Use predefined roles before creating custom ones
2. **Clear System Prompts**: Be specific about expected behavior
3. **Test Incrementally**: Start simple, add complexity gradually
4. **Name Consistently**: Use descriptive, memorable names
5. **Version Control**: Keep notes on prompt changes

### Template Design

1. **Use Variables**: Make templates flexible and reusable
2. **Provide Defaults**: Help users with sensible defaults
3. **Add Examples**: Include example inputs in descriptions
4. **Categorize**: Use consistent categories and tags
5. **Test Thoroughly**: Verify templates work with various inputs

### Crew Design

1. **Agent Diversity**: Mix different roles for better results
2. **Right Workflow**: Match workflow type to task
3. **Optimal Order**: In sequential workflows, order matters
4. **Manage Complexity**: Start with 2-3 agents, scale up
5. **Monitor Performance**: Review run history to optimize

### Chat Strategies

1. **Contextual Prompts**: Reference earlier messages
2. **Iteration**: Refine responses through follow-ups
3. **Agent Selection**: Choose the right agent for the task
4. **Temperature Tuning**: Adjust for task type
5. **Save Good Prompts**: Turn effective prompts into templates

### Performance Optimization

1. **Model Selection**: Use smaller models for simple tasks
2. **Prompt Length**: Keep prompts focused and concise
3. **Batch Operations**: Group related tasks
4. **Cache Results**: Save and reuse common outputs
5. **Monitor Usage**: Track what works best

## Troubleshooting

### Common Issues

#### Ollama Connection Failed

**Problem**: "Failed to connect to Ollama"

**Solutions**:
1. Verify Ollama is running: `ollama serve`
2. Check Ollama URL in Settings → Providers
3. Test with `curl http://localhost:11434/api/tags`
4. Restart Ollama service
5. Check firewall settings

#### No Models Available

**Problem**: Model dropdown is empty

**Solutions**:
1. Pull a model: `ollama pull llama2`
2. Verify models: `ollama list`
3. Restart Ollama
4. Click "Refresh Models" in Settings

#### Build Errors

**Problem**: `npm run build` fails

**Solutions**:
1. Delete `node_modules`: `rm -rf node_modules`
2. Delete `.next`: `rm -rf .next`
3. Reinstall: `npm install`
4. Check Node version: `node --version` (need 18+)
5. Try: `npm run build -- --debug`

#### Database Issues

**Problem**: "Database locked" or corruption

**Solutions**:
1. Close all Oyama instances
2. Delete `.data/oyama.db` (WARNING: deletes all data)
3. Restart application
4. Database will be recreated

#### Streaming Not Working

**Problem**: Messages don't stream, appear all at once

**Solutions**:
1. Check browser console for errors
2. Verify Ollama supports streaming
3. Try different model
4. Disable browser extensions
5. Check network tab in DevTools

#### Code Execution Errors

**Problem**: "Code execution failed"

**Solutions**:
1. Check for syntax errors in code
2. Verify code doesn't use restricted modules
3. Check execution timeout (5 seconds)
4. Review sandbox restrictions
5. Try simpler code first

### Performance Issues

#### Slow Response Times

**Causes**:
- Model too large for hardware
- Complex prompts
- Many concurrent requests
- Low system resources

**Solutions**:
1. Use smaller models (e.g., llama2 vs llama2:70b)
2. Simplify prompts
3. Close other applications
4. Increase system RAM
5. Use GPU acceleration (if available)

#### High Memory Usage

**Solutions**:
1. Limit conversation history length
2. Use smaller models
3. Close unused chats
4. Restart application periodically
5. Monitor with Task Manager/Activity Monitor

### Getting Help

If you're still stuck:

1. **Check Documentation**
   - [README.md](./README.md)
   - [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [API_REFERENCE.md](./API_REFERENCE.md)

2. **GitHub Issues**
   - Search existing issues
   - Create new issue with:
     - Clear description
     - Steps to reproduce
     - System info (OS, Node version)
     - Screenshots if applicable

3. **Community**
   - Discussions tab on GitHub
   - Discord (if available)
   - Stack Overflow (tag: oyama)

## Next Steps

Now that you understand the basics:

1. **Create Your First Agent** (15 minutes)
   - Choose a role that fits your needs
   - Customize the system prompt
   - Test in a chat

2. **Build a Template Library** (30 minutes)
   - Identify common prompts you use
   - Create 3-5 templates
   - Test with different agents

3. **Experiment with Crews** (30 minutes)
   - Create a simple 2-agent crew
   - Try sequential workflow
   - Execute with different inputs

4. **Explore Advanced Features**
   - Code execution in chat
   - Round-robin workflows
   - Template interpolation

5. **Join the Community**
   - Star the GitHub repo
   - Share your agent configurations
   - Contribute improvements

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open command palette |
| `Ctrl+/` | Toggle sidebar |
| `Ctrl+N` | New chat |
| `Ctrl+Enter` | Send message |
| `Esc` | Close modal/dialog |
| `Ctrl+B` | Toggle sidebar |

### Agent Role Reference

Quick reference for all 17 agent roles and their use cases:

| Role | Best For | Example Tasks |
|------|----------|---------------|
| Planner | Strategic planning | Roadmaps, timelines, project plans |
| Researcher | Information gathering | Research reports, data collection |
| Writer | Content creation | Articles, blog posts, documentation |
| Editor | Content improvement | Editing, proofreading, style |
| Critic | Critical analysis | Reviews, feedback, assessments |
| Coder | Programming | Code writing, debugging, review |
| QA | Quality assurance | Testing, validation, bug reports |
| Summarizer | Condensing info | Summaries, abstracts, key points |
| Synthesizer | Combining sources | Insights, connections, synthesis |
| Debugger | Troubleshooting | Bug fixing, root cause analysis |
| Analyst | Data analysis | Metrics, trends, insights |
| DevOps | Infrastructure | CI/CD, deployment, monitoring |
| Security | Security review | Vulnerability assessment, audit |
| Designer | UX/UI design | Wireframes, mockups, design |
| Backend | Server development | APIs, databases, services |
| Product | Product management | Requirements, prioritization |
| Custom | Anything else | Your custom use case |

### Model Recommendations

| Task Type | Recommended Model | Temperature |
|-----------|------------------|-------------|
| Factual Q&A | llama2 | 0.2 |
| Code generation | codellama | 0.3 |
| Creative writing | llama2 | 0.8 |
| Analysis | llama2 | 0.4 |
| Summarization | llama2 | 0.3 |
| Brainstorming | llama2 | 0.9 |
| Translation | llama2 | 0.2 |
| Chat/conversation | llama2 | 0.7 |

### Resource Links

- **Ollama**: https://ollama.ai
- **Ollama Models**: https://ollama.ai/library
- **GitHub Repo**: https://github.com/jamesk9526/Oyama
- **Issues**: https://github.com/jamesk9526/Oyama/issues
- **Discussions**: https://github.com/jamesk9526/Oyama/discussions

Happy building with Oyama! 🚀
