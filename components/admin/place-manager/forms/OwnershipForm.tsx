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
import { IconPicker } from '@/components/ui/icon-picker';
import { useOwnerships } from '@/hooks/admin/use-ownerships';
import type { Ownership } from '@/types/place';

const formSchema = z.object({
  type: z.string().min(2, 'Type must be at least 2 characters'),
  icon: z.string().min(1, 'Icon is required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OwnershipFormProps {
  ownership?: Ownership | null;
  onSuccess?: () => void;
}

export function OwnershipForm({ ownership, onSuccess }: OwnershipFormProps) {
  const { createOwnership, updateOwnership, isCreating, isUpdating } =
    useOwnerships();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: ownership?.type || '',
      icon: ownership?.icon || '',
      description: ownership?.description || '',
    },
  });

  async function onSubmit(data: FormData) {
    if (ownership) {
      await updateOwnership({ id: ownership.id, ...data });
    } else {
      await createOwnership(data);
    }
    onSuccess?.();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Input placeholder="Enter ownership type" {...field} />
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
                  placeholder="Enter ownership description"
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
          {ownership ? 'Update Ownership' : 'Create Ownership'}
        </Button>
      </form>
    </Form>
  );
}
