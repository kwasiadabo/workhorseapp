import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

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
import { formatDateTime } from '@/lib/dateFormat';
import useAuthStore from '@/store/authStore';
import { useBranches } from '@/features/branches/useBranches';
import { useEmployees } from '@/features/employees/useEmployees';
import { useCreateCashHandover, usePreviewCashHandover } from './useCashHandovers';
import { todayDateInput, toPeriodEnd, toPeriodStart } from './cashHandovers.constants';

const handoverSchema = z
  .object({
    employeeId: z.string().optional(),
    branchId: z.string().optional(),
    periodStart: z.string().min(1, 'Required'),
    periodEnd: z.string().min(1, 'Required'),
    declaredAmount: z.coerce.number().min(0, 'Must be 0 or greater'),
    notes: z.string().optional().or(z.literal('')),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: 'End date must be on or after start date',
    path: ['periodEnd'],
  });

const buildDefaultValues = () => ({
  employeeId: '',
  branchId: 'auto',
  periodStart: todayDateInput(),
  periodEnd: todayDateInput(),
  declaredAmount: 0,
  notes: '',
});

export default function NewHandoverDialog({ open, onOpenChange }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('cash_handovers.manage');

  const { data: branchesData } = useBranches({ limit: 100 }, { enabled: canManage });
  const branches = branchesData?.data ?? [];

  const { data: employeesData } = useEmployees({ limit: 100, status: 'active' }, { enabled: canManage });
  const employees = employeesData?.data ?? [];

  const createCashHandover = useCreateCashHandover();

  const form = useForm({
    resolver: zodResolver(handoverSchema),
    defaultValues: buildDefaultValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues());
    }
  }, [open, form]);

  const employeeId = useWatch({ control: form.control, name: 'employeeId' });
  const periodStart = useWatch({ control: form.control, name: 'periodStart' });
  const periodEnd = useWatch({ control: form.control, name: 'periodEnd' });

  const { data: preview, isFetching: isPreviewLoading } = usePreviewCashHandover(
    {
      employeeId: canManage ? employeeId || undefined : undefined,
      periodStart: periodStart ? toPeriodStart(periodStart) : undefined,
      periodEnd: periodEnd ? toPeriodEnd(periodEnd) : undefined,
    },
    { enabled: !canManage || Boolean(employeeId) }
  );

  const onSubmit = (values) => {
    const payload = cleanPayload({
      employeeId: canManage ? values.employeeId || undefined : undefined,
      branchId: values.branchId === 'auto' ? undefined : values.branchId,
      periodStart: toPeriodStart(values.periodStart),
      periodEnd: toPeriodEnd(values.periodEnd),
      declaredAmount: values.declaredAmount,
      notes: values.notes,
    });

    if (canManage && !payload.employeeId) {
      form.setError('employeeId', { message: 'Select an employee' });
      return;
    }

    createCashHandover.mutate(payload, {
      onSuccess: () => {
        toast.success('Cash handover submitted');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to submit cash handover'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New cash handover</DialogTitle>
          <DialogDescription>Declare the cash you're handing over for a period.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {canManage && (
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an employee">
                            {(value) => {
                              const employee = employees.find((e) => e.id === value);
                              return employee ? `${employee.firstName} ${employee.lastName}` : 'Select an employee';
                            }}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {branches.length > 1 && (
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Your branch">
                            {(value) => {
                              if (!value || value === 'auto') return 'Your branch';
                              return branches.find((b) => b.id === value)?.name ?? 'Your branch';
                            }}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="auto">Your branch</SelectItem>
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
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period end</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {preview?.periodAlreadySubmitted && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  A cash handover has already been submitted for this period. Choose a different
                  period.
                </span>
              </div>
            )}
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm text-muted-foreground">
                Expected:{' '}
                {isPreviewLoading
                  ? 'Calculating...'
                  : preview
                    ? `GH¢ ${Number(preview.expectedAmount).toFixed(2)}`
                    : '—'}
              </p>
              {!isPreviewLoading && preview && (
                preview.payments?.length ? (
                  <ul className="space-y-1.5">
                    {preview.payments.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
                      >
                        <span className="truncate">
                          {payment.bookingNumber ?? '—'}
                          {payment.customerName ? ` · ${payment.customerName}` : ''} ·{' '}
                          {payment.method?.replace('_', ' ')} ·{' '}
                          {formatDateTime(payment.paidAt)}
                        </span>
                        <span className="shrink-0 font-medium text-foreground">
                          GH¢ {Number(payment.amount).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No pending payments for this period.</p>
                )
              )}
            </div>
            <FormField
              control={form.control}
              name="declaredAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Declared amount (GH¢)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              <Button
                type="submit"
                disabled={createCashHandover.isPending || Boolean(preview?.periodAlreadySubmitted)}
              >
                {createCashHandover.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
