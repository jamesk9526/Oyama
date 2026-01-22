// MCP Module exports
export { toolRegistry, ToolRegistry } from './registry';
export type { ToolHandler } from './registry';
export { mcpAdapter, MCPAdapter } from './adapter';
export { initializeBuiltInTools, getBuiltInTools } from './builtin-tools';
export { toolDiscovery, ToolDiscoveryService } from './discovery';
export type { ToolIndex, ToolSearchQuery, ToolSearchResult } from './discovery';
export { lanToolSharing, LANToolSharingService } from './lan-sharing';
export type { LANToolServer, LANDiscoveryConfig } from './lan-sharing';
