'use client';

import { useState, useEffect } from 'react';
import { Search, Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCountries, useCountryById } from '@/hooks/use-countries-regions';

interface PlaceCountryFieldProps {
  value: string;
  onChange: (countryId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  description?: string;
  onCountryChange?: (countryId: string) => void;
  defaultValue?: string;
}

export function PlaceCountryField({
  value,
  onChange,
  label = 'Country',
  placeholder = 'Select a country...',
  required = false,
  error,
  className,
  description,
  onCountryChange,
  defaultValue,
}: PlaceCountryFieldProps) {
  const [open, setOpen] = useState(false);

  const { data: countries, isLoading, error: countriesError } = useCountries();
  const { data: selectedCountry } = useCountryById(value);

  // Set default value on mount
  useEffect(() => {
    if (defaultValue && !value && countries) {
      const defaultCountry = countries.find((c) => c.id === defaultValue);
      if (defaultCountry) {
        onChange(defaultValue);
      }
    }
  }, [defaultValue, value, countries, onChange]);

  const handleSelect = (countryId: string) => {
    onChange(countryId);
    onCountryChange?.(countryId);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    onCountryChange?.('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              !value && 'text-muted-foreground',
              error && 'border-red-500'
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedCountry ? (
                <span className="truncate">{selectedCountry.name}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading countries...' : 'No countries found.'}
              </CommandEmpty>
              {countries && (
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.id}
                      value={country.name}
                      onSelect={() => handleSelect(country.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <div className="font-medium">{country.name}</div>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          'ml-auto h-4 w-4',
                          value === country.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {countriesError && (
        <p className="text-sm text-red-500">Failed to load countries</p>
      )}
    </div>
  );
}
