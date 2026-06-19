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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cleanPayload } from '@/lib/forms';
import { useBranches } from '@/features/branches/useBranches';
import { useCreateEmployee, useUpdateEmployee } from './useEmployees';
import { usePositions } from './usePositions';

const STATUS_OPTIONS = ['active', 'inactive', 'on_leave'];

const employeeSchema = z.object({
  branchId: z.string().uuid('Select a branch'),
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email').max(150).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  positionId: z.string().uuid().optional().or(z.literal('')),
  hireDate: z.string().optional().or(z.literal('')),
  status: z.enum(STATUS_OPTIONS),
  commissionRate: z.coerce.number().min(0).max(100).nullable().optional(),
});

const DEFAULT_VALUES = {
  branchId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  positionId: '',
  hireDate: '',
  status: 'active',
  commissionRate: '',
};

const statusLabel = (value) => value.replace('_', ' ');

export default function EmployeeFormDialog({ open, onOpenChange, employee }) {
  const isEditing = Boolean(employee);
  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];
  const { data: positionsData } = usePositions({ limit: 100 });
  const positions = positionsData?.data ?? [];

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const isPending = createEmployee.isPending || updateEmployee.isPending;

  const form = useForm({
    resolver: zodResolver(employeeSchema),
    values: employee
      ? {
          branchId: employee.branchId ?? '',
          firstName: employee.firstName ?? '',
          middleName: employee.middleName ?? '',
          lastName: employee.lastName ?? '',
          email: employee.email ?? '',
          phone: employee.phone ?? '',
          positionId: employee.positionId ?? '',
          hireDate: employee.hireDate ?? '',
          status: employee.status ?? 'active',
          commissionRate: employee.commissionRate ?? '',
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
    const mutation = isEditing ? updateEmployee : createEmployee;
    const args = isEditing ? { id: employee.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Service provider updated' : 'Service provider created');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to save service provider'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit service provider' : 'Add service provider'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this service provider record.' : 'Add a new staff member to your team.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ama" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle name</FormLabel>
                    <FormControl>
                      <Input placeholder="Yaw" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Mensah" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a branch">
                          {(value) => branches.find((branch) => branch.id === value)?.name ?? 'Select a branch'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="provider@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+233 20 000 0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a position">
                            {(value) => positions.find((position) => position.id === value)?.name ?? 'Select a position'}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.name}
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
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="e.g. 40"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="capitalize">
                          {statusLabel(opt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create service provider'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
