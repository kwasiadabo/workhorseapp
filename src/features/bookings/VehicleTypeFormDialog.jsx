import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateVehicleType, useUpdateVehicleType } from './useVehicleTypes';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

export default function VehicleTypeFormDialog({ open, onOpenChange, vehicleType }) {
  const isEdit = Boolean(vehicleType);
  const create = useCreateVehicleType();
  const update = useUpdateVehicleType();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', displayOrder: 0 },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        vehicleType ? { name: vehicleType.name, displayOrder: vehicleType.displayOrder ?? 0 } : { name: '', displayOrder: 0 }
      );
    }
  }, [open, vehicleType, form]);

  const onSubmit = (values) => {
    const action = isEdit
      ? update.mutateAsync({ id: vehicleType.id, data: values })
      : create.mutateAsync(values);

    action.then(() => {
      toast.success(isEdit ? 'Vehicle type updated' : 'Vehicle type created');
      onOpenChange(false);
    }).catch((error) => {
      toast.error(error?.response?.data?.message ?? 'Unable to save vehicle type');
    });
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit vehicle type' : 'New vehicle type'}</DialogTitle>
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
                    <Input placeholder="e.g. Saloon, SUV, Pickup" {...field} />
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
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
