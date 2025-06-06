'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import {
  geocodeAddress,
  type LocationComponents,
} from '@/lib/services/location-matching';
import { useDebounce } from '@/hooks/use-debounce';

interface LocationSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onLocationSelect?: (location: LocationComponents) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function LocationSearchInput({
  value = '',
  onChange,
  onLocationSelect,
  placeholder = 'Search for a location...',
  className,
  disabled = false,
}: LocationSearchInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationComponents[]>([]);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchQuery = useDebounce(inputValue, 500);

  // Search for locations when debounced query changes (only if user is typing)
  useEffect(() => {
    const searchLocations = async () => {
      if (debouncedSearchQuery.length < 3 || !isUserTyping) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await geocodeAddress(debouncedSearchQuery);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    searchLocations();
  }, [debouncedSearchQuery, isUserTyping]);

  // Update input value when prop changes (programmatic update)
  useEffect(() => {
    // Only update if the value is significantly different to prevent flickering
    if (value !== inputValue && !isUserTyping) {
      setInputValue(value);
      setSuggestions([]); // Clear suggestions to prevent dropdown from opening
      setIsOpen(false);
    }
  }, [value, inputValue, isUserTyping]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setIsUserTyping(true); // Mark as user input

    // Only call onChange if value actually changed
    if (newValue !== value) {
      onChange?.(newValue);
    }
  };

  const handleSelectLocation = (location: LocationComponents) => {
    const displayName =
      location.address || `${location.city}, ${location.country}`;
    setInputValue(displayName);
    setIsUserTyping(false); // This is a programmatic update
    setSuggestions([]); // Clear suggestions to prevent dropdown from reopening
    onChange?.(displayName);
    onLocationSelect?.(location);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    setIsUserTyping(false); // Reset typing state
    onChange?.('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && inputValue.length >= 3 && isUserTyping) {
      setIsOpen(true);
    }
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={() => setIsUserTyping(true)} // Ensure user typing is set on keydown
          placeholder={placeholder}
          disabled={disabled}
          className={cn('pl-10 pr-20', isOpen && 'border-primary')}
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {inputValue && !disabled && (
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
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {suggestions.map((location, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectLocation(location)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-start gap-2 transition-colors"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {location.city || location.town || 'Unknown Location'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {location.address}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
