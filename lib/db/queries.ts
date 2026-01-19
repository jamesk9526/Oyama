import { getDatabase } from './client';
import type { Agent, Template } from '@/types';

const normalizeAgent = (agent: any): Agent => {
  let capabilities: Agent['capabilities'] = [];
  if (Array.isArray(agent.capabilities)) {
    capabilities = agent.capabilities;
  } else if (typeof agent.capabilities === 'string') {
    try {
      const parsed = JSON.parse(agent.capabilities);
      capabilities = Array.isArray(parsed) ? parsed : [];
    } catch {
      capabilities = [];
    }
  }

  return {
    ...agent,
    capabilities,
  } as Agent;
};

export interface CrewRecord {
  id: string;
  name: string;
  description: string;
  agents: string[];
  workflowType: 'sequential' | 'parallel' | 'conditional';
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
}

// Agent queries
export const agentQueries = {
  getAll: () => {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM agents ORDER BY updatedAt DESC').all() as any[];
    return rows.map(normalizeAgent) as Agent[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
    return row ? (normalizeAgent(row) as Agent) : undefined;
  },

  create: (agent: Agent) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO agents (id, name, role, systemPrompt, description, capabilities, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      agent.id,
      agent.name,
      agent.role,
      agent.systemPrompt,
      agent.styleRules || '',
      JSON.stringify(agent.capabilities || []),
      agent.createdAt,
      agent.updatedAt
    );
    return agent;
  },

  update: (id: string, updates: Partial<Agent>) => {
    const db = getDatabase();
    const agent = agentQueries.getById(id);
    if (!agent) return null;

    const updated = { ...agent, ...updates, updatedAt: new Date().toISOString() };
    const stmt = db.prepare(`
      UPDATE agents 
      SET name = ?, role = ?, systemPrompt = ?, description = ?, capabilities = ?, updatedAt = ?
      WHERE id = ?
    `);
    stmt.run(
      updated.name,
      updated.role,
      updated.systemPrompt,
      updated.styleRules || '',
      JSON.stringify(updated.capabilities || []),
      updated.updatedAt,
      id
    );
    return updated;
  },

  delete: (id: string) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
    stmt.run(id);
  },
};

// Template queries
export const templateQueries = {
  getAll: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM templates ORDER BY updatedAt DESC').all() as any[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as any;
  },

  create: (template: Template) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO templates (id, name, description, content, category, tags, variables, isFavorite, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      template.id,
      template.name,
      template.description,
      template.body,
      template.category,
      JSON.stringify(template.tags || []),
      JSON.stringify(template.variables || {}),
      template.isFavorite ? 1 : 0,
      template.createdAt,
      template.updatedAt
    );
    return template;
  },

  update: (id: string, updates: Partial<Template>) => {
    const db = getDatabase();
    const template = templateQueries.getById(id);
    if (!template) return null;

    const updated = { ...template, ...updates, updatedAt: new Date().toISOString() };
    const stmt = db.prepare(`
      UPDATE templates 
      SET name = ?, description = ?, content = ?, category = ?, tags = ?, variables = ?, isFavorite = ?, updatedAt = ?
      WHERE id = ?
    `);
    stmt.run(
      updated.name,
      updated.description,
      updated.body,
      updated.category,
      JSON.stringify(updated.tags || []),
      JSON.stringify(updated.variables || {}),
      updated.isFavorite ? 1 : 0,
      updated.updatedAt,
      id
    );
    return updated;
  },

  delete: (id: string) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
    stmt.run(id);
  },
};

// Crew queries
const normalizeCrew = (crew: any): CrewRecord => {
  let agentIds: string[] = [];
  if (Array.isArray(crew.agentIds)) {
    agentIds = crew.agentIds;
  } else if (typeof crew.agentIds === 'string') {
    try {
      const parsed = JSON.parse(crew.agentIds);
      agentIds = Array.isArray(parsed) ? parsed : [];
    } catch {
      agentIds = [];
    }
  }

  return {
    ...crew,
    agents: agentIds,
    workflowType: crew.workflowType || 'sequential',
    status: crew.status || 'idle',
  } as CrewRecord;
};

