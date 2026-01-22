// Tool discovery and indexing system
import type { ToolDefinition, ToolCategory } from '@/types';
import { toolRegistry } from './registry';

export interface ToolIndex {
  byCategory: Map<ToolCategory, Set<string>>;
  byKeyword: Map<string, Set<string>>;
  byPermission: Map<string, Set<string>>;
  bySource: Map<'builtin' | 'external' | 'user', Set<string>>;
}

export interface ToolSearchQuery {
  keywords?: string[];
  categories?: ToolCategory[];
  permissions?: string[];
  source?: 'builtin' | 'external' | 'user';
  enabled?: boolean;
  openSource?: boolean;
}

export interface ToolSearchResult {
  tool: ToolDefinition;
  score: number;
  matchedFields: string[];
}

export class ToolDiscoveryService {
  private index: ToolIndex = {
    byCategory: new Map(),
    byKeyword: new Map(),
    byPermission: new Map(),
    bySource: new Map(),
  };

  /**
   * Build index from registered tools
   */
  buildIndex(): void {
    // Clear existing index
    this.index = {
      byCategory: new Map(),
      byKeyword: new Map(),
      byPermission: new Map(),
      bySource: new Map(),
    };

    const tools = toolRegistry.list();

    tools.forEach(tool => {
      this.indexTool(tool);
    });
  }

