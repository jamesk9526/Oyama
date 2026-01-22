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
  // Agents table - simplified version, matching migration schema columns
  db.exec(`
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
      workspace_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      body TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      variables TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Crews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crews (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      agents TEXT NOT NULL,
      workflow_type TEXT DEFAULT 'sequential',
      status TEXT DEFAULT 'idle',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Chats table (for conversation history)
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      agent_id TEXT,
      model TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Migrations for existing databases
  ensureColumn(db, 'chats', 'agent_id', 'TEXT');
  ensureColumn(db, 'chats', 'model', 'TEXT');

  // Messages table (individual messages within chats)
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `);

  // Memory table (for long-term context retention)
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      chat_id TEXT,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'fact',
      importance INTEGER DEFAULT 5,
      keywords TEXT,
      created_at TEXT NOT NULL,
      last_accessed_at TEXT,
      access_count INTEGER DEFAULT 0
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
      scope_type TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      mime TEXT,
      size INTEGER,
      created_at TEXT NOT NULL
    )
  `);

  // Crew runs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crew_runs (
      id TEXT PRIMARY KEY,
      crew_id TEXT NOT NULL,
      crew_name TEXT NOT NULL,
      workflow_type TEXT NOT NULL,
      input TEXT NOT NULL,
      status TEXT NOT NULL,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      temperature REAL,
      top_p REAL,
      max_tokens INTEGER,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      error TEXT
    )
  `);

  // Crew run steps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crew_run_steps (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      step_index INTEGER NOT NULL,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      success INTEGER NOT NULL,
      error TEXT,
      duration INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  console.log('Database tables initialized successfully');
}

export function initializeDatabase(): void {
  const db = getDatabase();
  initializeTables(db);
}