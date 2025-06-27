'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface PlaceContactsFieldProps {
  value?: string[] | null;
  onChange: (value: string[]) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function PlaceContactsField({
  value = [],
  onChange,
  error,
  className,
  label = 'Contact Numbers',
  placeholder = 'Enter phone number',
}: PlaceContactsFieldProps) {
  const [newContact, setNewContact] = useState('');

  // Ensure value is always an array
  const contacts = value || [];

  const addContact = () => {
    if (newContact.trim()) {
      onChange([...contacts, newContact.trim()]);
      setNewContact('');
    }
  };

  const removeContact = (index: number) => {
    onChange(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, newValue: string) => {
    const updated = [...contacts];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>

      {/* Existing contacts */}
      {contacts.map((contact, index) => (
        <div key={index} className="flex gap-2">
          <Input
            type="tel"
            value={contact}
            onChange={(e) => updateContact(index, e.target.value)}
            placeholder={placeholder}
            className={cn(error && 'border-red-500')}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeContact(index)}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add new contact */}
      <div className="flex gap-2">
        <Input
          type="tel"
          value={newContact}
          onChange={(e) => setNewContact(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addContact();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addContact}
          disabled={!newContact.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
