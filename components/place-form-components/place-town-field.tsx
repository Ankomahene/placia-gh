'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, X, Search, ChevronDown } from 'lucide-react';
import { useTownSearch, useTownById } from '@/hooks/use-towns';

interface PlaceTownFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  cityId: string;
  defaultTownId?: string;
}

export function PlaceTownField({
  value = '',
  onChange,
  error,
  className,
  label = 'Town/District',
  cityId,
  defaultTownId,
}: PlaceTownFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults = [], isLoading: isSearching } =
    useTownSearch(searchQuery);
  const { data: selectedTown } = useTownById(value);

  const isDisabled = !cityId;

  // Set default value if provided and no current value
  useEffect(() => {
    if (defaultTownId && !value && cityId) {
      onChange(defaultTownId);
    }
  }, [defaultTownId, value, cityId, onChange]);

  // Clear value when city changes
  useEffect(() => {
    if (value && !cityId) {
      onChange('');
      setInputValue('');
    }
  }, [cityId, value, onChange]);

  // Update input value when selected town changes
  useEffect(() => {
    if (selectedTown) {
      setInputValue(selectedTown.name);
    } else if (!value) {
      setInputValue('');
    }
  }, [selectedTown, value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        // Reset input to selected value if no valid selection
        if (selectedTown) {
          setInputValue(selectedTown.name);
        } else {
          setInputValue('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedTown]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setSearchQuery(newValue);
    setIsOpen(newValue.length >= 2);
  };

  const handleSelectTown = (town: any) => {
    onChange(town.id);
    setInputValue(town.name);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setInputValue('');
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (!isDisabled && inputValue.length >= 2) {
      setSearchQuery(inputValue);
      setIsOpen(true);
    }
  };

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={
              isDisabled ? 'Select a city first' : 'Search for a town...'
            }
            disabled={isDisabled}
            className={cn(
              'pl-10 pr-20',
              error && 'border-red-500',
              isOpen && 'border-primary'
            )}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {value && !isDisabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </div>

        {/* Custom Dropdown */}
        {isOpen && !isDisabled && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {isSearching ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Type at least 2 characters to search
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No towns found
              </div>
            ) : (
              <div className="py-1">
                {searchResults.map((town) => (
                  <button
                    key={town.id}
                    type="button"
                    onClick={() => handleSelectTown(town)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors',
                      value === town.id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === town.id
                          ? 'opacity-100 text-primary'
                          : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{town.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {selectedTown && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-3 w-3 text-green-600" />
          Selected: {selectedTown.name}
        </div>
      )}
    </div>
  );
}
