import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
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
import { useEmployees } from '@/features/employees/useEmployees';
import { useCreateUser, useUpdateUser } from './useUsers';

const NO_BRANCH = '__none__';
const NO_EMPLOYEE = '__new__';

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'employee', label: 'Service Provider' },
];
const ROLE_VALUES = ROLE_OPTIONS.map((r) => r.value);

const baseFields = {
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(30).optional().or(z.literal('')),
  role: z.enum(ROLE_VALUES),
  branchId: z.string().optional(),
};

const createSchema = z.object({
  ...baseFields,
  employeeId: z.string().optional(),
  email: z.string().email('Enter a valid email').max(150),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

const editSchema = z.object({
  ...baseFields,
  isActive: z.boolean(),
});

const CREATE_DEFAULTS = {
  employeeId: NO_EMPLOYEE,
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  role: 'employee',
  branchId: NO_BRANCH,
};

export default function UserFormDialog({ open, onOpenChange, user }) {
  const isEditing = Boolean(user);
  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const { data: unassignedEmployeesData } = useEmployees({ limit: 100, unassigned: true });
  const unassignedEmployees = unassignedEmployeesData?.data ?? [];

  const queryClient = useQueryClient();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isPending = createUser.isPending || updateUser.isPending;

  const form = useForm({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    values: isEditing
      ? {
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          phone: user.phone ?? '',
          role: user.role ?? 'employee',
          branchId: user.branchId ?? NO_BRANCH,
          isActive: user.isActive ?? true,
        }
      : CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (open && !isEditing) {
      form.reset(CREATE_DEFAULTS);
    }
  }, [open, isEditing, form]);

  const selectedEmployeeId = useWatch({ control: form.control, name: 'employeeId' });
  const linkedEmployee =
    !isEditing && selectedEmployeeId && selectedEmployeeId !== NO_EMPLOYEE
      ? unassignedEmployees.find((employee) => employee.id === selectedEmployeeId)
      : null;

  const selectEmployee = (employeeId) => {
    form.setValue('employeeId', employeeId);
    const employee = unassignedEmployees.find((e) => e.id === employeeId);
    form.setValue('firstName', employee?.firstName ?? '');
    form.setValue('lastName', employee?.lastName ?? '');
    form.setValue('email', employee?.email ?? '');
    form.setValue('phone', employee?.phone ?? '');
  };

  const onSubmit = (values) => {
    const payload = cleanPayload(values);
    if (payload.employeeId === NO_EMPLOYEE) {
      delete payload.employeeId;
    } else if (payload.employeeId) {
      delete payload.branchId;
    }
    if (payload.branchId === NO_BRANCH) {
      delete payload.branchId;
    }

    const mutation = isEditing ? updateUser : createUser;
    const args = isEditing ? { id: user.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        if (!isEditing) {
          queryClient.invalidateQueries({ queryKey: ['employees', 'list'] });
        }
        toast.success(isEditing ? 'User updated' : 'User created');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to save user'),
    });
  };

  // Once a user is linked to a branch, the backend can move them to another
  // branch but cannot "unassign" (Employee.branchId is required), so the
  // "No branch" option is only offered while none is set yet.
  const hasExistingBranch = isEditing && Boolean(user.branchId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit user' : 'Add user'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this user’s details, role and branch assignment.'
              : 'Create a login for a staff member and assign their role and branch.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff member</FormLabel>
                    <Select value={field.value} onValueChange={selectEmployee}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="New person">
                            {(value) => {
                              if (value === NO_EMPLOYEE) return 'New person';
                              const employee = unassignedEmployees.find((e) => e.id === value);
                              return employee ? `${employee.firstName} ${employee.lastName}` : 'New person';
                            }}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_EMPLOYEE}>New person</SelectItem>
                        {unassignedEmployees.map((employee) => (
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ama" {...field} disabled={Boolean(linkedEmployee)} />
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
                      <Input placeholder="Mensah" {...field} disabled={Boolean(linkedEmployee)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {isEditing ? (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input value={user.email} disabled />
                </FormControl>
              </FormItem>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="At least 8 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value) => ROLE_OPTIONS.find((r) => r.value === value)?.label ?? 'Select a role'}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {linkedEmployee ? (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <FormControl>
                  <Input
                    value={branches.find((branch) => branch.id === linkedEmployee.branchId)?.name ?? '—'}
                    disabled
                  />
                </FormControl>
              </FormItem>
            ) : (
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
                            {(value) =>
                              value === NO_BRANCH
                                ? 'No branch (office staff)'
                                : (branches.find((branch) => branch.id === value)?.name ?? 'Select a branch')
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!hasExistingBranch && <SelectItem value={NO_BRANCH}>No branch (office staff)</SelectItem>}
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
            {isEditing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value ? 'active' : 'inactive'}
                      onValueChange={(value) => field.onChange(value === 'active')}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
