'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Library as LibraryIcon, FileText, Wrench, GitBranch, Search, Plus, Star } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import Link from 'next/link';

interface LibraryItem {
  id: string;
  name: string;
  description: string;
  type: 'template' | 'tool' | 'workflow';
  category: string;
  favorite: boolean;
  usageCount: number;
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // TODO: Fetch library items from API
    setLoading(false);
  }, []);

  const getFilteredItems = (type?: 'template' | 'tool' | 'workflow') => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !type || item.type === type;
      return matchesSearch && matchesType;
    });
  };

  const getTypeIcon = (type: LibraryItem['type']) => {
    switch (type) {
      case 'template': return FileText;
      case 'tool': return Wrench;
      case 'workflow': return GitBranch;
    }
  };

  const renderContent = (filteredItems: LibraryItem[]) => {
    if (loading) {
      return <div className="text-center py-12 text-muted-foreground">Loading library...</div>;
    }

    if (filteredItems.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LibraryIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {items.length === 0 ? 'Library is empty' : 'No matching items'}
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              {items.length === 0
                ? 'Add templates, tools, and workflows to build your library'
                : 'Try adjusting your search or filter'}
            </p>
            {items.length === 0 && (
              <div className="flex gap-3">
                <Link href="/templates">
                  <Button variant="secondary">Browse Templates</Button>
                </Link>
                <Link href="/tools-server">
                  <Button variant="secondary">Browse Tools</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const Icon = getTypeIcon(item.type);
          return (
            <Card key={item.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                  {item.favorite && (
                    <Star className="w-4 h-4 text-warning fill-warning" />
                  )}
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{item.category}</Badge>
                    <Badge variant="default">{item.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Used {item.usageCount} times</span>
                    <Button size="sm" variant="secondary">Use</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Library</h1>
            <p className="text-muted-foreground mt-1">
              Reusable templates, tools, and workflow blueprints
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add to Library
          </Button>
        </div>

        {/* Info Panel */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <LibraryIcon className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">About the Library</p>
                <p className="text-muted-foreground mt-1">
                  The library contains reusable components for your automation platform: templates for prompts, 
                  tools for specific tasks, and workflow blueprints for common multi-stage processes.
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
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold mt-1">{items.length}</p>
                </div>
                <LibraryIcon className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Templates</p>
                  <p className="text-2xl font-bold mt-1">
                    {items.filter(i => i.type === 'template').length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tools</p>
                  <p className="text-2xl font-bold mt-1">
                    {items.filter(i => i.type === 'tool').length}
                  </p>
                </div>
                <Wrench className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Workflows</p>
                  <p className="text-2xl font-bold mt-1">
                    {items.filter(i => i.type === 'workflow').length}
                  </p>
                </div>
                <GitBranch className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {renderContent(getFilteredItems())}
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            {renderContent(getFilteredItems('template'))}
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            {renderContent(getFilteredItems('tool'))}
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            {renderContent(getFilteredItems('workflow'))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
