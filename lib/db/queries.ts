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

const resolveOrderByColumn = (table: string, camel: string, snake: string): string => {
  if (hasColumn(table, camel)) return camel;
  if (hasColumn(table, snake)) return snake;
  return camel;
};

const addColumnPair = (
  table: string,
  columns: string[],
  values: unknown[],
  camel: string,
  snake: string,
  value: unknown
) => {
  if (hasColumn(table, camel)) {
    columns.push(camel);
    values.push(value);
  }
  if (snake !== camel && hasColumn(table, snake)) {
    columns.push(snake);
    values.push(value);
  }
};

const addUpdatePair = (
  table: string,
  setClauses: string[],
  values: unknown[],
  camel: string,
  snake: string,
  value: unknown
) => {
  if (hasColumn(table, camel)) {
    setClauses.push(`${camel} = ?`);
    values.push(value);
  }
  if (snake !== camel && hasColumn(table, snake)) {
    setClauses.push(`${snake} = ?`);
    values.push(value);
  }
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
    const orderByColumn = resolveOrderByColumn('agents', 'updatedAt', 'updated_at');
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
    const columns = ['id', 'name', 'role'];
    const values: unknown[] = [agent.id, agent.name, agent.role];

    addColumnPair('agents', columns, values, 'systemPrompt', 'system_prompt', agent.systemPrompt);
    addColumnPair('agents', columns, values, 'styleRules', 'style_rules', agent.styleRules || null);
    addColumnPair('agents', columns, values, 'model', 'model', agent.model);
    addColumnPair('agents', columns, values, 'provider', 'provider', agent.provider);
    addColumnPair('agents', columns, values, 'capabilities', 'capabilities', JSON.stringify(agent.capabilities || []));
    addColumnPair('agents', columns, values, 'colorTag', 'color_tag', agent.colorTag || null);
    addColumnPair('agents', columns, values, 'icon', 'icon', agent.icon || null);
    addColumnPair('agents', columns, values, 'workspaceId', 'workspace_id', agent.workspaceId || null);
    addColumnPair('agents', columns, values, 'version', 'version', agent.version || 1);
    addColumnPair('agents', columns, values, 'description', 'description', agent.bio || null);
    addColumnPair('agents', columns, values, 'createdAt', 'created_at', agent.createdAt);
    addColumnPair('agents', columns, values, 'updatedAt', 'updated_at', agent.updatedAt);

    const placeholders = columns.map(() => '?').join(', ');
    db.prepare(`INSERT INTO agents (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
    return agent;
  },

  update: (id: string, updates: Partial<Agent>) => {
    const db = getDatabase();
    const agent = agentQueries.getById(id);
    if (!agent) return null;

    const updated = { ...agent, ...updates, updatedAt: new Date().toISOString() };
    const setClauses: string[] = ['name = ?', 'role = ?'];
    const values: unknown[] = [updated.name, updated.role];

    addUpdatePair('agents', setClauses, values, 'systemPrompt', 'system_prompt', updated.systemPrompt);
    addUpdatePair('agents', setClauses, values, 'styleRules', 'style_rules', updated.styleRules || null);
    addUpdatePair('agents', setClauses, values, 'model', 'model', updated.model);
    addUpdatePair('agents', setClauses, values, 'provider', 'provider', updated.provider);
    addUpdatePair('agents', setClauses, values, 'capabilities', 'capabilities', JSON.stringify(updated.capabilities || []));
    addUpdatePair('agents', setClauses, values, 'colorTag', 'color_tag', updated.colorTag || null);
    addUpdatePair('agents', setClauses, values, 'icon', 'icon', updated.icon || null);
    addUpdatePair('agents', setClauses, values, 'workspaceId', 'workspace_id', updated.workspaceId || null);
    addUpdatePair('agents', setClauses, values, 'version', 'version', updated.version || 1);
    addUpdatePair('agents', setClauses, values, 'description', 'description', updated.bio || null);
    addUpdatePair('agents', setClauses, values, 'updatedAt', 'updated_at', updated.updatedAt);

    db.prepare(`UPDATE agents SET ${setClauses.join(', ')} WHERE id = ?`).run(...values, id);
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
    const orderByColumn = resolveOrderByColumn('templates', 'updatedAt', 'updated_at');
    return db.prepare(`SELECT * FROM templates ORDER BY ${orderByColumn} DESC`).all() as any[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as any;
  },

  create: (template: Template) => {
    const db = getDatabase();
    const columns = ['id', 'name'];
    const values: unknown[] = [template.id, template.name];

    addColumnPair('templates', columns, values, 'description', 'description', template.description || null);
    addColumnPair('templates', columns, values, 'content', 'body', template.body);
    addColumnPair('templates', columns, values, 'category', 'category', template.category || null);
    addColumnPair('templates', columns, values, 'tags', 'tags', JSON.stringify(template.tags || []));
    addColumnPair('templates', columns, values, 'variables', 'variables', JSON.stringify(template.variables || []));
    addColumnPair('templates', columns, values, 'systemAdditions', 'system_additions', template.systemAdditions || null);
    addColumnPair('templates', columns, values, 'examples', 'examples', JSON.stringify(template.examples || []));
    addColumnPair('templates', columns, values, 'outputSchema', 'output_schema', template.outputSchema || null);
    addColumnPair('templates', columns, values, 'workspaceId', 'workspace_id', template.workspaceId || null);
    addColumnPair('templates', columns, values, 'isFavorite', 'is_favorite', template.isFavorite ? 1 : 0);
    addColumnPair('templates', columns, values, 'createdAt', 'created_at', template.createdAt);
    addColumnPair('templates', columns, values, 'updatedAt', 'updated_at', template.updatedAt);

    const placeholders = columns.map(() => '?').join(', ');
    db.prepare(`INSERT INTO templates (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
    return template;
  },

  update: (id: string, updates: Partial<Template>) => {
    const db = getDatabase();
    const template = templateQueries.getById(id);
    if (!template) return null;

    const updated = { ...template, ...updates, updatedAt: new Date().toISOString() };
    const setClauses: string[] = ['name = ?'];
    const values: unknown[] = [updated.name];

    addUpdatePair('templates', setClauses, values, 'description', 'description', updated.description || null);
    addUpdatePair('templates', setClauses, values, 'content', 'body', updated.body);
    addUpdatePair('templates', setClauses, values, 'category', 'category', updated.category || null);
    addUpdatePair('templates', setClauses, values, 'tags', 'tags', JSON.stringify(updated.tags || []));
    addUpdatePair('templates', setClauses, values, 'variables', 'variables', JSON.stringify(updated.variables || []));
    addUpdatePair('templates', setClauses, values, 'systemAdditions', 'system_additions', updated.systemAdditions || null);
    addUpdatePair('templates', setClauses, values, 'examples', 'examples', JSON.stringify(updated.examples || []));
    addUpdatePair('templates', setClauses, values, 'outputSchema', 'output_schema', updated.outputSchema || null);
    addUpdatePair('templates', setClauses, values, 'workspaceId', 'workspace_id', updated.workspaceId || null);
    addUpdatePair('templates', setClauses, values, 'isFavorite', 'is_favorite', updated.isFavorite ? 1 : 0);
    addUpdatePair('templates', setClauses, values, 'updatedAt', 'updated_at', updated.updatedAt);

    db.prepare(`UPDATE templates SET ${setClauses.join(', ')} WHERE id = ?`).run(...values, id);
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

// Tool Logs queries
export const toolLogsDb = {
  create: (log: {
    id: string;
    toolId: string;
    toolName: string;
    chatId?: string;
    agentId?: string;
    inputs: Record<string, any>;
    outputs?: any;
    status: 'success' | 'error' | 'pending';
    error?: string;
    duration?: number;
    timestamp: string;
  }) => {
    const db = getDatabase();
    if (!hasTable('tool_logs')) return;
    
    const stmt = db.prepare(`
      INSERT INTO tool_logs (
        id, toolId, toolName, chatId, agentId, inputs, outputs, 
        status, error, duration, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      log.id,
      log.toolId,
      log.toolName,
      log.chatId || null,
      log.agentId || null,
      JSON.stringify(log.inputs),
      log.outputs ? JSON.stringify(log.outputs) : null,
      log.status,
      log.error || null,
      log.duration || null,
      log.timestamp
    );
  },

  getAll: (filters?: {
    toolId?: string;
    status?: 'success' | 'error' | 'pending';
    limit?: number;
  }) => {
    const db = getDatabase();
    if (!hasTable('tool_logs')) return [];
    
    let query = 'SELECT * FROM tool_logs WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.toolId) {
      query += ' AND toolId = ?';
      params.push(filters.toolId);
    }
    
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY timestamp DESC';
    
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    const rows = db.prepare(query).all(...params) as any[];
    
    return rows.map(row => ({
      ...row,
      inputs: JSON.parse(row.inputs || '{}'),
      outputs: row.outputs ? JSON.parse(row.outputs) : null,
    }));
  },

  getById: (id: string) => {
    const db = getDatabase();
    if (!hasTable('tool_logs')) return null;
    
    const row = db.prepare('SELECT * FROM tool_logs WHERE id = ?').get(id) as any;
    if (!row) return null;
    
    return {
      ...row,
      inputs: JSON.parse(row.inputs || '{}'),
      outputs: row.outputs ? JSON.parse(row.outputs) : null,
    };
  },

  delete: (id: string) => {
    const db = getDatabase();
    if (!hasTable('tool_logs')) return;
    
    const stmt = db.prepare('DELETE FROM tool_logs WHERE id = ?');
    stmt.run(id);
  },

  deleteAll: () => {
    const db = getDatabase();
    if (!hasTable('tool_logs')) return;
    
    db.prepare('DELETE FROM tool_logs').run();
  },
};

// Workflow queries
export interface WorkflowRecord {
  id: string;
  name: string;
  description: string;
  stages: Array<{
    id: string;
    name: string;
    agentId: string;
    status: string;
    requiresApproval: boolean;
  }>;
  workflowType: 'sequential' | 'parallel' | 'conditional';
  status: 'draft' | 'planning' | 'executing' | 'paused' | 'completed' | 'failed';
  crewId?: string;
  createdAt: string;
  updatedAt: string;
}

export const workflowQueries = {
  getAll: () => {
    const db = getDatabase();
    if (!hasTable('workflows')) return [];
    
    const rows = db.prepare('SELECT * FROM workflows ORDER BY updatedAt DESC').all() as any[];
    return rows.map(row => ({
      ...row,
      stages: JSON.parse(row.stages || '[]'),
    })) as WorkflowRecord[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    if (!hasTable('workflows')) return undefined;
    
    const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      stages: JSON.parse(row.stages || '[]'),
    } as WorkflowRecord;
  },

  create: (workflow: WorkflowRecord) => {
    const db = getDatabase();
    if (!hasTable('workflows')) return workflow;
    
    const stmt = db.prepare(`
      INSERT INTO workflows (
        id, name, description, stages, workflowType, status, crewId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      workflow.id,
      workflow.name,
      workflow.description || '',
      JSON.stringify(workflow.stages),
      workflow.workflowType,
      workflow.status,
      workflow.crewId || null,
      workflow.createdAt,
      workflow.updatedAt
    );
    
    return workflow;
  },

  update: (id: string, updates: Partial<WorkflowRecord>) => {
    const db = getDatabase();
    if (!hasTable('workflows')) return null;
    
    const workflow = workflowQueries.getById(id);
    if (!workflow) return null;
    
    const updated = { ...workflow, ...updates, updatedAt: new Date().toISOString() };
    
    const stmt = db.prepare(`
      UPDATE workflows 
      SET name = ?, description = ?, stages = ?, workflowType = ?, status = ?, crewId = ?, updatedAt = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updated.name,
      updated.description || '',
      JSON.stringify(updated.stages),
      updated.workflowType,
      updated.status,
      updated.crewId || null,
      updated.updatedAt,
      id
    );
    
    return updated;
  },

  delete: (id: string) => {
    const db = getDatabase();
    if (!hasTable('workflows')) return;
    
    db.prepare('DELETE FROM workflows WHERE id = ?').run(id);
  },

  getByStatus: (status: WorkflowRecord['status']) => {
    const db = getDatabase();
    if (!hasTable('workflows')) return [];
    
    const rows = db.prepare('SELECT * FROM workflows WHERE status = ? ORDER BY updatedAt DESC').all(status) as any[];
    return rows.map(row => ({
      ...row,
      stages: JSON.parse(row.stages || '[]'),
    })) as WorkflowRecord[];
  },
};

// Workflow state queries
export interface WorkflowStateRecord {
  id: string;
  workflowId: string;
  crewId: string;
  crewName: string;
  workflowDefinition: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStepIndex: number;
  steps: string;
  startTime: string;
  endTime?: string;
  pausedAt?: string;
  resumedAt?: string;
  error?: string;
  context: string;
  createdAt: string;
  updatedAt: string;
}

export const workflowStateQueries = {
  getAll: (filters?: { status?: string; workflowId?: string }) => {
    const db = getDatabase();
    if (!hasTable('workflow_states')) return [];
    
    let query = 'SELECT * FROM workflow_states WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters?.workflowId) {
      query += ' AND workflowId = ?';
      params.push(filters.workflowId);
    }
    
    query += ' ORDER BY updatedAt DESC';
    
    const rows = db.prepare(query).all(...params) as any[];
    return rows as WorkflowStateRecord[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    if (!hasTable('workflow_states')) return undefined;
    
    const row = db.prepare('SELECT * FROM workflow_states WHERE id = ?').get(id) as any;
    return row as WorkflowStateRecord | undefined;
  },

  create: (state: WorkflowStateRecord) => {
    const db = getDatabase();
    if (!hasTable('workflow_states')) return state;
    
    const stmt = db.prepare(`
      INSERT INTO workflow_states (
        id, workflowId, crewId, crewName, workflowDefinition, status, currentStepIndex,
        steps, startTime, endTime, pausedAt, resumedAt, error, context, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      state.id,
      state.workflowId,
      state.crewId,
      state.crewName,
      state.workflowDefinition,
      state.status,
      state.currentStepIndex,
      state.steps,
      state.startTime,
      state.endTime || null,
      state.pausedAt || null,
      state.resumedAt || null,
      state.error || null,
      state.context,
      state.createdAt,
      state.updatedAt
    );
    
    return state;
  },

  update: (id: string, updates: Partial<WorkflowStateRecord>) => {
    const db = getDatabase();
    if (!hasTable('workflow_states')) return null;
    
    const state = workflowStateQueries.getById(id);
    if (!state) return null;
    
    const updated = { ...state, ...updates, updatedAt: new Date().toISOString() };
    
    const stmt = db.prepare(`
      UPDATE workflow_states 
      SET status = ?, currentStepIndex = ?, steps = ?, endTime = ?, 
          pausedAt = ?, resumedAt = ?, error = ?, context = ?, updatedAt = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updated.status,
      updated.currentStepIndex,
      updated.steps,
      updated.endTime || null,
      updated.pausedAt || null,
      updated.resumedAt || null,
      updated.error || null,
      updated.context,
      updated.updatedAt,
      id
    );
    
    return updated;
  },

  delete: (id: string) => {
    const db = getDatabase();
    if (!hasTable('workflow_states')) return;
    
    db.prepare('DELETE FROM workflow_states WHERE id = ?').run(id);
  },
};

// Workflow approval queries
export interface WorkflowApprovalRecord {
  id: string;
  workflowId: string;
  workflowStateId?: string;
  stepIndex: number;
  stepName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  comment?: string;
  data?: string;
}

export const workflowApprovalQueries = {
  getAll: (filters?: { status?: string; workflowId?: string }) => {
    const db = getDatabase();
    if (!hasTable('workflow_approvals')) return [];
    
    let query = 'SELECT * FROM workflow_approvals WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters?.workflowId) {
      query += ' AND workflowId = ?';
      params.push(filters.workflowId);
    }
    
    query += ' ORDER BY requestedAt DESC';
    
    const rows = db.prepare(query).all(...params) as any[];
    return rows as WorkflowApprovalRecord[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    if (!hasTable('workflow_approvals')) return undefined;
    
    const row = db.prepare('SELECT * FROM workflow_approvals WHERE id = ?').get(id) as any;
    return row as WorkflowApprovalRecord | undefined;
  },

  create: (approval: WorkflowApprovalRecord) => {
    const db = getDatabase();
    if (!hasTable('workflow_approvals')) return approval;
    
    const stmt = db.prepare(`
      INSERT INTO workflow_approvals (
        id, workflowId, workflowStateId, stepIndex, stepName, status,
        requestedAt, resolvedAt, resolvedBy, comment, data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      approval.id,
      approval.workflowId,
      approval.workflowStateId || null,
      approval.stepIndex,
      approval.stepName,
      approval.status,
      approval.requestedAt,
      approval.resolvedAt || null,
      approval.resolvedBy || null,
      approval.comment || null,
      approval.data || null
    );
    
    return approval;
  },

  update: (id: string, updates: Partial<WorkflowApprovalRecord>) => {
    const db = getDatabase();
    if (!hasTable('workflow_approvals')) return null;
    
    const approval = workflowApprovalQueries.getById(id);
    if (!approval) return null;
    
    const updated = { ...approval, ...updates };
    
    const stmt = db.prepare(`
      UPDATE workflow_approvals 
      SET status = ?, resolvedAt = ?, resolvedBy = ?, comment = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updated.status,
      updated.resolvedAt || null,
      updated.resolvedBy || null,
      updated.comment || null,
      id
    );
    
    return updated;
  },

  delete: (id: string) => {
    const db = getDatabase();
    if (!hasTable('workflow_approvals')) return;
    
    db.prepare('DELETE FROM workflow_approvals WHERE id = ?').run(id);
  },

  getPending: (workflowId?: string) => {
    const db = getDatabase();
    if (!hasTable('workflow_approvals')) return [];
    
    let query = "SELECT * FROM workflow_approvals WHERE status = 'pending'";
    const params: any[] = [];
    
    if (workflowId) {
      query += ' AND workflowId = ?';
      params.push(workflowId);
    }
    
    query += ' ORDER BY requestedAt ASC';
    
    const rows = db.prepare(query).all(...params) as any[];
    return rows as WorkflowApprovalRecord[];
  },
};

// Workflow execution queries
export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  workflowStateId?: string;
  crewId: string;
  crewName: string;
  workflowType: string;
  initialInput: string;
  status: 'running' | 'completed' | 'failed';
  totalDuration?: number;
  startTime: string;
  endTime?: string;
  error?: string;
}

export const workflowExecutionQueries = {
  getAll: (filters?: { workflowId?: string; status?: string; limit?: number }) => {
    const db = getDatabase();
    if (!hasTable('workflow_executions')) return [];
    
    let query = 'SELECT * FROM workflow_executions WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.workflowId) {
      query += ' AND workflowId = ?';
      params.push(filters.workflowId);
    }
    
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY startTime DESC';
    
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    const rows = db.prepare(query).all(...params) as any[];
    return rows as WorkflowExecutionRecord[];
  },

  getById: (id: string) => {
    const db = getDatabase();
    if (!hasTable('workflow_executions')) return undefined;
    
    const row = db.prepare('SELECT * FROM workflow_executions WHERE id = ?').get(id) as any;
    return row as WorkflowExecutionRecord | undefined;
  },

  create: (execution: WorkflowExecutionRecord) => {
    const db = getDatabase();
    if (!hasTable('workflow_executions')) return execution;
    
    const stmt = db.prepare(`
      INSERT INTO workflow_executions (
        id, workflowId, workflowStateId, crewId, crewName, workflowType,
        initialInput, status, totalDuration, startTime, endTime, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      execution.id,
      execution.workflowId,
      execution.workflowStateId || null,
      execution.crewId,
      execution.crewName,
      execution.workflowType,
      execution.initialInput,
      execution.status,
      execution.totalDuration || null,
      execution.startTime,
      execution.endTime || null,
      execution.error || null
    );
    
    return execution;
  },

  update: (id: string, updates: Partial<WorkflowExecutionRecord>) => {
    const db = getDatabase();
    if (!hasTable('workflow_executions')) return null;
    
    const execution = workflowExecutionQueries.getById(id);
    if (!execution) return null;
    
    const updated = { ...execution, ...updates };
    
    const stmt = db.prepare(`
      UPDATE workflow_executions 
      SET status = ?, totalDuration = ?, endTime = ?, error = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updated.status,
      updated.totalDuration || null,
      updated.endTime || null,
      updated.error || null,
      id
    );
    
    return updated;
  },

  delete: (id: string) => {
    const db = getDatabase();
    if (!hasTable('workflow_executions')) return;
    
    db.prepare('DELETE FROM workflow_executions WHERE id = ?').run(id);
  },
};