export const crewQueries = {
  getAll: () => {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM crews ORDER BY updatedAt DESC').all() as any[];
    return rows.map(normalizeCrew) as CrewRecord[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM crews WHERE id = ?').get(id) as any;
    return row ? (normalizeCrew(row) as CrewRecord) : undefined;
  },

  create: (crew: CrewRecord) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO crews (id, name, description, agentIds, workflowType, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      crew.id,
      crew.name,
      crew.description,
      JSON.stringify(crew.agents || []),
      crew.workflowType,
      'idle',
      crew.createdAt,
      crew.updatedAt
    );
    return crew;
  },

  update: (id: string, updates: Partial<CrewRecord>) => {
    const db = getDatabase();
    const crew = crewQueries.getById(id);
    if (!crew) return null;

    const updated = { ...crew, ...updates, updatedAt: new Date().toISOString() };
    const stmt = db.prepare(`
      UPDATE crews 
      SET name = ?, description = ?, agentIds = ?, workflowType = ?, status = ?, updatedAt = ?
      WHERE id = ?
    `);
    stmt.run(
      updated.name,
      updated.description,
      JSON.stringify(updated.agents || []),
      updated.workflowType,
      'idle',
      updated.updatedAt,
      id
    );
    return updated;
  },

  delete: (id: string) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM crews WHERE id = ?');
    stmt.run(id);
  },
};

