import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cleanPayload } from '@/lib/forms';
import { useCreatePosition, useUpdatePosition } from './usePositions';

const positionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  displayOrder: z.coerce.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
});

const DEFAULT_VALUES = { name: '', displayOrder: 0 };

export default function PositionFormDialog({ open, onOpenChange, position }) {
  const isEditing = Boolean(position);
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const isPending = createPosition.isPending || updatePosition.isPending;

  const form = useForm({
    resolver: zodResolver(positionSchema),
    values: position
      ? {
          name: position.name ?? '',
          displayOrder: position.displayOrder ?? 0,
        }
      : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && !isEditing) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, isEditing, form]);

  const onSubmit = (values) => {
    const payload = cleanPayload(values);
    const mutation = isEditing ? updatePosition : createPosition;
    const args = isEditing ? { id: position.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Position updated' : 'Position created');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to save position'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit position' : 'Add position'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this position.' : 'Create a new position your staff can be assigned to.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Barber" {...field} />
                  </FormControl>
                  <FormMessage />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create position'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
