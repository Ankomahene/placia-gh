'use client';

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
import { usePlaceSubcategories } from '@/hooks/admin/use-place-subcategories';
import type { PlaceSubcategory } from '@/types/place';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SubcategoryFormProps {
  categoryId: string;
  subcategory?: PlaceSubcategory | null;
  onSuccess?: () => void;
}

export function SubcategoryForm({
  categoryId,
  subcategory,
  onSuccess,
}: SubcategoryFormProps) {
  const { createSubcategory, updateSubcategory, isCreating, isUpdating } =
    usePlaceSubcategories(categoryId);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subcategory?.name || '',
      icon: subcategory?.icon || '',
      description: subcategory?.description || '',
    },
  });

  async function onSubmit(data: FormData) {
    if (subcategory) {
      await updateSubcategory({ id: subcategory.id, ...data });
    } else {
      await createSubcategory({ ...data, category_id: categoryId });
    }
    onSuccess?.();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormLabel>Icon (emoji)</FormLabel>
              <FormControl>
                <Input placeholder="Enter an emoji" {...field} />
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
