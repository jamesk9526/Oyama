import db from './index';
import { v4 as uuidv4 } from 'uuid';
import type { Workspace, Agent, Template } from '@/types';
import { DEFAULT_AGENTS, DEFAULT_CREWS } from './default-data';

export const seedDatabase = () => {
  console.log('🌱 Seeding database...');

  // Create default workspace
  const workspaceId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO workspaces (id, name, description, system_prompt, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    workspaceId,
    'Default Workspace',
    'Your default workspace for AI agent collaboration',
    'You are a helpful AI assistant. Always be clear, concise, and accurate in your responses.',
    JSON.stringify({
      defaultModel: 'llama2',
      defaultProvider: 'ollama',
      temperature: 0.7,
    }),
    now,
    now
  );

  console.log('   ✓ Created default workspace');

  // Create default agents
  console.log('   📦 Installing default agents...');
  for (const agentData of DEFAULT_AGENTS) {
    db.prepare(`
      INSERT INTO agents (id, name, role, system_prompt, model, provider, capabilities, color_tag, icon, workspace_id, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      agentData.id,
      agentData.name,
      agentData.role,
      agentData.systemPrompt,
      'gpt-4',
      'openai',
      JSON.stringify([]),
      '#10b981',
      agentData.avatar,
      workspaceId,
      1,
      now,
      now
    );
    console.log(`      ✓ ${agentData.name} (${agentData.role})`);
  }

  // Create default crews
  console.log('   🎯 Creating default crews...');
  for (const crewData of DEFAULT_CREWS) {
    // Insert crew
    db.prepare(`
      INSERT INTO crews (id, name, description, workflow, workspace_id, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crewData.id,
      crewData.name,
      crewData.description,
      crewData.workflow,
      workspaceId,
      1,
      now,
      now
    );

    // Insert crew agents
    for (const agent of crewData.agents) {
      db.prepare(`
        INSERT INTO crew_agents (crew_id, agent_id, order_index)
        VALUES (?, ?, ?)
      `).run(
        crewData.id,
        agent.agentId,
        agent.order
      );
    }
    console.log(`      ✓ ${crewData.name} (${crewData.agents.length} agents)`);
  }

  // Create starter templates
  const templates: Partial<Template>[] = [
    {
      id: uuidv4(),
      name: 'Blog Post Outline',
      description: 'Generate a comprehensive blog post outline',
      category: 'Blog',
      tags: ['writing', 'content', 'blog'],
      body: `Create a detailed blog post outline for the following topic:\n\nTopic: {{topic}}\nTarget Audience: {{audience}}\nTone: {{tone}}\n\nInclude:\n- Compelling headline\n- Introduction hook\n- 3-5 main sections with subsections\n- Conclusion with call-to-action`,
      variables: [
        { name: 'topic', type: 'string', description: 'The blog post topic', required: true },
        { name: 'audience', type: 'string', description: 'Target audience', required: true },
        { name: 'tone', type: 'string', description: 'Writing tone', defaultValue: 'professional', required: false },
      ],
      workspaceId: null,
      isFavorite: false,
    },
    {
      id: uuidv4(),
      name: 'Code Review',
      description: 'Comprehensive code review template',
      category: 'Code',
      tags: ['code', 'review', 'quality'],
      body: `Review the following code:\n\n\`\`\`{{language}}\n{{code}}\n\`\`\`\n\nProvide:\n1. Overall assessment\n2. Potential bugs or issues\n3. Performance concerns\n4. Best practice violations\n5. Suggestions for improvement\n6. Security considerations`,
      variables: [
        { name: 'language', type: 'string', description: 'Programming language', required: true },
        { name: 'code', type: 'text', description: 'Code to review', required: true },
      ],
      workspaceId: null,
      isFavorite: false,
    },
    {
      id: uuidv4(),
      name: 'Research Summary',
      description: 'Summarize research findings',
      category: 'Research',
      tags: ['research', 'summary', 'analysis'],
      body: `Research and summarize information about: {{topic}}\n\nFocus areas:\n{{focus_areas}}\n\nProvide:\n- Executive summary\n- Key findings (5-7 points)\n- Supporting details\n- Sources and references\n- Recommendations`,
      variables: [
        { name: 'topic', type: 'string', description: 'Research topic', required: true },
        { name: 'focus_areas', type: 'text', description: 'Specific areas to focus on', required: false },
      ],
      workspaceId: null,
      isFavorite: true,
    },
  ];

  for (const template of templates) {
    db.prepare(`
      INSERT INTO templates (id, name, description, category, tags, body, variables, workspace_id, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      template.id,
      template.name,
      template.description,
      template.category,
      JSON.stringify(template.tags),
      template.body,
      JSON.stringify(template.variables),
      template.workspaceId,
      template.isFavorite ? 1 : 0,
      now,
      now
    );
  }

  console.log(`   ✓ Created ${templates.length} starter templates`);

  // Create default Ollama provider
  db.prepare(`
    INSERT INTO provider_configs (id, type, name, base_url, models, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    'ollama',
    'Local Ollama',
    'http://localhost:11434',
    JSON.stringify(['llama2', 'mistral', 'codellama', 'phi']),
    now,
    now
  );

  console.log('   ✓ Created default Ollama provider');

  // Set global system prompt
  db.prepare(`
    INSERT INTO global_settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `).run(
    'global_system_prompt',
    `You are Oyama, a thoughtful and natural conversational AI. You're here to be genuinely helpful and engaging.

## How You Interact
- Write conversationally and naturally—no robotic formality. Use varied sentence structure and feel free to use contractions.
- Remember details from our conversation and reference them naturally when relevant.
- Ask clarifying questions when something is ambiguous. Show genuine curiosity about what the user is trying to accomplish.
- Be honest about what you know and don't know. If something's uncertain, say so instead of guessing.

## Your Approach
- Go the extra mile to give helpful, actionable responses. Explain your thinking when it helps clarify something complex.
- Treat the user with genuine respect and consideration. We're partners working together, not a hierarchy.
- Keep things clear and conversational. Use examples and analogies when they help explain something.
- When appropriate, ask what they think or would like to explore further—their input and ideas matter.

## Building Partnership
- Learn who you're talking with. If they introduce themselves or share preferences, acknowledge and remember them.
- Engage authentically while maintaining appropriate boundaries. The better you understand what they're looking for, the better you can help.
- Be present and attentive in the conversation. Show that you're genuinely interested in what they're asking.`,
    now
  );

  console.log('   ✓ Set global system prompt');

  console.log('✅ Database seeded successfully');
};
