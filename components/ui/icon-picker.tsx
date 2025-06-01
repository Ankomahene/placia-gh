'use client';

import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ChevronsUpDown, Search } from 'lucide-react';
import { categoryIcons } from '@/lib/icons/category-icons';

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  allowCustom?: boolean;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  allowCustom = false,
  className,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [customSvg, setCustomSvg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Check if the initial value is a custom SVG
  useEffect(() => {
    if (value && !categoryIcons.some((icon) => value === icon.id)) {
      setCustomSvg(value);
      setIsCustom(true);
    }
  }, [value]);

  // Filter icons based on search
  const filteredIcons = categoryIcons.filter((icon) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    return (
      icon.name.toLowerCase().includes(query) ||
      icon.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  });

  // Validate and sanitize SVG
  const validateSvg = (svg: string) => {
    try {
      if (!svg.trim().startsWith('<svg') || !svg.trim().endsWith('</svg>')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleCustomSvgChange = (svg: string) => {
    setCustomSvg(svg);
    if (validateSvg(svg)) {
      onChange(svg);
    }
  };

  const selectedIcon = categoryIcons.find((icon) => icon.id === value);

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {isCustom ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5"
                  dangerouslySetInnerHTML={{ __html: customSvg }}
                />
                <span>Custom SVG</span>
              </div>
            ) : selectedIcon ? (
              <div className="flex items-center gap-2">
                <selectedIcon.icon className="w-5 h-5" />
              </div>
            ) : (
              'Select icon...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-full">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="max-h-[300px] overflow-auto -mx-1 px-1">
              {filteredIcons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No icons found
                </p>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {filteredIcons.map((icon) => (
                    <Button
                      key={icon.id}
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-10 w-10 rounded-md',
                        value === icon.id && 'bg-accent'
                      )}
                      onClick={() => {
                        onChange(icon.id);
                        setIsCustom(false);
                        setOpen(false);
                      }}
                    >
                      <icon.icon className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {allowCustom && (
              <div className="pt-2 border-t">
                <Textarea
                  placeholder="Paste custom SVG here..."
                  value={customSvg}
                  onChange={(e) => handleCustomSvgChange(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
                {customSvg && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Preview:</p>
                    <div
                      className="w-8 h-8 border rounded p-1"
                      dangerouslySetInnerHTML={{ __html: customSvg }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
