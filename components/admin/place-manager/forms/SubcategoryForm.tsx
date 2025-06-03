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
import { usePlaceSubcategories } from '@/hooks/admin/use-place-subcategories';
import { usePlaceCategories } from '@/hooks/admin/use-place-categories';
import type { PlaceSubcategory } from '@/types/place';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().min(1, 'Icon is required'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
});

type FormData = z.infer<typeof formSchema>;

interface SubcategoryFormProps {
  subcategory?: PlaceSubcategory | null;
  onSuccess?: () => void;
  categoryId?: string;
}

export function SubcategoryForm({
  subcategory,
  onSuccess,
  categoryId,
}: SubcategoryFormProps) {
  const [open, setOpen] = useState(false);
  const { createSubcategory, updateSubcategory, isCreating, isUpdating } =
    usePlaceSubcategories();
  const { categories } = usePlaceCategories(categoryId);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subcategory?.name || '',
      icon: subcategory?.icon || '',
      description: subcategory?.description || '',
      category_id: subcategory?.category_id || '',
    },
  });

  async function onSubmit(data: FormData) {
    if (subcategory) {
      await updateSubcategory({ id: subcategory.id, ...data });
    } else {
      await createSubcategory({ ...data });
    }
    onSuccess?.();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
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
                        ? categories?.find(
                            (category) => category.id === field.value
                          )?.name
                        : 'Select category'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command className="w-full">
                    <CommandInput placeholder="Search category..." />
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {categories?.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => {
                            form.setValue('category_id', category.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              field.value === category.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {category.icon} {category.name}
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
                <Input placeholder="Enter subcategory name" {...field} />
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
                  placeholder="Enter subcategory description"
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
          {subcategory ? 'Update Subcategory' : 'Create Subcategory'}
        </Button>
      </form>
    </Form>
  );
}