  /**
   * Index a single tool
   */
  private indexTool(tool: ToolDefinition): void {
    // Index by category
    if (!this.index.byCategory.has(tool.category)) {
      this.index.byCategory.set(tool.category, new Set());
    }
    this.index.byCategory.get(tool.category)!.add(tool.id);

    // Index by keywords from name and description
    const keywords = this.extractKeywords(tool.name + ' ' + tool.description);
    keywords.forEach(keyword => {
      if (!this.index.byKeyword.has(keyword)) {
        this.index.byKeyword.set(keyword, new Set());
      }
      this.index.byKeyword.get(keyword)!.add(tool.id);
    });

    // Index by permissions
    tool.permissions?.forEach(permission => {
      if (!this.index.byPermission.has(permission)) {
        this.index.byPermission.set(permission, new Set());
      }
      this.index.byPermission.get(permission)!.add(tool.id);
    });

    // Index by source
    const source = this.determineSource(tool);
    if (!this.index.bySource.has(source)) {
      this.index.bySource.set(source, new Set());
    }
    this.index.bySource.get(source)!.add(tool.id);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2);
  }

  /**
   * Determine tool source
   */
  private determineSource(tool: ToolDefinition): 'builtin' | 'external' | 'user' {
    if (tool.id.startsWith('tool-')) {
      return 'builtin';
    } else if (tool.id.startsWith('ext-')) {
      return 'external';
    }
    return 'user';
  }

  /**
   * Search for tools
   */
  search(query: ToolSearchQuery): ToolSearchResult[] {
    let candidateIds = new Set<string>();
    const scores = new Map<string, { score: number; fields: Set<string> }>();

    // If no query specified, return all tools
    if (!query.keywords && !query.categories && !query.permissions && !query.source) {
      const tools = toolRegistry.list({
        enabled: query.enabled,
        openSource: query.openSource,
      });
      return tools.map(tool => ({
        tool,
        score: 1,
        matchedFields: [],
      }));
    }

    // Search by keywords
    if (query.keywords && query.keywords.length > 0) {
      query.keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        const matchingIds = this.index.byKeyword.get(normalizedKeyword);
        
        if (matchingIds) {
          matchingIds.forEach(id => {
            candidateIds.add(id);
            const current = scores.get(id) || { score: 0, fields: new Set<string>() };
            current.score += 10;
            current.fields.add('keyword');
            scores.set(id, current);
          });
        }
      });
    }

    // Search by categories
    if (query.categories && query.categories.length > 0) {
      const categoryMatches = new Set<string>();
      query.categories.forEach(category => {
        const ids = this.index.byCategory.get(category);
        if (ids) {
          ids.forEach(id => categoryMatches.add(id));
        }
      });

      if (candidateIds.size === 0) {
        candidateIds = categoryMatches;
      } else {
        // Intersect with existing candidates
        candidateIds = new Set(
          [...candidateIds].filter(id => categoryMatches.has(id))
        );
      }

      categoryMatches.forEach(id => {
        const current = scores.get(id) || { score: 0, fields: new Set<string>() };
        current.score += 5;
        current.fields.add('category');
        scores.set(id, current);
      });
    }

    // Search by permissions
    if (query.permissions && query.permissions.length > 0) {
      const permissionMatches = new Set<string>();
      query.permissions.forEach(permission => {
        const ids = this.index.byPermission.get(permission);
        if (ids) {
          ids.forEach(id => permissionMatches.add(id));
        }
      });

      if (candidateIds.size === 0) {
        candidateIds = permissionMatches;
      } else {
        candidateIds = new Set(
          [...candidateIds].filter(id => permissionMatches.has(id))
        );
      }

      permissionMatches.forEach(id => {
        const current = scores.get(id) || { score: 0, fields: new Set<string>() };
        current.score += 3;
        current.fields.add('permission');
        scores.set(id, current);
      });
    }

    // Search by source
    if (query.source) {
      const sourceIds = this.index.bySource.get(query.source);
      if (sourceIds) {
        if (candidateIds.size === 0) {
          candidateIds = new Set(sourceIds);
        } else {
          candidateIds = new Set(
            [...candidateIds].filter(id => sourceIds.has(id))
          );
        }

        sourceIds.forEach(id => {
          const current = scores.get(id) || { score: 0, fields: new Set<string>() };
          current.score += 2;
          current.fields.add('source');
          scores.set(id, current);
        });
      }
    }

    // Get tool definitions and apply additional filters
    const results: ToolSearchResult[] = [];
    
    candidateIds.forEach(id => {
      const tool = toolRegistry.get(id);
      if (!tool) return;

      // Apply filters
      if (query.enabled !== undefined && tool.enabled !== query.enabled) {
        return;
      }
      if (query.openSource !== undefined && tool.openSource !== query.openSource) {
        return;
      }

      const scoreData = scores.get(id) || { score: 1, fields: new Set<string>() };
      results.push({
        tool,
        score: scoreData.score,
        matchedFields: Array.from(scoreData.fields),
      });
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Discover tools by capability
   */
  discoverByCapability(capability: string): ToolDefinition[] {
    const results = this.search({
      keywords: [capability],
    });
    
    return results.map(r => r.tool);
  }

  /**
   * Get related tools
   */
  getRelatedTools(toolId: string, limit: number = 5): ToolDefinition[] {
    const tool = toolRegistry.get(toolId);
    if (!tool) return [];

    // Find tools in same category
    const sameCategoryIds = this.index.byCategory.get(tool.category);
    if (!sameCategoryIds) return [];

    const related: ToolDefinition[] = [];
    
    sameCategoryIds.forEach(id => {
      if (id !== toolId) {
        const relatedTool = toolRegistry.get(id);
        if (relatedTool) {
          related.push(relatedTool);
        }
      }
    });

    return related.slice(0, limit);
  }

  /**
   * Get tool statistics
   */
  getStatistics() {
    return {
      totalTools: toolRegistry.list().length,
      byCategory: Array.from(this.index.byCategory.entries()).map(([category, ids]) => ({
        category,
        count: ids.size,
      })),
      bySource: Array.from(this.index.bySource.entries()).map(([source, ids]) => ({
        source,
        count: ids.size,
      })),
      keywords: this.index.byKeyword.size,
    };
  }

  /**
   * Refresh index (rebuild from current tools)
   */
  refreshIndex(): void {
    this.buildIndex();
  }
}

// Singleton instance
export const toolDiscovery = new ToolDiscoveryService();

// Initialize index on startup
toolDiscovery.buildIndex();
