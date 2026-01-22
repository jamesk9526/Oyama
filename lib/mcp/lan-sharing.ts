// LAN-based tool sharing system
// Enables discovery and sharing of tools across local network
import type { ToolDefinition } from '@/types';
import { toolRegistry } from './registry';

export interface LANToolServer {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  discoveredAt: Date;
  lastSeen: Date;
  tools: ToolDefinition[];
  status: 'online' | 'offline';
}

export interface LANDiscoveryConfig {
  enabled: boolean;
  port: number;
  broadcast: boolean;
  advertiseInterval: number; // milliseconds
  discoveryInterval: number; // milliseconds
}

export class LANToolSharingService {
  private servers: Map<string, LANToolServer> = new Map();
  private config: LANDiscoveryConfig = {
    enabled: false,
    port: 8765,
    broadcast: true,
    advertiseInterval: 30000, // 30 seconds
    discoveryInterval: 60000, // 60 seconds
  };
  
  private advertiseTimer?: NodeJS.Timeout;
  private discoveryTimer?: NodeJS.Timeout;

  /**
   * Configure LAN tool sharing
   */
  configure(config: Partial<LANDiscoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start LAN tool sharing service
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('LAN tool sharing is not enabled');
    }

    // Start advertising our tools
    this.startAdvertising();

    // Start discovering other servers
    this.startDiscovery();
  }

  /**
   * Stop LAN tool sharing service
   */
  stop(): void {
    if (this.advertiseTimer) {
      clearInterval(this.advertiseTimer);
      this.advertiseTimer = undefined;
    }

    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = undefined;
    }
  }

  /**
   * Start advertising our tools
   */
  private startAdvertising(): void {
    const advertise = () => {
      // In a real implementation, this would use mDNS/Bonjour
      // For now, we'll just log the intent
      const localTools = toolRegistry.list({ enabled: true });
      
      console.log(`[LAN] Advertising ${localTools.length} tools on port ${this.config.port}`);
      
      // Broadcast availability message
      if (this.config.broadcast) {
        this.broadcastPresence(localTools);
      }
    };

    // Advertise immediately
    advertise();

    // Set up periodic advertising
    this.advertiseTimer = setInterval(advertise, this.config.advertiseInterval);
  }

  /**
   * Start discovering other servers
   */
  private startDiscovery(): void {
    const discover = () => {
      // In a real implementation, this would use mDNS/Bonjour
      console.log('[LAN] Discovering tool servers on local network');
      
      // Check health of known servers
      this.healthCheck();
    };

    // Discover immediately
    discover();

    // Set up periodic discovery
    this.discoveryTimer = setInterval(discover, this.config.discoveryInterval);
  }

  /**
   * Broadcast presence on LAN
   */
  private broadcastPresence(tools: ToolDefinition[]): void {
    // In real implementation, this would send UDP broadcast or use mDNS
    // Format: { type: 'tool-server', tools: [...] }
    const message = {
      type: 'tool-server-announce',
      serverId: this.getLocalServerId(),
      timestamp: new Date().toISOString(),
      toolCount: tools.length,
      port: this.config.port,
    };

    console.log('[LAN] Broadcasting:', message);
  }

  /**
   * Get local server ID
   */
  private getLocalServerId(): string {
    // In real implementation, generate from MAC address or similar
    return 'local-server-' + Date.now();
  }

  /**
   * Register a discovered server
   */
  registerServer(server: Omit<LANToolServer, 'discoveredAt' | 'lastSeen' | 'status'>): void {
    const existingServer = this.servers.get(server.id);
    
    if (existingServer) {
      // Update existing server
      existingServer.lastSeen = new Date();
      existingServer.tools = server.tools;
      existingServer.status = 'online';
    } else {
      // Add new server
      const newServer: LANToolServer = {
        ...server,
        discoveredAt: new Date(),
        lastSeen: new Date(),
        status: 'online',
      };
      this.servers.set(server.id, newServer);
    }
  }

  /**
   * Health check for known servers
   */
  private async healthCheck(): Promise<void> {
    const now = Date.now();
    const timeout = this.config.discoveryInterval * 2;

    for (const [serverId, server] of this.servers.entries()) {
      const timeSinceLastSeen = now - server.lastSeen.getTime();
      
      if (timeSinceLastSeen > timeout) {
        server.status = 'offline';
        console.log(`[LAN] Server ${server.name} (${serverId}) is offline`);
      } else {
        // Attempt to ping the server
        try {
          const isOnline = await this.pingServer(server);
          server.status = isOnline ? 'online' : 'offline';
        } catch (error) {
          server.status = 'offline';
        }
      }
    }
  }

  /**
   * Ping a server to check if it's alive
   */
  private async pingServer(server: LANToolServer): Promise<boolean> {
    try {
      const url = `${server.protocol}://${server.host}:${server.port}/health`;
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of discovered servers
   */
  getServers(onlineOnly: boolean = true): LANToolServer[] {
    const servers = Array.from(this.servers.values());
    
    if (onlineOnly) {
      return servers.filter(s => s.status === 'online');
    }
    
    return servers;
  }

  /**
   * Get tools from a specific server
   */
  getServerTools(serverId: string): ToolDefinition[] {
    const server = this.servers.get(serverId);
    return server ? server.tools : [];
  }

  /**
   * Get all tools from all servers
   */
  getAllLANTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    
    this.servers.forEach(server => {
      if (server.status === 'online') {
        tools.push(...server.tools);
      }
    });
    
    return tools;
  }

  /**
   * Import a tool from a LAN server
   */
  async importTool(serverId: string, toolId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server || server.status !== 'online') {
      throw new Error('Server not available');
    }

    const tool = server.tools.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool not found on server: ${toolId}`);
    }

    // In real implementation, we would:
    // 1. Fetch the tool handler from the remote server
    // 2. Register it locally with a remote execution wrapper
    
    console.log(`[LAN] Would import tool ${tool.name} from ${server.name}`);
    
    return true;
  }

  /**
   * Execute a tool on a remote server
   */
  async executeRemoteTool(
    serverId: string,
    toolId: string,
    inputs: Record<string, unknown>
  ): Promise<unknown> {
    const server = this.servers.get(serverId);
    if (!server || server.status !== 'online') {
      throw new Error('Server not available');
    }

    const url = `${server.protocol}://${server.host}:${server.port}/tools/execute`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId,
          inputs,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Remote execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Failed to execute remote tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a server from the list
   */
  removeServer(serverId: string): boolean {
    return this.servers.delete(serverId);
  }

  /**
   * Clear all discovered servers
   */
  clearServers(): void {
    this.servers.clear();
  }

  /**
   * Get service status
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    serverCount: number;
    onlineServers: number;
  } {
    const servers = Array.from(this.servers.values());
    
    return {
      enabled: this.config.enabled,
      running: this.advertiseTimer !== undefined,
      serverCount: servers.length,
      onlineServers: servers.filter(s => s.status === 'online').length,
    };
  }
}

// Singleton instance
export const lanToolSharing = new LANToolSharingService();
