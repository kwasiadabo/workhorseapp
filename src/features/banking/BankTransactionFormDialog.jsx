import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
import { useBankAccounts } from './useBankAccounts';
import { useCreateBankTransaction, useUpdateBankTransaction } from './useBankTransactions';

const schema = z.object({
  bankAccountId: z.string().uuid('Select an account'),
  branch: z.string().max(150).optional(),
  type: z.enum(['deposit', 'withdrawal'], { required_error: 'Select a type' }),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  transactionDate: z.string().min(1, 'Date is required'),
  referenceNumber: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
});

const today = format(new Date(), 'yyyy-MM-dd');
const DEFAULT_VALUES = {
  bankAccountId: '',
  branch: '',
  type: 'deposit',
  amount: '',
  transactionDate: today,
  referenceNumber: '',
  description: '',
};

export default function BankTransactionFormDialog({ open, onOpenChange, transaction, defaultType }) {
  const isEditing = Boolean(transaction);
  const createTx = useCreateBankTransaction();
  const updateTx = useUpdateBankTransaction();
  const isPending = createTx.isPending || updateTx.isPending;

  const { data: accountsData } = useBankAccounts({ limit: 100 });
  const accounts = accountsData?.data ?? [];

  const form = useForm({
    resolver: zodResolver(schema),
    values: transaction
      ? {
          bankAccountId: transaction.bankAccountId ?? '',
          branch: transaction.branch ?? '',
          type: transaction.type ?? 'deposit',
          amount: transaction.amount ?? '',
          transactionDate: transaction.transactionDate ?? today,
          referenceNumber: transaction.referenceNumber ?? '',
          description: transaction.description ?? '',
        }
      : { ...DEFAULT_VALUES, type: defaultType ?? 'deposit' },
  });

  useEffect(() => {
    if (open && !isEditing) form.reset({ ...DEFAULT_VALUES, type: defaultType ?? 'deposit' });
  }, [open, isEditing, defaultType, form]);

  const onSubmit = (values) => {
    const payload = cleanPayload(values);
    const mutation = isEditing ? updateTx : createTx;
    const args = isEditing ? { id: transaction.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Transaction updated' : 'Transaction recorded');
        onOpenChange(false);
      },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Unable to save transaction'),
    });
  };

  const typeValue = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit transaction' : typeValue === 'deposit' ? 'Record deposit' : 'Record withdrawal'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this bank transaction.'
              : typeValue === 'deposit'
              ? 'Record money deposited into a bank account.'
              : 'Record money withdrawn from a bank account.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction type</FormLabel>
                  <FormControl>
                    <Input
                      readOnly
                      value={field.value === 'deposit' ? 'Deposit' : 'Withdrawal'}
                      className="w-full cursor-default bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank account</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={accounts.map((a) => ({ value: a.id, label: a.Bank?.name ? `${a.accountName} — ${a.Bank.name}` : a.accountName }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select account" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountName} — {a.Bank?.name ?? ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" min="0.01" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transactionDate"
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
            </div>
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference number <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Cheque no., transfer ref., etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Branch" {...field} />
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
                  <FormLabel>Description <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="What is this transaction for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Record transaction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
