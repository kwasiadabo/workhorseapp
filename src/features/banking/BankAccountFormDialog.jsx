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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cleanPayload } from '@/lib/forms';
import { useBanks } from './useBanks';
import { useCreateBankAccount, useUpdateBankAccount } from './useBankAccounts';

const schema = z.object({
  bankId: z.string().uuid('Select a bank'),
  accountName: z.string().min(1, 'Account name is required').max(150),
  accountNumber: z.string().min(1, 'Account number is required').max(50),
  accountType: z.enum(['savings', 'current']),
  openingBalance: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  isActive: z.boolean().optional(),
});

const DEFAULT_VALUES = {
  bankId: '',
  accountName: '',
  accountNumber: '',
  accountType: 'current',
  openingBalance: 0,
  currency: 'GHS',
  isActive: true,
};

export default function BankAccountFormDialog({ open, onOpenChange, account }) {
  const isEditing = Boolean(account);
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const isPending = createAccount.isPending || updateAccount.isPending;

  const { data: banksData } = useBanks({ limit: 100 });
  const banks = banksData?.data ?? [];

  const form = useForm({
    resolver: zodResolver(schema),
    values: account
      ? {
          bankId: account.bankId ?? '',
          accountName: account.accountName ?? '',
          accountNumber: account.accountNumber ?? '',
          accountType: account.accountType ?? 'current',
          openingBalance: account.openingBalance ?? 0,
          currency: account.currency ?? 'GHS',
          isActive: account.isActive ?? true,
        }
      : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && !isEditing) form.reset(DEFAULT_VALUES);
  }, [open, isEditing, form]);

  const onSubmit = (values) => {
    const payload = cleanPayload(values);
    const mutation = isEditing ? updateAccount : createAccount;
    const args = isEditing ? { id: account.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Account updated' : 'Account added');
        onOpenChange(false);
      },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Unable to save account'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit bank account' : 'Add bank account'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this bank account.' : 'Register a bank account for your business.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={banks.map((b) => ({ value: b.id, label: b.shortCode ? `${b.name} (${b.shortCode})` : b.name }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select bank" /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-(--radix-select-trigger-width)">
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}{b.shortCode ? ` (${b.shortCode})` : ''}
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
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Operations Account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input maxLength={3} placeholder="GHS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening balance</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
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
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Add account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
