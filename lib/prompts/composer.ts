import db from '@/lib/db';
import type { Agent, Workspace, Chat, PromptBlock } from '@/types';

export interface PromptCompositionResult {
  finalPrompt: string;
  layers: {
    global?: string;
    workspace?: string;
    agent?: string;
    chat?: string;
    memory?: string;
    blocks?: string[];
  };
  metadata: {
    compiledAt: string;
    totalLength: number;
  };
}

export interface PromptCompositionOptions {
  variables?: Record<string, string>;
  includeMemory?: boolean;
  memoryLimit?: number;
}

/**
 * Prompt Composition Engine
 * Merges prompts in order: Global → Workspace → Agent → Chat → Blocks
 */
export class PromptComposer {
  /**
   * Compose the final system prompt for a chat session
   */
  static async compose(
    workspaceId: string,
    agentId?: string,
    chatId?: string,
    enabledBlockIds?: string[],
    options: PromptCompositionOptions = {}
  ): Promise<PromptCompositionResult> {
    const layers: PromptCompositionResult['layers'] = {};
    const parts: string[] = [];

    const variables = this.buildVariables(workspaceId, agentId, chatId, options.variables);

    // 1. Global System Prompt
    const globalPrompt = this.interpolate(this.getGlobalPrompt(), variables);
    if (globalPrompt) {
      layers.global = globalPrompt;
      parts.push(globalPrompt);
    }

    // 2. Workspace System Prompt
    const workspace = this.getWorkspace(workspaceId);
    if (workspace?.systemPrompt) {
      const workspacePrompt = this.interpolate(workspace.systemPrompt, variables);
      layers.workspace = workspacePrompt;
      parts.push(workspacePrompt);
    }

    // 3. Agent System Prompt
    if (agentId) {
      const agent = this.getAgent(agentId);
      if (agent?.systemPrompt) {
        const agentPrompt = this.interpolate(agent.systemPrompt, variables);
        layers.agent = agentPrompt;
        parts.push(agentPrompt);
        
        // Add style rules if present
        if (agent.styleRules) {
          parts.push(`\nStyle Rules:\n${this.interpolate(agent.styleRules, variables)}`);
        }
      }
    }

    // 4. Chat-level Overrides
    if (chatId) {
      const chat = this.getChat(chatId);
      if (chat?.systemPromptOverrides) {
        const chatPrompt = this.interpolate(chat.systemPromptOverrides, variables);
        layers.chat = chatPrompt;
        parts.push(chatPrompt);
      }
    }

    // 4.5 Optional memory injection
    if (options.includeMemory && chatId) {
      const memory = this.getChatMemory(chatId, options.memoryLimit ?? 20);
      if (memory) {
        layers.memory = memory;
        parts.push(memory);
      }
    }

    // 5. Prompt Blocks (if enabled)
    if (enabledBlockIds && enabledBlockIds.length > 0) {
      const blocks = this.getPromptBlocks(enabledBlockIds);
      if (blocks.length > 0) {
        layers.blocks = blocks.map(b => this.interpolate(b.content, variables));
        parts.push('\n--- Additional Instructions ---');
        blocks.forEach(block => {
          parts.push(`\n[${block.type.toUpperCase()}] ${block.name}:`);
          parts.push(this.interpolate(block.content, variables));
        });
      }
    }

    const finalPrompt = parts.join('\n\n').trim();

    return {
      finalPrompt,
      layers,
      metadata: {
        compiledAt: new Date().toISOString(),
        totalLength: finalPrompt.length,
      },
    };
  }