// Settings queries
export const settingsQueries = {
  get: (key: string) => {
    const db = getDatabase();
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    return result?.value;
  },

  set: (key: string, value: string) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
    `);
    stmt.run(key, value);
  },

  getAll: () => {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM settings').all() as any[];
    const result: Record<string, string> = {};
    rows.forEach((row) => {
      result[row.key] = row.value;
    });
    return result;
  },
};

// Message queries
export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  agentId?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  scopeType: 'chat' | 'crew';
  scopeId: string;
  name: string;
  path: string;
  mime?: string;
  size?: number;
  createdAt: string;
}

export interface CrewRunRecord {
  id: string;
  crewId: string;
  crewName: string;
  workflowType: string;
  input: string;
  status: 'running' | 'completed' | 'failed';
  model: string;
  provider: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface CrewRunStepRecord {
  id: string;
  runId: string;
  stepIndex: number;
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  success: boolean;
  error?: string;
  duration: number;
  createdAt: string;
}

let chatHasMessagesColumn: boolean | null = null;

const hasChatMessagesColumn = () => {
  if (chatHasMessagesColumn !== null) return chatHasMessagesColumn;
  const db = getDatabase();
  const columns = db.prepare('PRAGMA table_info(chats)').all() as Array<{ name: string }>;
  chatHasMessagesColumn = columns.some((col) => col.name === 'messages');
  return chatHasMessagesColumn;
};

export const messageQueries = {
  getAllByChatId: (chatId: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC').all(chatId) as Message[];
  },

  create: (message: Message) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO messages (id, chatId, role, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(message.id, message.chatId, message.role, message.content, message.timestamp);
    return message;
  },

  deleteByChatId: (chatId: string) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM messages WHERE chatId = ?');
    stmt.run(chatId);
  },
};

// Chat queries
export const chatQueries = {
  getAll: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM chats ORDER BY updatedAt DESC').all() as Chat[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM chats WHERE id = ?').get(id) as Chat | undefined;
  },

  create: (chat: Chat) => {
    const db = getDatabase();
    const includeMessages = hasChatMessagesColumn();
    const stmt = db.prepare(
      includeMessages
        ? `
      INSERT INTO chats (id, title, agentId, model, messages, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
        : `
      INSERT INTO chats (id, title, agentId, model, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    );
    if (includeMessages) {
      stmt.run(
        chat.id,
        chat.title,
        chat.agentId || null,
        chat.model || null,
        '[]',
        chat.createdAt,
        chat.updatedAt
      );
    } else {
      stmt.run(
        chat.id,
        chat.title,
        chat.agentId || null,
        chat.model || null,
        chat.createdAt,
        chat.updatedAt
      );
    }
    return chat;
  },

  update: (id: string, updates: Partial<Chat>) => {
    const db = getDatabase();
    const chat = chatQueries.getById(id);
    if (!chat) return null;

    const updated = { ...chat, ...updates, updatedAt: new Date().toISOString() };
    const stmt = db.prepare(`
      UPDATE chats 
      SET title = ?, agentId = ?, model = ?, updatedAt = ?
      WHERE id = ?
    `);
    stmt.run(updated.title, updated.agentId || null, updated.model || null, updated.updatedAt, id);
    return updated;
  },

  delete: (id: string) => {
    const db = getDatabase();
    // Messages will be deleted automatically due to CASCADE
    const stmt = db.prepare('DELETE FROM chats WHERE id = ?');
    stmt.run(id);
  },
};

// Attachment queries
export const attachmentQueries = {
  getByScope: (scopeType: Attachment['scopeType'], scopeId: string) => {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM attachments WHERE scopeType = ? AND scopeId = ? ORDER BY createdAt DESC')
      .all(scopeType, scopeId) as Attachment[];
  },

  getByIds: (ids: string[]) => {
    if (ids.length === 0) return [] as Attachment[];
    const db = getDatabase();
    const placeholders = ids.map(() => '?').join(', ');
    return db
      .prepare(`SELECT * FROM attachments WHERE id IN (${placeholders})`)
      .all(...ids) as Attachment[];
  },

  create: (attachment: Attachment) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO attachments (id, scopeType, scopeId, name, path, mime, size, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      attachment.id,
      attachment.scopeType,
      attachment.scopeId,
      attachment.name,
      attachment.path,
      attachment.mime || null,
      attachment.size || null,
      attachment.createdAt
    );
    return attachment;
  },

  delete: (id: string) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM attachments WHERE id = ?');
    stmt.run(id);
  },
};

// Crew run queries
export const crewRunQueries = {
  createRun: (run: CrewRunRecord) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO crew_runs (id, crewId, crewName, workflowType, input, status, model, provider, temperature, topP, maxTokens, startedAt, completedAt, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      run.id,
      run.crewId,
      run.crewName,
      run.workflowType,
      run.input,
      run.status,
      run.model,
      run.provider,
      run.temperature ?? null,
      run.topP ?? null,
      run.maxTokens ?? null,
      run.startedAt,
      run.completedAt ?? null,
      run.error ?? null
    );
    return run;
  },

  updateRun: (id: string, updates: Partial<CrewRunRecord>) => {
    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM crew_runs WHERE id = ?').get(id) as any;
    if (!existing) return null;
    const updated = { ...existing, ...updates } as CrewRunRecord;
    const stmt = db.prepare(`
      UPDATE crew_runs
      SET status = ?, completedAt = ?, error = ?
      WHERE id = ?
    `);
    stmt.run(updated.status, updated.completedAt ?? null, updated.error ?? null, id);
    return updated;
  },

  listRuns: (limit = 50) => {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM crew_runs ORDER BY startedAt DESC LIMIT ?')
      .all(limit) as CrewRunRecord[];
  },

  getRun: (id: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM crew_runs WHERE id = ?').get(id) as CrewRunRecord | undefined;
  },

  deleteRun: (id: string) => {
    const db = getDatabase();
    db.prepare('DELETE FROM crew_run_steps WHERE runId = ?').run(id);
    db.prepare('DELETE FROM crew_runs WHERE id = ?').run(id);
  },
};

export const crewRunStepQueries = {
  addStep: (step: CrewRunStepRecord) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO crew_run_steps (id, runId, stepIndex, agentId, agentName, input, output, success, error, duration, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      step.id,
      step.runId,
      step.stepIndex,
      step.agentId,
      step.agentName,
      step.input,
      step.output,
      step.success ? 1 : 0,
      step.error ?? null,
      step.duration,
      step.createdAt
    );
    return step;
  },

  listSteps: (runId: string) => {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM crew_run_steps WHERE runId = ? ORDER BY stepIndex ASC')
      .all(runId) as any[];
    return rows.map((row) => ({
      ...row,
      success: !!row.success,
    })) as CrewRunStepRecord[];
  },
};

// Memory queries
export interface MemoryRecord {
  id: string;
  chatId?: string;
  content: string;
  type: 'fact' | 'preference' | 'context';
  importance: number;
  keywords: string[];
  createdAt: string;
  lastAccessedAt?: string;
  accessCount: number;
}

export const memoryQueries = {
  create: (memory: Omit<MemoryRecord, 'accessCount' | 'lastAccessedAt'>) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO memories (id, chatId, content, type, importance, keywords, createdAt, accessCount)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);
    stmt.run(
      memory.id,
      memory.chatId || null,
      memory.content,
      memory.type,
      memory.importance,
      JSON.stringify(memory.keywords),
      memory.createdAt
    );
    return { ...memory, accessCount: 0 };
  },

  search: (keywords: string[], limit: number = 10) => {
    const db = getDatabase();
    // Simple keyword matching - in production, you'd use embeddings/vector search
    const searchPattern = keywords.map(k => `%${k.toLowerCase()}%`).join('|');
    const rows = db
      .prepare(`
        SELECT * FROM memories 
        WHERE LOWER(content) LIKE ? OR LOWER(keywords) LIKE ?
        ORDER BY importance DESC, accessCount DESC, createdAt DESC
        LIMIT ?
      `)
      .all(`%${keywords[0].toLowerCase()}%`, `%${keywords[0].toLowerCase()}%`, limit) as any[];
    
    return rows.map(row => ({
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
    })) as MemoryRecord[];
  },

  getRecent: (limit: number = 20) => {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM memories ORDER BY createdAt DESC LIMIT ?')
      .all(limit) as any[];
    
    return rows.map(row => ({
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
    })) as MemoryRecord[];
  },

  updateAccess: (id: string) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE memories 
      SET lastAccessedAt = ?, accessCount = accessCount + 1
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
  },

  getAll: () => {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM memories ORDER BY importance DESC, createdAt DESC').all() as any[];
    return rows.map(row => ({
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
    })) as MemoryRecord[];
  },

  delete: (id: string) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM memories WHERE id = ?');
    stmt.run(id);
  },
};
