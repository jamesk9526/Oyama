import { getDatabase } from './client';
import type { Agent, Template, Crew } from '@/types';

// Agent queries
export const agentQueries = {
  getAll: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM agents ORDER BY updatedAt DESC').all() as Agent[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent | undefined;
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
export const crewQueries = {
  getAll: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM crews ORDER BY updatedAt DESC').all() as any[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM crews WHERE id = ?').get(id) as any;
  },

  create: (crew: Crew) => {
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

  update: (id: string, updates: Partial<Crew>) => {
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
    const stmt = db.prepare(`
      INSERT INTO chats (id, title, agentId, model, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(chat.id, chat.title, chat.agentId || null, chat.model || null, chat.createdAt, chat.updatedAt);
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
