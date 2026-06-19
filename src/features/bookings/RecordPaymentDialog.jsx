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
import { useCreateBookingPayment } from './useBookings';
import { PAYMENT_METHODS } from './bookings.constants';

const buildPaymentSchema = (balanceDue) =>
  z.object({
    amount: z.coerce
      .number()
      .min(balanceDue, `Amount must be at least GH¢ ${balanceDue.toFixed(2)} (the balance due) — partial payments aren't allowed`),
    method: z.enum(PAYMENT_METHODS),
    notes: z.string().optional().or(z.literal('')),
  });

export default function RecordPaymentDialog({ open, onOpenChange, bookingId, defaultAmount = 0, currency = 'GH¢' }) {
  const createPayment = useCreateBookingPayment();

  const form = useForm({
    resolver: zodResolver(buildPaymentSchema(defaultAmount)),
    values: { amount: defaultAmount, method: 'cash', notes: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ amount: defaultAmount, method: 'cash', notes: '' });
    }
  }, [open, defaultAmount, form]);

  const onSubmit = (values) => {
    const payload = cleanPayload({ ...values, bookingId, currency });

    createPayment.mutate(payload, {
      onSuccess: () => {
        toast.success('Payment recorded');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to record payment'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>Record a payment received for this booking.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({currency})</FormLabel>
                    <FormControl>
                      <Input type="number" min={defaultAmount} step="0.01" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Balance due: {currency} {defaultAmount.toFixed(2)} — partial payments aren't allowed.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full capitalize">
                          <SelectValue>{(value) => value?.replace('_', ' ')}</SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((opt) => (
                          <SelectItem key={opt} value={opt} className="capitalize">
                            {opt.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPayment.isPending}>
                {createPayment.isPending ? 'Saving...' : 'Record payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
