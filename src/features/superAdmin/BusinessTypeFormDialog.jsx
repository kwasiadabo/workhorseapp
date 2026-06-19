import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateBusinessType, useUpdateBusinessType } from './useSuperAdminBusinessTypes';

const schema = z.object({
  value: z
    .string()
    .min(1, 'Value is required')
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, digits, or underscores only'),
  label: z.string().min(1, 'Label is required').max(150),
  displayOrder: z.coerce.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
  isActive: z.boolean(),
});

const DEFAULT_VALUES = { value: '', label: '', displayOrder: 0, isActive: true };

export default function BusinessTypeFormDialog({ open, onOpenChange, businessType }) {
  const isEditing = Boolean(businessType);
  const create = useCreateBusinessType();
  const update = useUpdateBusinessType();
  const isPending = create.isPending || update.isPending;

  const form = useForm({
    resolver: zodResolver(schema),
    values: businessType
      ? {
          value: businessType.value ?? '',
          label: businessType.label ?? '',
          displayOrder: businessType.displayOrder ?? 0,
          isActive: businessType.isActive ?? true,
        }
      : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && !isEditing) form.reset(DEFAULT_VALUES);
  }, [open, isEditing, form]);

  const onSubmit = (values) => {
    const mutation = isEditing ? update : create;
    const args = isEditing ? { id: businessType.id, data: values } : values;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Business type updated' : 'Business type created');
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(error?.response?.data?.message ?? 'Unable to save business type'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit business type' : 'Add business type'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this business type. Changes take effect on the registration page immediately.'
              : 'Add a new business type for tenants to choose at registration.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Barbershop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. barbershop" disabled={isEditing} {...field} />
                  </FormControl>
                  <FormMessage />
                  {!isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, digits, and underscores. Cannot be changed after creation.
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel>Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Inactive types are hidden from the registration page.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
