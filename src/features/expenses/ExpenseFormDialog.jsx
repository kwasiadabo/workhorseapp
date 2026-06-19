import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cleanPayload } from '@/lib/forms';
import { useBranches } from '@/features/branches/useBranches';
import { useExpenseCategories } from './useExpenseCategories';
import { useCreateExpense, useUpdateExpense } from './useExpenses';

const today = new Date().toISOString().split('T')[0];

const expenseSchema = z.object({
  branchId: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().max(1000).optional().or(z.literal('')),
  amount: z.coerce.number({ invalid_type_error: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  expenseDate: z.string().min(1, 'Expense date is required'),
});

const DEFAULT_VALUES = {
  branchId: 'none',
  categoryId: '',
  description: '',
  amount: '',
  expenseDate: today,
};

export default function ExpenseFormDialog({ open, onOpenChange, expense }) {
  const isEditing = Boolean(expense);

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const { data: categoriesData } = useExpenseCategories({ limit: 100 });
  const categories = categoriesData?.data ?? [];

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const isPending = createExpense.isPending || updateExpense.isPending;

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    values: expense
      ? {
          branchId: expense.branchId ?? 'none',
          categoryId: expense.categoryId ?? '',
          description: expense.description ?? '',
          amount: expense.amount ?? '',
          expenseDate: expense.expenseDate ?? today,
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
    payload.branchId = values.branchId === 'none' ? undefined : values.branchId;

    const mutation = isEditing ? updateExpense : createExpense;
    const args = isEditing ? { id: expense.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Expense updated' : 'Expense recorded');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to save expense'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit expense' : 'Record expense'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this expense record.' : 'Log a new business expense.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expenseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (GH¢)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0.01" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category">
                          {(value) => (value ? (categories.find((c) => c.id === value)?.name ?? 'Select a category') : 'Select a category')}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No categories yet — add some in the Categories tab.
                        </div>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No branch">
                          {(value) =>
                            value === 'none' || !value
                              ? 'No branch'
                              : (branches.find((b) => b.id === value)?.name ?? 'No branch')
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No branch</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any notes about this expense" rows={2} {...field} />
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
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Record expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
