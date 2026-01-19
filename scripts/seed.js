// Seed script using require with proper path resolution
const path = require('path');

// Set up module alias for @/ imports
require('module-alias/register');
require('module-alias').addAlias('@', path.join(__dirname, '..'));

async function runSeed() {
  try {
    console.log('🌱 Starting database seed...\n');
    
    // Use ts-node or direct compilation approach
    // For now, we'll use a workaround with direct DB access
    const Database = require('better-sqlite3');
    const { v4: uuidv4 } = require('uuid');
    const fs = require('fs');
    
    // Get database path
    let appPath;
    try {
      const { app } = require('electron');
      appPath = app?.getPath?.('userData') || path.join(process.cwd(), '.data');
    } catch {
      appPath = path.join(process.cwd(), '.data');
    }
    
    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath, { recursive: true });
    }
    
    const dbPath = path.join(appPath, 'oyama.db');
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    console.log(`📍 Database location: ${dbPath}\n`);
    
    // Check if tables exist, if not run basic schema creation
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='workspaces'").get();
    
    if (!tableCheck) {
      console.log('   ⚙️  Creating database schema...');
      // Run migrations from the API route that initializes tables
      const initScript = fs.readFileSync(path.join(__dirname, '../lib/db/migrations.ts'), 'utf8');
      
      // Extract just the first migration SQL and run it
      // Basic schema creation
      db.exec(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          system_prompt TEXT,
          settings TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          system_prompt TEXT NOT NULL,
          style_rules TEXT,
          model TEXT NOT NULL,
          provider TEXT NOT NULL,
          capabilities TEXT NOT NULL DEFAULT '[]',
          color_tag TEXT,
          icon TEXT,
          workspace_id TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS crews (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          workflow TEXT NOT NULL CHECK(workflow IN ('sequential', 'parallel')),
          workspace_id TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS crew_agents (
          crew_id TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          PRIMARY KEY (crew_id, agent_id),
          FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE CASCADE,
          FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          tags TEXT NOT NULL DEFAULT '[]',
          body TEXT NOT NULL,
          variables TEXT NOT NULL DEFAULT '[]',
          system_additions TEXT,
          examples TEXT,
          output_schema TEXT,
          workspace_id TEXT,
          is_favorite INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        );
      `);
      console.log('   ✓ Schema created\n');
    }
    
    // Load default data
    const { DEFAULT_AGENTS, DEFAULT_CREWS } = require('../lib/db/default-data.ts');
    
    const workspaceId = uuidv4();
    const now = new Date().toISOString();
    
    // Create workspace
    db.prepare(`
      INSERT OR IGNORE INTO workspaces (id, name, description, system_prompt, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      workspaceId,
      'Default Workspace',
      'Your default workspace for AI agent collaboration',
      'You are a helpful AI assistant.',
      JSON.stringify({ defaultModel: 'llama2', defaultProvider: 'ollama', temperature: 0.7 }),
      now,
      now
    );
    console.log('   ✓ Created default workspace');
    
    // Create agents
    console.log('\n   📦 Installing default agents...');
    for (const agent of DEFAULT_AGENTS) {
      db.prepare(`
        INSERT OR REPLACE INTO agents (id, name, role, system_prompt, style_rules, model, provider, capabilities, color_tag, icon, workspace_id, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent.id,
        agent.name,
        agent.role,
        agent.systemPrompt,
        agent.styleRules || null,
        agent.model || 'llama2',
        agent.provider || 'ollama',
        JSON.stringify(agent.capabilities || []),
        agent.colorTag || '#10b981',
        agent.avatar,
        workspaceId,
        1,
        now,
        now
      );
      console.log(`      ✓ ${agent.name} (${agent.role})`);
    }
    
    // Create crews
    console.log('\n   🎯 Creating default crews...');
    for (const crew of DEFAULT_CREWS) {
      db.prepare(`
        INSERT OR REPLACE INTO crews (id, name, description, workflow, workspace_id, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crew.id,
        crew.name,
        crew.description,
        crew.workflow,
        workspaceId,
        1,
        now,
        now
      );
      
      // Delete existing crew agents first
      db.prepare('DELETE FROM crew_agents WHERE crew_id = ?').run(crew.id);
      
      // Insert crew agents
      for (const agent of crew.agents) {
        db.prepare(`
          INSERT INTO crew_agents (crew_id, agent_id, order_index)
          VALUES (?, ?, ?)
        `).run(crew.id, agent.agentId, agent.order);
      }
      console.log(`      ✓ ${crew.name} (${crew.agents.length} agents)`);
    }
    
    db.close();
    
    console.log('\n✅ Database seeded successfully!\n');
    console.log(`   • ${DEFAULT_AGENTS.length} agents installed`);
    console.log(`   • ${DEFAULT_CREWS.length} crews created\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

runSeed();