  /**
   * Preview what the final prompt would be without saving
   */
  static async preview(
    workspaceId: string,
    agentId?: string,
    customPrompt?: string,
    enabledBlockIds?: string[],
    options: PromptCompositionOptions = {}
  ): Promise<string> {
    const parts: string[] = [];

    const variables = this.buildVariables(workspaceId, agentId, undefined, options.variables);

    const globalPrompt = this.interpolate(this.getGlobalPrompt(), variables);
    if (globalPrompt) parts.push(globalPrompt);

    const workspace = this.getWorkspace(workspaceId);
    if (workspace?.systemPrompt) parts.push(this.interpolate(workspace.systemPrompt, variables));

    if (agentId) {
      const agent = this.getAgent(agentId);
      if (agent?.systemPrompt) {
        parts.push(this.interpolate(agent.systemPrompt, variables));
        if (agent.styleRules) parts.push(`\nStyle Rules:\n${this.interpolate(agent.styleRules, variables)}`);
      }
    }

    if (customPrompt) parts.push(this.interpolate(customPrompt, variables));

    if (enabledBlockIds && enabledBlockIds.length > 0) {
      const blocks = this.getPromptBlocks(enabledBlockIds);
      if (blocks.length > 0) {
        parts.push('\n--- Additional Instructions ---');
        blocks.forEach(block => {
          parts.push(`\n[${block.type.toUpperCase()}] ${block.name}:`);
          parts.push(this.interpolate(block.content, variables));
        });
      }
    }

    return parts.join('\n\n').trim();
  }

  /**
   * Get the global system prompt
   */
  private static getGlobalPrompt(): string | null {
    const result = db
      .prepare('SELECT value FROM global_settings WHERE key = ?')
      .get('global_system_prompt') as { value: string } | undefined;
    return result?.value || null;
  }

  /**
   * Build interpolation variables from known entities and supplied values
   */
  private static buildVariables(
    workspaceId: string,
    agentId?: string,
    chatId?: string,
    overrides: Record<string, string> = {}
  ): Record<string, string> {
    const vars: Record<string, string> = { ...overrides };

    const workspace = this.getWorkspace(workspaceId);
    if (workspace) {
      vars.workspaceName = vars.workspaceName ?? workspace.name;
      if (workspace.description) vars.workspaceDescription = vars.workspaceDescription ?? workspace.description;
    }

    if (agentId) {
      const agent = this.getAgent(agentId);
      if (agent) {
        vars.agentName = vars.agentName ?? agent.name;
        vars.agentRole = vars.agentRole ?? agent.role;
      }
    }

    if (chatId) {
      const chat = this.getChat(chatId);
      if (chat) {
        vars.chatTitle = vars.chatTitle ?? chat.title;
      }
    }

    return vars;
  }

