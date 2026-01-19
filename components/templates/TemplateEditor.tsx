'use client';

import { useState } from 'react';
import { Template, TemplateVariable } from '@/types';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Plus, X, Eye } from 'lucide-react';
import { TemplateEngine } from '@/lib/templates/engine';

interface TemplateEditorProps {
  template?: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<Template>) => void;
}

export const TemplateEditor = ({
  template,
  isOpen,
  onClose,
  onSave,
}: TemplateEditorProps) => {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || '');
  const [body, setBody] = useState(template?.body || '');
  const [systemAdditions, setSystemAdditions] = useState(template?.systemAdditions || '');
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [variables, setVariables] = useState<TemplateVariable[]>(template?.variables || []);
  const [newTag, setNewTag] = useState('');

  // Extract variables from template body
  const detectVariables = () => {
    const detected = TemplateEngine.extractVariables(body);
    const newVars: TemplateVariable[] = detected.map(varName => {
      const existing = variables.find(v => v.name === varName);
      return existing || {
        name: varName,
        type: 'string',
        required: true,
        description: '',
      };
    });
    setVariables(newVars);
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addVariable = () => {
    setVariables([
      ...variables,
      {
        name: 'new_variable',
        type: 'string',
        required: false,
        description: '',
      },
    ]);
  };

  const updateVariable = (index: number, updates: Partial<TemplateVariable>) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], ...updates };
    setVariables(newVars);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      ...(template || {}),
      name,
      description,
      category,
      body,
      systemAdditions,
      tags,
      variables,
    });
    onClose();
  };

  const preview = () => {
    if (!body) return body;
    try {
      return TemplateEngine.preview({ variables, body } as Template);
    } catch {
      return body;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Edit Template' : 'Create Template'}
      size="xl"
    >
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" required>Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template does"
              className="mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Blog, Code, Research"
              className="mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="cursor-pointer"
                  >
                    <Badge>
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template Body */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="body" required>Template Body</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={detectVariables}
              >
                Detect Variables
              </Button>
            </div>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your template with {{variables}}..."
              rows={10}
              className="mt-1 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {'{{variable}}'} syntax for variables
            </p>
          </div>

          {/* System Additions */}
          <div>
            <Label htmlFor="systemAdditions">System Prompt Additions (Optional)</Label>
            <Textarea
              id="systemAdditions"
              value={systemAdditions}
              onChange={(e) => setSystemAdditions(e.target.value)}
              placeholder="Additional system instructions for this template..."
              rows={4}
              className="mt-1"
            />
          </div>
        </TabsContent>

        <TabsContent value="variables" className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Define variables used in your template
            </p>
            <Button type="button" onClick={addVariable} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Variable
            </Button>
          </div>

          {variables.map((variable, index) => (
            <div key={index} className="p-3 border border-border rounded-md space-y-2">
              <div className="flex gap-2">
                <Input
                  value={variable.name}
                  onChange={(e) => updateVariable(index, { name: e.target.value })}
                  placeholder="Variable name"
                  className="flex-1"
                />
                <Select
                  value={variable.type}
                  onChange={(e) => updateVariable(index, { type: e.target.value as any })}
                >
                  <option value="string">String</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariable(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Input
                value={variable.description || ''}
                onChange={(e) => updateVariable(index, { description: e.target.value })}
                placeholder="Description (optional)"
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={variable.required}
                    onChange={(e) => updateVariable(index, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
                <Input
                  value={variable.defaultValue || ''}
                  onChange={(e) => updateVariable(index, { defaultValue: e.target.value })}
                  placeholder="Default value (optional)"
                  className="flex-1"
                />
              </div>
            </div>
          ))}

          {variables.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No variables defined</p>
              <p className="text-sm">Click "Detect Variables" or add manually</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Preview with placeholder values</span>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {preview()}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name || !body}>
          {template ? 'Save Changes' : 'Create Template'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
