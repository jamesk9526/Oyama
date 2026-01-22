'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database, Clock, Tag, Edit, Trash2, Check, X, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

interface Memory {
  id: string;
  type: 'short-term' | 'long-term' | 'project' | 'agent' | 'crew';
  content: string;
  source: string;
  scope?: string;
  tags: string[];
  timestamp: string;
  relevance?: number;
  approved: boolean;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<Memory['type'] | 'all'>('all');

  useEffect(() => {
    // TODO: Fetch memories from API
    setLoading(false);
  }, []);

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: Memory['type']) => {
    switch (type) {
      case 'long-term': return 'primary';
      case 'short-term': return 'default';
      case 'project': return 'success';
      case 'agent': return 'warning';
      case 'crew': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Memory</h1>
            <p className="text-muted-foreground mt-1">
              Persistent, inspectable memory system
            </p>
          </div>
          <Button variant="secondary">
            <Database className="w-4 h-4 mr-2" />
            Manage
          </Button>
        </div>

        {/* Info Panel */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Database className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">About Memory System</p>
                <p className="text-muted-foreground mt-1">
                  The memory system provides persistent, inspectable storage for agents and workflows. 
                  It includes short-term (session), long-term (indexed), project-scoped, agent-scoped, 
                  and crew-shared memory types. All memory writes require approval and can be edited or deleted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Memories</p>
                <p className="text-2xl font-bold mt-1">{memories.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Short-term</p>
                <p className="text-2xl font-bold mt-1">
                  {memories.filter(m => m.type === 'short-term').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Long-term</p>
                <p className="text-2xl font-bold mt-1">
                  {memories.filter(m => m.type === 'long-term').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="text-2xl font-bold mt-1">
                  {memories.filter(m => m.type === 'project').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Agent/Crew</p>
                <p className="text-2xl font-bold mt-1">
                  {memories.filter(m => m.type === 'agent' || m.type === 'crew').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search memories by content or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 rounded-md border border-border bg-background text-sm"
          >
            <option value="all">All Types</option>
            <option value="short-term">Short-term</option>
            <option value="long-term">Long-term</option>
            <option value="project">Project</option>
            <option value="agent">Agent</option>
            <option value="crew">Crew</option>
          </select>
        </div>

        {/* Memory Timeline */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading memories...</div>
        ) : filteredMemories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {memories.length === 0 ? 'No memories yet' : 'No matching memories'}
              </p>
              <p className="text-muted-foreground text-sm">
                {memories.length === 0
                  ? 'Memories will be created as agents and workflows interact'
                  : 'Try adjusting your search or filter'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map((memory) => (
              <Card key={memory.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getTypeColor(memory.type)}>
                          {memory.type}
                        </Badge>
                        {memory.scope && (
                          <Badge variant="default">{memory.scope}</Badge>
                        )}
                        {!memory.approved && (
                          <Badge variant="warning">Pending Approval</Badge>
                        )}
                      </div>
                      <p className="text-sm">{memory.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {memory.timestamp}
                        </span>
                        <span>Source: {memory.source}</span>
                        {memory.relevance && (
                          <span>Relevance: {Math.round(memory.relevance * 100)}%</span>
                        )}
                      </div>
                      {memory.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {memory.tags.map((tag) => (
                            <Badge key={tag} variant="default" className="text-xs">
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!memory.approved && (
                        <>
                          <Button size="sm" variant="ghost" className="text-success">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
