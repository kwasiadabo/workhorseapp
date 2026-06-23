import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cleanPayload } from '@/lib/forms';
import { isAttendantPosition } from '@/lib/employees';
import { useBranches } from '@/features/branches/useBranches';
import { useEmployees } from './useEmployees';
import { useCreateTeam, useUpdateTeam } from './useTeams';

const teamSchema = z.object({
  branchId: z.string().uuid('Select a branch'),
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(1000).optional().or(z.literal('')),
  isActive: z.boolean(),
  memberIds: z.array(z.string().uuid()),
});

const DEFAULT_VALUES = { branchId: '', name: '', description: '', isActive: true, memberIds: [] };

export default function TeamFormDialog({ open, onOpenChange, team }) {
  const isEditing = Boolean(team);
  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const isPending = createTeam.isPending || updateTeam.isPending;

  const form = useForm({
    resolver: zodResolver(teamSchema),
    values: team
      ? {
          branchId: team.branchId ?? '',
          name: team.name ?? '',
          description: team.description ?? '',
          isActive: team.isActive ?? true,
          memberIds: team.members?.map((member) => member.id) ?? [],
        }
      : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && !isEditing) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, isEditing, form]);

  const branchId = useWatch({ control: form.control, name: 'branchId' });
  const { data: employeesData } = useEmployees(
    { branchId, status: 'active', limit: 100 },
    { enabled: Boolean(branchId) }
  );
  const attendantEmployees = (employeesData?.data ?? []).filter((employee) => isAttendantPosition(employee.position));

  const onSubmit = (values) => {
    const payload = cleanPayload(values);
    const mutation = isEditing ? updateTeam : createTeam;
    const args = isEditing ? { id: team.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? 'Team updated' : 'Team created');
        onOpenChange(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to save team'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit team' : 'Add team'}</DialogTitle>
          <DialogDescription>
            Group service providers into a team so they can be assigned to a booking together.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Members are branch-scoped — switching branches restarts member selection
                      // rather than carrying over employees who may not belong to the new branch.
                      form.setValue('memberIds', []);
                    }}
                  >
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Detailing Crew" {...field} />
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What this team handles..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memberIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Members</FormLabel>
                  <FormControl>
                    <TeamMemberPicker
                      employees={attendantEmployees}
                      value={field.value}
                      onChange={field.onChange}
                      branchSelected={Boolean(branchId)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Active</FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create team'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TeamMemberPicker({ employees, value, onChange, branchSelected }) {
  const [search, setSearch] = useState('');
  const selectedIds = value ?? [];

  const filteredEmployees = employees.filter((employee) => {
    const haystack = `${employee.firstName} ${employee.lastName} ${employee.position ?? ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const selectedEmployees = selectedIds.map((id) => employees.find((e) => e.id === id)).filter(Boolean);

  const removeEmployee = (id) => onChange(selectedIds.filter((existingId) => existingId !== id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedEmployees.map((employee) => (
        <div key={employee.id} className="flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pr-2 pl-1">
          <Avatar size="sm">
            <AvatarFallback className="text-xs">
              {`${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {employee.firstName} {employee.lastName}
          </span>
          <button
            type="button"
            onClick={() => removeEmployee(employee.id)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
            <span className="sr-only">Remove {employee.firstName}</span>
          </button>
        </div>
      ))}
      <DropdownMenu onOpenChange={(open) => !open && setSearch('')}>
        <DropdownMenuTrigger
          render={<Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={!branchSelected} />}
        >
          <UserPlus className="size-4" />
          {selectedEmployees.length > 0 ? 'Add member' : 'Add members'}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="p-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-8"
            />
          </div>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Attendants at this branch</DropdownMenuLabel>
            {filteredEmployees.length === 0 && (
              <p className="px-1.5 py-1.5 text-sm text-muted-foreground">
                {employees.length === 0
                  ? 'No active attendants/service providers at this branch'
                  : 'No attendants match your search'}
              </p>
            )}
            {filteredEmployees.map((employee) => (
              <DropdownMenuCheckboxItem
                key={employee.id}
                checked={selectedIds.includes(employee.id)}
                onCheckedChange={(checked) =>
                  onChange(checked ? [...selectedIds, employee.id] : selectedIds.filter((id) => id !== employee.id))
                }
              >
                {employee.firstName} {employee.lastName}
                {employee.position ? ` — ${employee.position}` : ''}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
