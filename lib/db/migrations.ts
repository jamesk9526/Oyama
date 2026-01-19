import db from './index';

export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      -- Workspaces
      CREATE TABLE workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        system_prompt TEXT,
        settings TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Agents
      CREATE TABLE agents (
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

      -- Templates
      CREATE TABLE templates (
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

      -- Crews
      CREATE TABLE crews (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        workspace_id TEXT NOT NULL,
        workflow_type TEXT NOT NULL,
        agents TEXT NOT NULL DEFAULT '[]',
        aggregator_config TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
      );

      -- Chats
      CREATE TABLE chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        agent_id TEXT,
        crew_id TEXT,
        system_prompt_overrides TEXT,
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
        FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE SET NULL
      );

      -- Messages
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        agent_id TEXT,
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
      );

      -- Runs
      CREATE TABLE runs (
        id TEXT PRIMARY KEY,
        chat_id TEXT,
        crew_id TEXT,
        agent_id TEXT,
        inputs TEXT NOT NULL DEFAULT '{}',
        outputs TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'pending',
        compiled_prompt TEXT NOT NULL,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        runtime_stats TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE SET NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
      );

      -- System Prompt Versions
      CREATE TABLE system_prompt_versions (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        entity_id TEXT,
        prompt TEXT NOT NULL,
        version INTEGER NOT NULL,
        change_note TEXT,
        created_at TEXT NOT NULL
      );

      -- Prompt Blocks
      CREATE TABLE prompt_blocks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        "order" INTEGER NOT NULL DEFAULT 0,
        workspace_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
      );

      -- User Profiles
      CREATE TABLE user_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        settings TEXT NOT NULL DEFAULT '{}',
        is_active INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      -- Provider Configs
      CREATE TABLE provider_configs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        base_url TEXT,
        api_key TEXT,
        models TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Global Settings
      CREATE TABLE global_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Indexes for performance
      CREATE INDEX idx_agents_workspace ON agents(workspace_id);
      CREATE INDEX idx_templates_workspace ON templates(workspace_id);
      CREATE INDEX idx_chats_workspace ON chats(workspace_id);
      CREATE INDEX idx_messages_chat ON messages(chat_id);
      CREATE INDEX idx_runs_chat ON runs(chat_id);
      CREATE INDEX idx_runs_status ON runs(status);
    `,
    down: `
      DROP TABLE IF EXISTS global_settings;
      DROP TABLE IF EXISTS provider_configs;
      DROP TABLE IF EXISTS user_profiles;
      DROP TABLE IF EXISTS prompt_blocks;
      DROP TABLE IF EXISTS system_prompt_versions;
      DROP TABLE IF EXISTS runs;
      DROP TABLE IF EXISTS messages;
      DROP TABLE IF EXISTS chats;
      DROP TABLE IF EXISTS crews;
      DROP TABLE IF EXISTS templates;
      DROP TABLE IF EXISTS agents;
      DROP TABLE IF EXISTS workspaces;
    `,
  },
];

// Migration tracking table
const createMigrationTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
};

export const getCurrentVersion = (): number => {
  createMigrationTable();
  const result = db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number | null } | undefined;
  return result?.version || 0;
};

export const runMigrations = () => {
  createMigrationTable();
  const currentVersion = getCurrentVersion();
  
  const pendingMigrations = migrations.filter(m => m.version > currentVersion);
  
  if (pendingMigrations.length === 0) {
    console.log('✅ Database is up to date');
    return;
  }

  console.log(`📦 Running ${pendingMigrations.length} migration(s)...`);

  for (const migration of pendingMigrations) {
    console.log(`   → ${migration.version}: ${migration.name}`);
    
    try {
      db.exec(migration.up);
      db.prepare('INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
        migration.version,
        migration.name,
        new Date().toISOString()
      );
      console.log(`   ✓ Applied migration ${migration.version}`);
    } catch (error) {
      console.error(`   ✗ Failed to apply migration ${migration.version}:`, error);
      throw error;
    }
  }

  console.log('✅ All migrations completed');
};

export const rollback = () => {
  const currentVersion = getCurrentVersion();
  if (currentVersion === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const migration = migrations.find(m => m.version === currentVersion);
  if (!migration) {
    console.error(`Migration ${currentVersion} not found`);
    return;
  }

  console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
  
  try {
    db.exec(migration.down);
    db.prepare('DELETE FROM migrations WHERE version = ?').run(currentVersion);
    console.log(`✓ Rolled back migration ${migration.version}`);
  } catch (error) {
    console.error(`✗ Failed to rollback migration ${migration.version}:`, error);
    throw error;
  }
};
