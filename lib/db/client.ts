import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;
let isInitialized = false;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Get app data directory
  let appPath: string;
  
  // Check if running in Electron (has access to app module)
  try {
    const { app } = require('electron');
    appPath = app?.getPath?.('userData') || path.join(process.cwd(), '.data');
  } catch (err) {
    // Not in Electron, use local .data directory
    appPath = path.join(process.cwd(), '.data');
  }
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath, { recursive: true });
  }

  const dbPath = path.join(appPath, 'oyama.db');
  
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Auto-initialize database tables if not already done
  if (!isInitialized) {
    try {
      initializeTables(db);
      isInitialized = true;
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  }
  
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  const hasColumn = columns.some((col) => col.name === column);

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function initializeTables(db: Database.Database): void {
  // Agents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      systemPrompt TEXT,
      description TEXT,
      capabilities TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      variables TEXT,
      isFavorite INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Crews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crews (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      agentIds TEXT NOT NULL,
      workflowType TEXT DEFAULT 'sequential',
      status TEXT DEFAULT 'idle',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Chats table (for conversation history)
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      agentId TEXT,
      model TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Migrations for existing databases
  ensureColumn(db, 'chats', 'agentId', 'TEXT');
  ensureColumn(db, 'chats', 'model', 'TEXT');

  // Messages table (individual messages within chats)
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chatId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
    )
  `);

  // Memory table (for long-term context retention)
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      chatId TEXT,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'fact',
      importance INTEGER DEFAULT 5,
      keywords TEXT,
      createdAt TEXT NOT NULL,
      lastAccessedAt TEXT,
      accessCount INTEGER DEFAULT 0
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      scopeType TEXT NOT NULL,
      scopeId TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      mime TEXT,
      size INTEGER,
      createdAt TEXT NOT NULL
    )
  `);

  // Crew runs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crew_runs (
      id TEXT PRIMARY KEY,
      crewId TEXT NOT NULL,
      crewName TEXT NOT NULL,
      workflowType TEXT NOT NULL,
      input TEXT NOT NULL,
      status TEXT NOT NULL,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      temperature REAL,
      topP REAL,
      maxTokens INTEGER,
      startedAt TEXT NOT NULL,
      completedAt TEXT,
      error TEXT
    )
  `);

  // Crew run steps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crew_run_steps (
      id TEXT PRIMARY KEY,
      runId TEXT NOT NULL,
      stepIndex INTEGER NOT NULL,
      agentId TEXT NOT NULL,
      agentName TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      success INTEGER NOT NULL,
      error TEXT,
      duration INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Tool call logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tool_logs (
      id TEXT PRIMARY KEY,
      toolId TEXT NOT NULL,
      toolName TEXT NOT NULL,
      chatId TEXT,
      agentId TEXT,
      inputs TEXT NOT NULL,
      outputs TEXT,
      status TEXT NOT NULL,
      error TEXT,
      duration INTEGER,
      timestamp TEXT NOT NULL
    )
  `);

  // Workflows table (enhanced workflow definitions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      stages TEXT NOT NULL,
      workflowType TEXT DEFAULT 'sequential',
      status TEXT DEFAULT 'draft',
      crewId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (crewId) REFERENCES crews(id) ON DELETE SET NULL
    )
  `);

  // Workflow states table (active execution state)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_states (
      id TEXT PRIMARY KEY,
      workflowId TEXT NOT NULL,
      crewId TEXT NOT NULL,
      crewName TEXT NOT NULL,
      workflowDefinition TEXT NOT NULL,
      status TEXT NOT NULL,
      currentStepIndex INTEGER NOT NULL,
      steps TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT,
      pausedAt TEXT,
      resumedAt TEXT,
      error TEXT,
      context TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `);

  // Workflow approval gates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_approvals (
      id TEXT PRIMARY KEY,
      workflowId TEXT NOT NULL,
      workflowStateId TEXT,
      stepIndex INTEGER NOT NULL,
      stepName TEXT NOT NULL,
      status TEXT NOT NULL,
      requestedAt TEXT NOT NULL,
      resolvedAt TEXT,
      resolvedBy TEXT,
      comment TEXT,
      data TEXT,
      FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (workflowStateId) REFERENCES workflow_states(id) ON DELETE CASCADE
    )
  `);

  // Workflow execution history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id TEXT PRIMARY KEY,
      workflowId TEXT NOT NULL,
      workflowStateId TEXT,
      crewId TEXT NOT NULL,
      crewName TEXT NOT NULL,
      workflowType TEXT NOT NULL,
      initialInput TEXT NOT NULL,
      status TEXT NOT NULL,
      totalDuration INTEGER,
      startTime TEXT NOT NULL,
      endTime TEXT,
      error TEXT,
      FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (workflowStateId) REFERENCES workflow_states(id) ON DELETE SET NULL
    )
  `);

  // Workflow execution steps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_execution_steps (
      id TEXT PRIMARY KEY,
      executionId TEXT NOT NULL,
      stepIndex INTEGER NOT NULL,
      agentId TEXT NOT NULL,
      agentName TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      success INTEGER NOT NULL,
      error TEXT,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      duration INTEGER NOT NULL,
      FOREIGN KEY (executionId) REFERENCES workflow_executions(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_workflow_states_status ON workflow_states(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_states_workflow_id ON workflow_states(workflowId);
    CREATE INDEX IF NOT EXISTS idx_workflow_approvals_status ON workflow_approvals(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_approvals_workflow_id ON workflow_approvals(workflowId);
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflowId);
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
    CREATE INDEX IF NOT EXISTS idx_crew_runs_crew_id ON crew_runs(crewId);
    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chatId);
    CREATE INDEX IF NOT EXISTS idx_memories_chat_id ON memories(chatId);
  `);

  console.log('Database tables initialized successfully');
}

export function initializeDatabase(): void {
  const db = getDatabase();
  initializeTables(db);
}