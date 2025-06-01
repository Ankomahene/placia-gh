'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconPicker } from '@/components/ui/icon-picker';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaceTypes } from '@/hooks/admin/use-place-types';
import { usePlaceSubcategories } from '@/hooks/admin/use-place-subcategories';
import type { PlaceType } from '@/types/place';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().min(1, 'Icon is required'),
  description: z.string().optional(),
  subcategory_id: z.string().min(1, 'Subcategory is required'),
});

type FormData = z.infer<typeof formSchema>;

interface TypeFormProps {
  subcategoryId: string;
  type?: PlaceType | null;
  onSuccess?: () => void;
}

export function TypeForm({ subcategoryId, type, onSuccess }: TypeFormProps) {
  const [open, setOpen] = useState(false);
  const { createType, updateType, isCreating, isUpdating } =
    usePlaceTypes(subcategoryId);
  const { subcategories } = usePlaceSubcategories();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: type?.name || '',
      icon: type?.icon || '',
      description: type?.description || '',
      subcategory_id: type?.subcategory_id || subcategoryId,
    },
  });

  async function onSubmit(data: FormData) {
    if (type) {
      await updateType({ id: type.id, ...data });
    } else {
      await createType({ ...data });
    }
    onSuccess?.();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="subcategory_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategory</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {field.value
                        ? subcategories?.find(
                            (subcategory) => subcategory.id === field.value
                          )?.name
                        : 'Select subcategory'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command className="w-full">
                    <CommandInput placeholder="Search subcategory..." />
                    <CommandEmpty>No subcategory found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {subcategories?.map((subcategory) => (
                        <CommandItem
                          key={subcategory.id}
                          value={subcategory.name}
                          onSelect={() => {
                            form.setValue('subcategory_id', subcategory.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              field.value === subcategory.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {subcategory.icon} {subcategory.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter type name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <IconPicker
                  value={field.value}
                  onChange={field.onChange}
                  allowCustom
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter type description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isCreating || isUpdating}
        >
          {type ? 'Update Type' : 'Create Type'}
        </Button>
      </form>
    </Form>
  );
}
