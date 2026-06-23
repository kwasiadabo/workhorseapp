import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { useTeams } from '@/features/employees/useTeams';
import { useAddAssignment } from './useBookings';

const assignmentSchema = z
  .object({
    mode: z.enum(['individual', 'team']),
    employeeId: z.string().optional().or(z.literal('')),
    teamId: z.string().optional().or(z.literal('')),
    bookingServiceId: z.string(),
    isTeamLead: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'individual' && !data.employeeId) {
      ctx.addIssue({ code: 'custom', path: ['employeeId'], message: 'Select a service provider' });
    }
    if (data.mode === 'team' && !data.teamId) {
      ctx.addIssue({ code: 'custom', path: ['teamId'], message: 'Select a team' });
    }
  });

const DEFAULT_VALUES = {
  mode: 'individual',
  employeeId: '',
  teamId: '',
  bookingServiceId: 'none',
  isTeamLead: false,
};

export default function AssignStaffDialog({ open, onOpenChange, bookingId, branchId, bookingServices = [] }) {
  const { data: employeesData } = useEmployees({ branchId, status: 'active', limit: 100 }, { enabled: open });
  const employees = employeesData?.data ?? [];

  const { data: teamsData } = useTeams({ branchId, isActive: true, limit: 100 }, { enabled: open });
  const teams = teamsData?.data ?? [];

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

  const mode = useWatch({ control: form.control, name: 'mode' });

  const onSubmit = (values) => {
    const bookingServiceId = values.bookingServiceId === 'none' ? undefined : values.bookingServiceId;

    if (values.mode === 'team') {
      const team = teams.find((t) => t.id === values.teamId);
      const memberIds = (team?.members ?? []).map((member) => member.id);
      const availableIds = new Set(employees.map((employee) => employee.id));
      const assignableIds = memberIds.filter((id) => availableIds.has(id));
      const skipped = memberIds.length - assignableIds.length;

      if (assignableIds.length === 0) {
        toast.error('No active members from this team are available to assign');
        return;
      }

      Promise.all(
        assignableIds.map((employeeId) =>
          addAssignment.mutateAsync({ bookingId, data: { employeeId, bookingServiceId, teamId: team.id } })
        )
      )
        .then(() => {
          toast.success(
            skipped > 0
              ? `Team assigned (${skipped} member${skipped === 1 ? '' : 's'} skipped — no longer active)`
              : 'Team assigned'
          );
          onOpenChange(false);
        })
        .catch((error) => toast.error(error?.response?.data?.message ?? 'Unable to assign team'));
      return;
    }

    addAssignment.mutate(
      {
        bookingId,
        data: { employeeId: values.employeeId, bookingServiceId, isTeamLead: values.isTeamLead || undefined },
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
          <DialogDescription>Assign a service provider, or a whole team, to this booking.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => form.setValue('mode', 'individual')}
              >
                Individual
              </Button>
              <Button
                type="button"
                variant={mode === 'team' ? 'default' : 'outline'}
                size="sm"
                onClick={() => form.setValue('mode', 'team')}
              >
                Team
              </Button>
            </div>

            {mode === 'individual' ? (
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
            ) : (
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a team">
                            {(value) => {
                              const team = teams.find((t) => t.id === value);
                              return team ? `${team.name} (${team.members?.length ?? 0})` : 'Select a team';
                            }}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams.length === 0 && (
                          <p className="px-2 py-1.5 text-sm text-muted-foreground">No teams set up for this branch.</p>
                        )}
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} ({team.members?.length ?? 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
            {mode === 'individual' && (
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
            )}
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
