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
import { cleanPayload } from '@/lib/forms';
import { useCreateBank, useUpdateBank } from './useBanks';

const bankSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  shortCode: z.string().max(20).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const DEFAULT_VALUES = { name: '', shortCode: '', displayOrder: 0, isActive: true };

export default function BankFormDialog({ open, onOpenChange, bank }) {
  const isEditing = Boolean(bank);
  const createBank = useCreateBank();
  const updateBank = useUpdateBank();
  const isPending = createBank.isPending || updateBank.isPending;

  const form = useForm({
    resolver: zodResolver(bankSchema),
    values: bank
      ? { name: bank.name ?? '', shortCode: bank.shortCode ?? '', displayOrder: bank.displayOrder ?? 0, isActive: bank.isActive ?? true }
      : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && !isEditing) form.reset(DEFAULT_VALUES);
  }, [open, isEditing, form]);

  const onSubmit = (values) => {
    const payload = cleanPayload(values);
    const mutation = isEditing ? updateBank : createBank;
    const args = isEditing ? { id: bank.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Bank updated' : 'Bank added');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to save bank'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit bank' : 'Add bank'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this financial institution.' : 'Add a bank or financial institution your business uses.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ghana Commercial Bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short code <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. GCB" maxLength={20} {...field} />
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
            {isEditing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="mt-0!">Active</FormLabel>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Add bank'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
