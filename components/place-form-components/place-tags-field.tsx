'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface PlaceTagsFieldProps {
  value?: string[];
  onChange: (value: string[]) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  maxTags?: number;
}

export function PlaceTagsField({
  value = [],
  onChange,
  error,
  className,
  label = 'Tags',
  placeholder = 'Enter a tag and press Enter',
  maxTags = 20,
}: PlaceTagsFieldProps) {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !newTag && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(value.length - 1);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
        <span className="text-xs text-muted-foreground ml-2">
          {value.length}/{maxTags}
        </span>
      </Label>

      {/* Add new tag */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className={cn(error && 'border-red-500')}
          maxLength={30}
          disabled={value.length >= maxTags}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addTag}
          disabled={
            !newTag.trim() ||
            value.includes(newTag.trim().toLowerCase()) ||
            value.length >= maxTags
          }
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Display tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => removeTag(index)}
            >
              {tag}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tags added yet. Tags help users find your place more easily.
        </p>
      )}

      {value.length >= maxTags && (
        <p className="text-sm text-amber-600">
          Maximum number of tags reached. Remove some tags to add new ones.
        </p>
      )}
    </div>
  );
}
