import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { useUpdateBooking } from './useBookings';
import { MANUAL_BOOKING_STATUSES } from './bookings.constants';

const statusSchema = z.object({
  status: z.enum(MANUAL_BOOKING_STATUSES),
});

export default function UpdateBookingStatusDialog({ open, onOpenChange, booking }) {
  const updateBooking = useUpdateBooking();

  const form = useForm({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: MANUAL_BOOKING_STATUSES[0] },
  });

  useEffect(() => {
    if (open) {
      form.reset({ status: MANUAL_BOOKING_STATUSES[0] });
    }
  }, [open, form]);

  const onSubmit = (values) => {
    updateBooking.mutate(
      { id: booking.id, data: { status: values.status } },
      {
        onSuccess: () => {
          toast.success('Booking status updated');
          onOpenChange(false);
        },
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to update status'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel or mark as no-show</DialogTitle>
          <DialogDescription>
            Other statuses update automatically as work progresses. Use this only to cancel the booking or record
            that the client didn&apos;t show up.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full capitalize">
                        <SelectValue>{(value) => value?.replace('_', ' ')}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MANUAL_BOOKING_STATUSES.map((opt) => (
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBooking.isPending}>
                {updateBooking.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
