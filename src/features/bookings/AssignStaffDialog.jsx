import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/features/employees/useEmployees';
import { useAddAssignment } from './useBookings';

const assignmentSchema = z.object({
  employeeId: z.string().uuid('Select a service provider'),
  bookingServiceId: z.string(),
  isTeamLead: z.boolean().optional(),
});

const DEFAULT_VALUES = { employeeId: '', bookingServiceId: 'none', isTeamLead: false };

export default function AssignStaffDialog({ open, onOpenChange, bookingId, branchId, bookingServices = [] }) {
  const { data: employeesData } = useEmployees({ branchId, status: 'active', limit: 100 }, { enabled: open });
  const employees = employeesData?.data ?? [];

  const addAssignment = useAddAssignment();

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, form]);

  const onSubmit = (values) => {
    addAssignment.mutate(
      {
        bookingId,
        data: {
          employeeId: values.employeeId,
          bookingServiceId: values.bookingServiceId === 'none' ? undefined : values.bookingServiceId,
          isTeamLead: values.isTeamLead || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Staff assigned');
          onOpenChange(false);
        },
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to assign staff'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign staff</DialogTitle>
          <DialogDescription>Assign a service provider to this booking.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service provider</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a service provider">
                          {(value) => {
                            const employee = employees.find((e) => e.id === value);
                            if (!employee) return 'Select a service provider';
                            return `${employee.firstName} ${employee.lastName}${employee.position ? ` — ${employee.position}` : ''}`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                          {employee.position ? ` — ${employee.position}` : ''}
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
              name="bookingServiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Whole booking">
                          {(value) => {
                            if (!value || value === 'none') return 'Whole booking';
                            const item = bookingServices.find((bs) => bs.id === value);
                            if (!item) return 'Whole booking';
                            return `${item.Service?.name ?? 'Service'}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Whole booking</SelectItem>
                      {bookingServices.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.Service?.name ?? 'Service'} {item.quantity > 1 ? `(x${item.quantity})` : ''}
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
              name="isTeamLead"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Make team lead</FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addAssignment.isPending}>
                {addAssignment.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
