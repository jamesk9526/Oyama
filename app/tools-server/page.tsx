'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Server, Wrench, Activity, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  openSource: boolean;
  permissions: string[];
}

interface ToolCallLog {
  id: string;
  toolName: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  duration?: number;
  error?: string;
}

export default function ToolsServerPage() {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [logs, setLogs] = useState<ToolCallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch tools and logs from API
    setLoading(false);
  }, []);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MCP Tools Server</h1>
            <p className="text-muted-foreground mt-1">
              Local, embedded MCP-compatible tool orchestration engine
            </p>
          </div>
          <Button variant="secondary">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>

        {/* Info Panel */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Server className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">About MCP Tools Server</p>
                <p className="text-muted-foreground mt-1">
                  A local, embedded MCP-compatible tool orchestration engine that runs fully locally, 
                  exposes tools to agents & crews, tracks stages, memory, artifacts, and approvals. 
                  It&apos;s inspectable, interruptible, and uses only open-source tools.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Registered Tools</p>
                  <p className="text-2xl font-bold mt-1">{tools.length}</p>
                </div>
                <Wrench className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Workflows</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tool Calls Today</p>
                  <p className="text-2xl font-bold mt-1">{logs.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold mt-1">
                    {logs.filter(l => l.status === 'error').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tools" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tools">Registered Tools</TabsTrigger>
            <TabsTrigger value="logs">Call History</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4">
            {tools.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Wrench className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No tools registered</p>
                  <p className="text-muted-foreground text-sm">
                    Tools will appear here once registered in the tools directory
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <Card key={tool.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <Badge variant={tool.enabled ? 'success' : 'default'}>
                          {tool.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="default">{tool.category}</Badge>
                          {tool.openSource && (
                            <Badge variant="success" className="border-success">
                              Open Source
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tool calls yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {log.status === 'success' && <CheckCircle className="w-4 h-4 text-success" />}
                          {log.status === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
                          {log.status === 'pending' && <Clock className="w-4 h-4 text-warning" />}
                          <div>
                            <p className="font-medium text-sm">{log.toolName}</p>
                            <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                          </div>
                        </div>
                        {log.duration && (
                          <Badge variant="default">{log.duration}ms</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm text-center py-8">
                  Permissions management coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
