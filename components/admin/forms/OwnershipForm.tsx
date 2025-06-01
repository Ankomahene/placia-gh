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
import { useOwnerships } from '@/hooks/admin/use-ownerships';
import type { Ownership } from '@/types/place';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OwnershipFormProps {
  ownership?: Ownership | null;
  onSuccess?: () => void;
}

export function OwnershipForm({ ownership, onSuccess }: OwnershipFormProps) {
  const { createOwnership, updateOwnership, isCreating, isUpdating } = useOwnerships();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ownership?.name || '',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter ownership name" {...field} />
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