  /**
   * Interpolate {{var}} and {{var|default}} placeholders
   */
  private static interpolate(template: string | null, variables: Record<string, string>): string {
    if (!template) return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_\-\.]+)(?:\|([^}]+))?\s*\}\}/g, (_match, key, fallback) => {
      const value = variables[key];
      if (value !== undefined && value !== null && value !== '') return value;
      return (fallback ?? '').trim();
    });
  }

  /**
   * Get recent conversation memory as a prompt block
   */
  private static getChatMemory(chatId: string, limit: number): string | null {
    try {
      const rows = db
        .prepare('SELECT role, content, timestamp FROM messages WHERE chatId = ? ORDER BY timestamp DESC LIMIT ?')
        .all(chatId, limit) as Array<{ role: string; content: string; timestamp: string }>;

      if (!rows || rows.length === 0) return null;

      const ordered = rows.reverse();
      const lines = ordered.map(row => `- (${row.role}) ${row.content}`);
      return `## Conversation Memory (recent ${ordered.length})\n${lines.join('\n')}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get workspace by ID
   */
  private static getWorkspace(workspaceId: string): Workspace | null {
    const result = db
      .prepare('SELECT * FROM workspaces WHERE id = ?')
      .get(workspaceId) as any;
    
    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      systemPrompt: result.system_prompt,
      settings: JSON.parse(result.settings),
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  /**
   * Get agent by ID
   */
  private static getAgent(agentId: string): Agent | null {
    const result = db
      .prepare('SELECT * FROM agents WHERE id = ?')
      .get(agentId) as any;
    
    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      role: result.role,
      systemPrompt: result.system_prompt,
      styleRules: result.style_rules,
      model: result.model,
      provider: result.provider,
      capabilities: JSON.parse(result.capabilities),
      colorTag: result.color_tag,
      icon: result.icon,
      workspaceId: result.workspace_id,
      version: result.version,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  /**
   * Get chat by ID
   */
  private static getChat(chatId: string): Chat | null {
    const result = db
      .prepare('SELECT * FROM chats WHERE id = ?')
      .get(chatId) as any;
    
    if (!result) return null;

    return {
      id: result.id,
      title: result.title,
      workspaceId: result.workspace_id,
      agentId: result.agent_id,
      crewId: result.crew_id,
      systemPromptOverrides: result.system_prompt_overrides,
      metadata: JSON.parse(result.metadata || '{}'),
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  /**
   * Get enabled prompt blocks
   */
  private static getPromptBlocks(blockIds: string[]): PromptBlock[] {
    if (blockIds.length === 0) return [];

    const placeholders = blockIds.map(() => '?').join(',');
    const results = db
      .prepare(`SELECT * FROM prompt_blocks WHERE id IN (${placeholders}) AND enabled = 1 ORDER BY "order"`)
      .all(...blockIds) as any[];

    return results.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      content: row.content,
      enabled: row.enabled === 1,
      order: row.order,
    }));
  }

  /**
   * Save a new version of a system prompt
   */
  static async saveVersion(
    level: 'global' | 'workspace' | 'agent',
    prompt: string,
    entityId?: string,
    changeNote?: string
  ): Promise<void> {
    const { v4: uuidv4 } = await import('uuid');
    
    // Get current version number
    const currentVersion = db
      .prepare(
        'SELECT MAX(version) as version FROM system_prompt_versions WHERE level = ? AND entity_id IS ?'
      )
      .get(level, entityId || null) as { version: number | null } | undefined;

    const newVersion = (currentVersion?.version || 0) + 1;

    // Save new version
    db.prepare(`
      INSERT INTO system_prompt_versions (id, level, entity_id, prompt, version, change_note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      level,
      entityId || null,
      prompt,
      newVersion,
      changeNote || null,
      new Date().toISOString()
    );

    // Update the actual prompt
    if (level === 'global') {
      db.prepare('UPDATE global_settings SET value = ?, updated_at = ? WHERE key = ?').run(
        prompt,
        new Date().toISOString(),
        'global_system_prompt'
      );
    } else if (level === 'workspace' && entityId) {
      db.prepare('UPDATE workspaces SET system_prompt = ?, updated_at = ? WHERE id = ?').run(
        prompt,
        new Date().toISOString(),
        entityId
      );
    } else if (level === 'agent' && entityId) {
      db.prepare('UPDATE agents SET system_prompt = ?, version = ?, updated_at = ? WHERE id = ?').run(
        prompt,
        newVersion,
        new Date().toISOString(),
        entityId
      );
    }
  }

  /**
   * Get version history for a prompt
   */
  static getVersionHistory(
    level: 'global' | 'workspace' | 'agent',
    entityId?: string
  ): any[] {
    return db
      .prepare(
        'SELECT * FROM system_prompt_versions WHERE level = ? AND entity_id IS ? ORDER BY version DESC'
      )
      .all(level, entityId || null);
  }

  /**
   * Rollback to a specific version
   */
  static async rollbackToVersion(
    level: 'global' | 'workspace' | 'agent',
    version: number,
    entityId?: string
  ): Promise<void> {
    const versionRecord = db
      .prepare(
        'SELECT prompt FROM system_prompt_versions WHERE level = ? AND entity_id IS ? AND version = ?'
      )
      .get(level, entityId || null, version) as { prompt: string } | undefined;

    if (!versionRecord) {
      throw new Error(`Version ${version} not found`);
    }

    await this.saveVersion(level, versionRecord.prompt, entityId, `Rolled back to version ${version}`);
  }
}
