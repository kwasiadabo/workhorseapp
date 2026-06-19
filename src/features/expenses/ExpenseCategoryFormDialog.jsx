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
import { useCreateExpenseCategory, useUpdateExpenseCategory } from './useExpenseCategories';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  displayOrder: z.coerce.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
});

const DEFAULT_VALUES = { name: '', displayOrder: 0 };

export default function ExpenseCategoryFormDialog({ open, onOpenChange, category }) {
  const isEditing = Boolean(category);
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;

  const form = useForm({
    resolver: zodResolver(categorySchema),
    values: category
      ? { name: category.name ?? '', displayOrder: category.displayOrder ?? 0 }
      : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && !isEditing) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, isEditing, form]);

  const onSubmit = (values) => {
    const payload = cleanPayload(values);
    const mutation = isEditing ? updateCategory : createCategory;
    const args = isEditing ? { id: category.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Category updated' : 'Category created');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to save category'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit category' : 'Add category'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this expense category.' : 'Create a new category to group your expenses.'}
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
                    <Input placeholder="e.g. Rent, Supplies, Utilities" {...field} />
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
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
