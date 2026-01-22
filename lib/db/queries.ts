import { getDatabase } from './client';
import type { Agent, Template } from '@/types';
import crypto from 'crypto';

const tableColumnCache = new Map<string, Set<string>>();
const tableExistsCache = new Map<string, boolean>();

const getTableColumns = (table: string): Set<string> => {
  const cached = tableColumnCache.get(table);
  if (cached) return cached;
  const db = getDatabase();
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  const columnSet = new Set(columns.map((col) => col.name));
  tableColumnCache.set(table, columnSet);
  return columnSet;
};

const hasColumn = (table: string, column: string): boolean => {
  return getTableColumns(table).has(column);
};

const hasTable = (table: string): boolean => {
  const cached = tableExistsCache.get(table);
  if (cached !== undefined) return cached;
  const db = getDatabase();
  const result = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(table) as { name?: string } | undefined;
  const exists = !!result?.name;
  tableExistsCache.set(table, exists);
  return exists;
};

const parseJsonArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string') as string[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getOrCreateDefaultWorkspaceId = (): string => {
  if (!hasTable('workspaces')) return '';
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM workspaces LIMIT 1').get() as { id?: string } | undefined;
  if (existing?.id) return existing.id;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const hasSystemPrompt = hasColumn('workspaces', 'system_prompt');
  const hasSettings = hasColumn('workspaces', 'settings');
  const hasCreatedAtSnake = hasColumn('workspaces', 'created_at');
  const hasUpdatedAtSnake = hasColumn('workspaces', 'updated_at');
  const hasCreatedAtCamel = hasColumn('workspaces', 'createdAt');
  const hasUpdatedAtCamel = hasColumn('workspaces', 'updatedAt');

  const columns: string[] = ['id', 'name', 'description'];
  const values: unknown[] = [id, 'Default Workspace', 'Your default workspace for AI agent collaboration'];

  if (hasSystemPrompt) {
    columns.push('system_prompt');
    values.push('You are a helpful AI assistant.');
  }
  if (hasSettings) {
    columns.push('settings');
    values.push(JSON.stringify({ defaultModel: 'llama2', defaultProvider: 'ollama', temperature: 0.7 }));
  }
  if (hasCreatedAtSnake) {
    columns.push('created_at');
    values.push(now);
  } else if (hasCreatedAtCamel) {
    columns.push('createdAt');
    values.push(now);
  }
  if (hasUpdatedAtSnake) {
    columns.push('updated_at');
    values.push(now);
  } else if (hasUpdatedAtCamel) {
    columns.push('updatedAt');
    values.push(now);
  }

  const placeholders = columns.map(() => '?').join(', ');
  db.prepare(`INSERT INTO workspaces (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
  return id;
};

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

  const systemPrompt = agent.systemPrompt ?? agent.system_prompt ?? '';
  const styleRules = agent.styleRules ?? agent.style_rules ?? undefined;
  const colorTag = agent.colorTag ?? agent.color_tag ?? undefined;
  const workspaceId = agent.workspaceId ?? agent.workspace_id ?? '';
  const createdAt = agent.createdAt ?? agent.created_at ?? '';
  const updatedAt = agent.updatedAt ?? agent.updated_at ?? '';

  return {
    ...agent,
    systemPrompt,
    styleRules,
    colorTag,
    workspaceId,
    createdAt,
    updatedAt,
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
    const orderByColumn = hasColumn('agents', 'updated_at') ? 'updated_at' : 'updatedAt';
    const rows = db.prepare(`SELECT * FROM agents ORDER BY ${orderByColumn} DESC`).all() as any[];
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
      INSERT INTO agents (id, name, role, system_prompt, style_rules, model, provider, capabilities, color_tag, icon, workspace_id, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      agent.id,
      agent.name,
      agent.role,
      agent.systemPrompt,
      agent.styleRules || null,
      agent.model,
      agent.provider,
      JSON.stringify(agent.capabilities || []),
      agent.colorTag || null,
      agent.icon || null,
      agent.workspaceId,
      agent.version,
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
      SET name = ?, role = ?, system_prompt = ?, style_rules = ?, model = ?, provider = ?, capabilities = ?, color_tag = ?, icon = ?, workspace_id = ?, version = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      updated.name,
      updated.role,
      updated.systemPrompt,
      updated.styleRules || null,
      updated.model,
      updated.provider,
      JSON.stringify(updated.capabilities || []),
      updated.colorTag || null,
      updated.icon || null,
      updated.workspaceId,
      updated.version,
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

const normalizeTemplate = (template: any): Template => {
  const body = template.body ?? template.content ?? '';
  const isFavorite = template.isFavorite ?? template.is_favorite ?? false;
  const workspaceId = template.workspaceId ?? template.workspace_id ?? null;
  const createdAt = template.createdAt ?? template.created_at ?? '';
  const updatedAt = template.updatedAt ?? template.updated_at ?? '';
  
  let tags: string[] = [];
  if (Array.isArray(template.tags)) {
    tags = template.tags;
  } else if (typeof template.tags === 'string') {
    try {
      const parsed = JSON.parse(template.tags);
      tags = Array.isArray(parsed) ? parsed : [];
    } catch {
      tags = [];
    }
  }
  
  let variables: Template['variables'] = [];
  if (Array.isArray(template.variables)) {
    variables = template.variables;
  } else if (typeof template.variables === 'string') {
    try {
      const parsed = JSON.parse(template.variables);
      variables = Array.isArray(parsed) ? parsed : [];
    } catch {
      variables = [];
    }
  }
  
  return {
    ...template,
    body,
    isFavorite,
    workspaceId,
    createdAt,
    updatedAt,
    tags,
    variables,
  } as Template;
};

// Template queries
export const templateQueries = {
  getAll: () => {
    const db = getDatabase();
    const orderByColumn = hasColumn('templates', 'updated_at') ? 'updated_at' : 'updatedAt';
    const rows = db.prepare(`SELECT * FROM templates ORDER BY ${orderByColumn} DESC`).all() as any[];
    return rows.map(normalizeTemplate) as Template[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as any;
    return row ? normalizeTemplate(row) : undefined;
  },

  create: (template: Template) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO templates (id, name, description, body, category, tags, variables, is_favorite, created_at, updated_at)
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
      SET name = ?, description = ?, body = ?, category = ?, tags = ?, variables = ?, is_favorite = ?, updated_at = ?
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
const normalizeCrew = (crew: any, agentsOverride?: string[]): CrewRecord => {
  const agents = agentsOverride ?? parseJsonArray(crew.agentIds ?? crew.agents ?? []);
  const workflowType = crew.workflowType ?? crew.workflow_type ?? crew.workflow ?? 'sequential';
  const createdAt = crew.createdAt ?? crew.created_at ?? '';
  const updatedAt = crew.updatedAt ?? crew.updated_at ?? '';

  return {
    ...crew,
    agents,
    workflowType,
    status: crew.status || 'idle',
    createdAt,
    updatedAt,
  } as CrewRecord;
};

export const crewQueries = {
  getAll: () => {
    const db = getDatabase();
    const orderByColumn = hasColumn('crews', 'updated_at') ? 'updated_at' : 'updatedAt';
    const rows = db.prepare(`SELECT * FROM crews ORDER BY ${orderByColumn} DESC`).all() as any[];
    const useCrewAgentsTable = hasTable('crew_agents') && !hasColumn('crews', 'agents') && !hasColumn('crews', 'agentIds');

    if (!useCrewAgentsTable) {
      return rows.map((row) => normalizeCrew(row)) as CrewRecord[];
    }

    return rows.map((row) => {
      const agentRows = db
        .prepare('SELECT agent_id FROM crew_agents WHERE crew_id = ? ORDER BY order_index ASC')
        .all(row.id) as { agent_id: string }[];
      const agents = agentRows.map((agentRow) => agentRow.agent_id);
      return normalizeCrew(row, agents);
    }) as CrewRecord[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM crews WHERE id = ?').get(id) as any;
    if (!row) return undefined;

    const useCrewAgentsTable = hasTable('crew_agents') && !hasColumn('crews', 'agents') && !hasColumn('crews', 'agentIds');
    if (!useCrewAgentsTable) return normalizeCrew(row) as CrewRecord;

    const agentRows = db
      .prepare('SELECT agent_id FROM crew_agents WHERE crew_id = ? ORDER BY order_index ASC')
      .all(id) as { agent_id: string }[];
    const agents = agentRows.map((agentRow) => agentRow.agent_id);
    return normalizeCrew(row, agents) as CrewRecord;
  },

  create: (crew: CrewRecord) => {
    const db = getDatabase();
    const hasAgentIds = hasColumn('crews', 'agentIds');
    const hasWorkflowType = hasColumn('crews', 'workflowType');
    const hasCreatedAtCamel = hasColumn('crews', 'createdAt');
    const hasUpdatedAtCamel = hasColumn('crews', 'updatedAt');
    const hasWorkflow = hasColumn('crews', 'workflow');
    const hasWorkflowTypeSnake = hasColumn('crews', 'workflow_type');
    const hasCreatedAtSnake = hasColumn('crews', 'created_at');
    const hasUpdatedAtSnake = hasColumn('crews', 'updated_at');
    const hasWorkspaceId = hasColumn('crews', 'workspace_id');
    const hasVersion = hasColumn('crews', 'version');
    const hasAgentsColumn = hasColumn('crews', 'agents');

    if (hasAgentIds || hasWorkflowType || hasCreatedAtCamel || hasUpdatedAtCamel) {
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
    }

    if (hasAgentsColumn || hasWorkflowTypeSnake) {
      const workspaceId = hasWorkspaceId ? getOrCreateDefaultWorkspaceId() : null;
      const stmt = db.prepare(`
        INSERT INTO crews (id, name, description, workspace_id, workflow_type, agents, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        crew.id,
        crew.name,
        crew.description,
        workspaceId,
        crew.workflowType,
        JSON.stringify(crew.agents || []),
        crew.createdAt,
        crew.updatedAt
      );
      return crew;
    }

    if (hasWorkflow || hasCreatedAtSnake || hasUpdatedAtSnake || hasWorkspaceId) {
      const workspaceId = hasWorkspaceId ? getOrCreateDefaultWorkspaceId() : null;
      const columns = ['id', 'name', 'description', 'workflow'];
      const values: unknown[] = [crew.id, crew.name, crew.description, crew.workflowType];
      if (hasWorkspaceId) {
        columns.push('workspace_id');
        values.push(workspaceId);
      }
      if (hasVersion) {
        columns.push('version');
        values.push(1);
      }
      if (hasCreatedAtSnake) {
        columns.push('created_at');
        values.push(crew.createdAt);
      }
      if (hasUpdatedAtSnake) {
        columns.push('updated_at');
        values.push(crew.updatedAt);
      }

      const placeholders = columns.map(() => '?').join(', ');
      db.prepare(`INSERT INTO crews (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);

      if (hasTable('crew_agents')) {
        const insertAgent = db.prepare(`
          INSERT INTO crew_agents (crew_id, agent_id, order_index)
          VALUES (?, ?, ?)
        `);
        (crew.agents || []).forEach((agentId, index) => {
          insertAgent.run(crew.id, agentId, index);
        });
      }

      return crew;
    }

    return crew;
  },

  update: (id: string, updates: Partial<CrewRecord>) => {
    const db = getDatabase();
    const crew = crewQueries.getById(id);
    if (!crew) return null;

    const updated = { ...crew, ...updates, updatedAt: new Date().toISOString() };
    const hasAgentIds = hasColumn('crews', 'agentIds');
    const hasWorkflowType = hasColumn('crews', 'workflowType');
    const hasUpdatedAtCamel = hasColumn('crews', 'updatedAt');
    const hasWorkflow = hasColumn('crews', 'workflow');
    const hasWorkflowTypeSnake = hasColumn('crews', 'workflow_type');
    const hasUpdatedAtSnake = hasColumn('crews', 'updated_at');
    const hasAgentsColumn = hasColumn('crews', 'agents');

    if (hasAgentIds || hasWorkflowType || hasUpdatedAtCamel) {
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
    }

    if (hasAgentsColumn || hasWorkflowTypeSnake) {
      const stmt = db.prepare(`
        UPDATE crews 
        SET name = ?, description = ?, workflow_type = ?, agents = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        updated.name,
        updated.description,
        updated.workflowType,
        JSON.stringify(updated.agents || []),
        updated.updatedAt,
        id
      );
      return updated;
    }

    if (hasWorkflow || hasUpdatedAtSnake) {
      const columns: string[] = ['name = ?', 'description = ?', 'workflow = ?'];
      const values: unknown[] = [updated.name, updated.description, updated.workflowType];
      if (hasUpdatedAtSnake) {
        columns.push('updated_at = ?');
        values.push(updated.updatedAt);
      }
      values.push(id);
      db.prepare(`UPDATE crews SET ${columns.join(', ')} WHERE id = ?`).run(...values);

      if (hasTable('crew_agents') && updates.agents) {
        db.prepare('DELETE FROM crew_agents WHERE crew_id = ?').run(id);
        const insertAgent = db.prepare(`
          INSERT INTO crew_agents (crew_id, agent_id, order_index)
          VALUES (?, ?, ?)
        `);
        updates.agents.forEach((agentId, index) => {
          insertAgent.run(id, agentId, index);
        });
      }

      return updated;
    }

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
  createdAt: string;
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
    const chatIdColumn = hasColumn('messages', 'chat_id') ? 'chat_id' : 'chatId';
    const createdColumn = hasColumn('messages', 'created_at')
      ? 'created_at'
      : hasColumn('messages', 'timestamp')
        ? 'timestamp'
        : 'createdAt';
    return db
      .prepare(`SELECT * FROM messages WHERE ${chatIdColumn} = ? ORDER BY ${createdColumn} ASC`)
      .all(chatId) as Message[];
  },

  create: (message: Message) => {
    const db = getDatabase();
    const chatIdColumn = hasColumn('messages', 'chat_id') ? 'chat_id' : 'chatId';
    const createdColumn = hasColumn('messages', 'created_at')
      ? 'created_at'
      : hasColumn('messages', 'timestamp')
        ? 'timestamp'
        : 'createdAt';
    const stmt = db.prepare(`
      INSERT INTO messages (id, ${chatIdColumn}, role, content, ${createdColumn})
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(message.id, message.chatId, message.role, message.content, message.createdAt);
    return message;
  },

  deleteByChatId: (chatId: string) => {
    const db = getDatabase();
    const chatIdColumn = hasColumn('messages', 'chat_id') ? 'chat_id' : 'chatId';
    const stmt = db.prepare(`DELETE FROM messages WHERE ${chatIdColumn} = ?`);
    stmt.run(chatId);
  },
};

// Chat queries
export const chatQueries = {
  getAll: () => {
    const db = getDatabase();
    const orderByColumn = hasColumn('chats', 'updated_at') ? 'updated_at' : 'updatedAt';
    return db.prepare(`SELECT * FROM chats ORDER BY ${orderByColumn} DESC`).all() as Chat[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM chats WHERE id = ?').get(id) as Chat | undefined;
  },

  create: (chat: Chat) => {
    const db = getDatabase();
    const includeMessages = hasChatMessagesColumn();
    const usesSnakeCase = hasColumn('chats', 'created_at') || hasColumn('chats', 'updated_at');
    const agentIdColumn = usesSnakeCase ? 'agent_id' : 'agentId';
    const createdAtColumn = usesSnakeCase ? 'created_at' : 'createdAt';
    const updatedAtColumn = usesSnakeCase ? 'updated_at' : 'updatedAt';

    if (usesSnakeCase) {
      const workspaceId = hasColumn('chats', 'workspace_id') ? getOrCreateDefaultWorkspaceId() : null;
      const columns = ['id', 'title', agentIdColumn, createdAtColumn, updatedAtColumn];
      const values: unknown[] = [chat.id, chat.title, chat.agentId || null, chat.createdAt, chat.updatedAt];
      if (hasColumn('chats', 'model')) {
        columns.splice(3, 0, 'model');
        values.splice(3, 0, chat.model || null);
      }
      if (hasColumn('chats', 'workspace_id')) {
        columns.splice(2, 0, 'workspace_id');
        values.splice(2, 0, workspaceId);
      }
      if (includeMessages && hasColumn('chats', 'messages')) {
        columns.push('messages');
        values.push('[]');
      }
      const placeholders = columns.map(() => '?').join(', ');
      db.prepare(`INSERT INTO chats (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
      return chat;
    }

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
    const usesSnakeCase = hasColumn('chats', 'updated_at') || hasColumn('chats', 'created_at');
    const agentIdColumn = usesSnakeCase ? 'agent_id' : 'agentId';
    const updatedAtColumn = usesSnakeCase ? 'updated_at' : 'updatedAt';
    const setClauses = ['title = ?', `${agentIdColumn} = ?`, `${updatedAtColumn} = ?`];
    const values: unknown[] = [updated.title, updated.agentId || null, updated.updatedAt];

    if (hasColumn('chats', 'model')) {
      setClauses.splice(2, 0, 'model = ?');
      values.splice(2, 0, updated.model || null);
    }

    values.push(id);
    const stmt = db.prepare(`
      UPDATE chats 
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);
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
      .prepare('SELECT * FROM attachments WHERE scope_type = ? AND scope_id = ? ORDER BY created_at DESC')
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
      INSERT INTO attachments (id, scope_type, scope_id, name, path, mime, size, created_at)
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
      INSERT INTO crew_runs (id, crew_id, crew_name, workflow_type, input, status, model, provider, temperature, top_p, max_tokens, started_at, completed_at, error)
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
      SET status = ?, completed_at = ?, error = ?
      WHERE id = ?
    `);
    stmt.run(updated.status, updated.completedAt ?? null, updated.error ?? null, id);
    return updated;
  },

  listRuns: (limit = 50) => {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM crew_runs ORDER BY started_at DESC LIMIT ?')
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
      INSERT INTO crew_run_steps (id, run_id, step_index, agent_id, agent_name, input, output, success, error, duration, created_at)
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
      INSERT INTO memories (id, chat_id, content, type, importance, keywords, created_at, access_count)
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
        ORDER BY importance DESC, access_count DESC, created_at DESC
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
      .prepare('SELECT * FROM memories ORDER BY created_at DESC LIMIT ?')
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
      SET last_accessed_at = ?, access_count = access_count + 1
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
  },

  getAll: () => {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM memories ORDER BY importance DESC, created_at DESC').all() as any[];
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
