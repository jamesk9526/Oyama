'use client';

import { Template } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Star, Edit, Trash2, Play } from 'lucide-react';
import clsx from 'clsx';

interface TemplateCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  onTest?: (template: Template) => void;
  onToggleFavorite?: (template: Template) => void;
}

export const TemplateCard = ({
  template,
  onEdit,
  onDelete,
  onTest,
  onToggleFavorite,
}: TemplateCardProps) => {
  return (
    <Card className="hover:border-border transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{template.name}</CardTitle>
              <button
                onClick={() => onToggleFavorite?.(template)}
                className={clsx(
                  'transition-colors',
                  template.isFavorite 
                    ? 'text-yellow-500' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={clsx('w-4 h-4', template.isFavorite && 'fill-current')} />
              </button>
            </div>
            {template.description && (
              <CardDescription className="mt-1">{template.description}</CardDescription>
            )}
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.map((tag) => (
              <Badge key={tag} size="sm" variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Category */}
        {template.category && (
          <div className="mt-2">
            <Badge variant="primary" size="sm">
              {template.category}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Variables */}
        {template.variables.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Variables:</p>
            <div className="flex flex-wrap gap-1">
              {template.variables.map((variable) => (
                <code 
                  key={variable.name}
                  className="text-xs bg-muted/60 px-1.5 py-0.5 rounded"
                >
                  {variable.name}
                  {variable.required && <span className="text-destructive">*</span>}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTest?.(template)}
            className="flex-1"
            title="Test template"
            aria-label="Test template"
          >
            <Play className="w-3 h-3 mr-1" />
            Test
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit?.(template)}
            title="Edit template"
            aria-label="Edit template"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete?.(template)}
            title="Delete template"
            aria-label="Delete template"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
