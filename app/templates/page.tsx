'use client';

import { useState, useEffect } from 'react';
import { Template } from '@/types';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Star, FileText } from 'lucide-react';
import { useTemplatesStore } from '@/lib/stores/templates';
import { TemplateEngine } from '@/lib/templates/engine';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, loading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate, toggleFavorite } = useTemplatesStore();
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Filter templates
  useEffect(() => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((t) => t.isFavorite);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, showFavoritesOnly]);

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))) as string[];

  const handleSaveTemplate = async (template: Partial<Template>) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, template);
    } else {
      await createTemplate(template);
    }
    setEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleDelete = async (template: Template) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(template.id);
    }
  };

  const handleTest = (template: Template) => {
    const previewBody = TemplateEngine.preview(template);
    sessionStorage.setItem(
      'oyama:template-test',
      JSON.stringify({
        body: previewBody,
        systemAdditions: template.systemAdditions || '',
        name: template.name,
      })
    );
    router.push('/chats?newChat=1&templateTest=1');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-xl font-semibold tracking-tight">Templates <span className="text-sm text-muted-foreground font-normal">({templates.length})</span></h1>
          <Button size="sm" onClick={() => { setEditingTemplate(null); setEditorOpen(true); }}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-9"
            />
          </div>
          <Button
            variant={showFavoritesOnly ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title="Toggle favorites"
            aria-label="Toggle favorites"
          >
            <Star className={showFavoritesOnly ? 'fill-current' : ''} />
          </Button>
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="cursor-pointer"
            >
              <Badge
                variant={selectedCategory === null ? 'primary' : 'default'}
              >
                All
              </Badge>
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="cursor-pointer"
              >
                <Badge
                  variant={selectedCategory === category ? 'primary' : 'default'}
                >
                  {category}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTest}
                onToggleFavorite={() => toggleFavorite(template.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No templates found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedCategory
                ? 'Try adjusting your filters'
                : 'Get started by creating your first template'}
            </p>
            {!searchQuery && !selectedCategory && (
              <Button onClick={() => setEditorOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      <TemplateEditor
        template={editingTemplate}
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
