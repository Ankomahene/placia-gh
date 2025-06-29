'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  searchPregeneratedQueries,
  PregeneratedQuery,
} from '@/lib/pregenerated-queries';
import { Search, Sparkles } from 'lucide-react';
import React, { useMemo } from 'react';

interface SearchSuggestionsProps {
  searchInput: string;
  isOpen: boolean;
  onSuggestionSelect: (suggestion: PregeneratedQuery) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const SearchSuggestions = React.memo(
  function SearchSuggestions({
    searchInput,
    isOpen,
    onSuggestionSelect,
    inputRef,
  }: SearchSuggestionsProps) {
    // Use useMemo to compute suggestions only when needed
    const suggestions = React.useMemo(() => {
      if (!isOpen || searchInput.trim().length < 2) {
        return [];
      }
      return searchPregeneratedQueries(searchInput, 3);
    }, [searchInput, isOpen]);

    // Early return if not open to prevent unnecessary processing
    if (!isOpen || suggestions.length === 0) {
      return null;
    }

    const inputWidth = inputRef.current?.offsetWidth || '100%';

    return (
      <div
        className="absolute top-full left-0 right-0 z-[9999] mt-1"
        style={{ width: inputWidth }}
      >
        <Card className="p-0 shadow-lg border-primary/20 bg-background">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Suggested Searches
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="flex items-start justify-between gap-3 p-3 cursor-pointer hover:bg-primary/5 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary hidden md:inline-block" />
                    <div className="flex-1 min-w-0 text-xs md:text-sm font-medium text-foreground mb-1 line-clamp-1">
                      {suggestion.query}
                    </div>
                  </div>

                  <Sparkles className="h-4 w-4 text-primary/60 hidden md:inline-block" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if meaningful props have changed
    return (
      prevProps.isOpen === nextProps.isOpen &&
      prevProps.searchInput === nextProps.searchInput &&
      prevProps.onSuggestionSelect === nextProps.onSuggestionSelect
    );
  }
);
