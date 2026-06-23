import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, ArrowLeft, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAuthStore from '@/store/authStore';
import { isCarBusiness } from '@/lib/businessTypes';
import { isAttendantPosition } from '@/lib/employees';
import { useBranches } from '@/features/branches/useBranches';
import { useCustomers } from '@/features/customers/useCustomers';
import CustomerFormDialog from '@/features/customers/CustomerFormDialog';
import { useEmployees } from '@/features/employees/useEmployees';
import { useTeams } from '@/features/employees/useTeams';
import TeamFormDialog from '@/features/employees/TeamFormDialog';
import { useSetupStatus } from '@/features/onboarding/useSetupStatus';
import { useServices } from '@/features/services/useServices';
import { useCreateBooking, useAddAssignment } from './useBookings';
import { useVehicleTypes } from './useVehicleTypes';
import { useVehicles, useCreateVehicle } from './useVehicles';

const bookingSchema = z.object({
  branchId: z.string().uuid('Select a branch'),
  customerId: z.string().uuid('Select a client'),
  scheduledAt: z.string().min(1, 'Select a date and time'),
  notes: z.string().optional().or(z.literal('')),
  services: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        quantity: z.coerce.number().int('Must be a whole number').min(1).max(20),
      })
    )
    .min(1, 'Add at least one service'),
  employeeIds: z.array(z.string().uuid()).min(1, 'Assign at least one service provider'),
  vehicleId: z.string().uuid().optional().or(z.literal('')),
});

const vehicleFormSchema = z.object({
  registration: z.string().min(1, 'Registration is required').max(50),
  make: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  vehicleTypeId: z.string().optional(),
});

const DEFAULT_VALUES = {
  branchId: '',
  customerId: '',
  scheduledAt: '',
  notes: '',
  services: [],
  employeeIds: [],
  vehicleId: '',
};

const toDatetimeLocalNow = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatCustomerLabel = (customer) => {
  if (!customer) return '';
  const name = customer.name;
  return customer.phone ? `${name} (${customer.phone})` : name;
};

const formatVehicleLabel = (vehicle) => {
  if (!vehicle) return '';
  return [vehicle.registration, vehicle.make, vehicle.model].filter(Boolean).join(' — ');
};

// Returns null (rather than 0) when a vehicle-priced service has no price
// resolvable yet — either no vehicle/vehicle type is selected, or the
// service was never given a price for that specific vehicle type (e.g. a
// vehicle type added after the service's prices were last configured).
// That's distinct from a genuine price of 0 and must not be treated as free.
const getServicePrice = (service, vehicleTypeId) => {
  if (service?.vehiclePrices?.length) {
    if (!vehicleTypeId || vehicleTypeId === 'none') return null;
    const vp = service.vehiclePrices.find((p) => p.vehicleTypeId === vehicleTypeId);
    return vp ? Number(vp.price) : null;
  }
  return Number(service?.price ?? 0);
};

const formatServicePrice = (service, vehicleTypeId) => {
  const price = getServicePrice(service, vehicleTypeId);
  if (price === null) {
    return vehicleTypeId && vehicleTypeId !== 'none'
      ? 'No price set for this vehicle type'
      : 'Select a vehicle for pricing';
  }
  return `${service?.currency} ${price.toFixed(2)}`;
};

const SETUP_REQUIREMENTS = [
  { key: 'branches', label: 'Branches', to: '/app/branches', permission: 'branches.manage' },
  { key: 'services', label: 'Services', to: '/app/services', permission: 'services.manage' },
  { key: 'employees', label: 'Workers', to: '/app/employees', permission: 'employees.manage' },
];

export default function BookingCreatePage() {
  const navigate = useNavigate();
  const businessType = useAuthStore((s) => s.user?.businessType);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isCarWash = isCarBusiness(businessType);
  const { data: setupStatus, isLoading: setupStatusLoading } = useSetupStatus();

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [serviceToAdd, setServiceToAdd] = useState('');
  // Maps a selected employeeId -> the team it was assigned via (if any), so
  // each individual assignment created on submit can be tagged with the
  // right team for reporting. Manually touching an assignment (via the
  // individual picker or removing a pill) always clears its tag.
  const [employeeTeamTags, setEmployeeTeamTags] = useState({});
  const debouncedCustomerSearch = useDebouncedValue(customerSearch);

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const { data: vehicleTypesData } = useVehicleTypes({ limit: 100, sort: 'displayOrder' }, { enabled: isCarWash });
  const vehicleTypes = vehicleTypesData?.data ?? [];

  const { data: customersData } = useCustomers({ limit: 50, search: debouncedCustomerSearch || undefined });
  const customers = customersData?.data ?? [];

  const { data: servicesData } = useServices({ limit: 100, isActive: 'true' });
  const services = servicesData?.data ?? [];
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const createBooking = useCreateBooking();
  const addAssignment = useAddAssignment();

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { ...DEFAULT_VALUES, scheduledAt: toDatetimeLocalNow() },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'services' });
  const watchedServices = useWatch({ control: form.control, name: 'services' }) ?? [];
  const watchedBranchId = useWatch({ control: form.control, name: 'branchId' });
  const watchedCustomerId = useWatch({ control: form.control, name: 'customerId' });
  const watchedVehicleId = useWatch({ control: form.control, name: 'vehicleId' });

  const { data: employeesData } = useEmployees({ branchId: watchedBranchId || undefined, status: 'active', limit: 100 });
  const employees = employeesData?.data ?? [];

  const { data: teamsData } = useTeams({ branchId: watchedBranchId || undefined, isActive: true, limit: 100 });
  const teams = teamsData?.data ?? [];

  const { data: vehiclesData } = useVehicles(
    { customerId: watchedCustomerId || undefined, limit: 100 },
    // Disable the generic hook's placeholderData carry-over — otherwise the
    // dropdown briefly shows the previous customer's vehicles while the new
    // customer's list is still loading.
    { enabled: isCarWash && Boolean(watchedCustomerId), placeholderData: undefined }
  );
  const vehicles = vehiclesData?.data ?? [];
  const selectedVehicle = vehicles.find((v) => v.id === watchedVehicleId);
  const watchedVehicleTypeId = selectedVehicle?.vehicleTypeId;

  const hasVehicleType = Boolean(watchedVehicleTypeId);

  const total = watchedServices.reduce((sum, item) => {
    const service = serviceMap.get(item.serviceId);
    const qty = Number(item.quantity) || 0;
    return sum + (getServicePrice(service, watchedVehicleTypeId) ?? 0) * qty;
  }, 0);
  const currency = services[0]?.currency ?? 'GH¢';

  const availableServices = services.filter((s) => !fields.some((f) => f.serviceId === s.id));

  const handleAddService = () => {
    if (!serviceToAdd) return;
    append({ serviceId: serviceToAdd, quantity: 1 });
    setServiceToAdd('');
  };

  const onSubmit = (values) => {
    createBooking.mutate(
      {
        branchId: values.branchId,
        customerId: values.customerId,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        notes: values.notes || undefined,
        services: values.services.map((item) => ({ serviceId: item.serviceId, quantity: item.quantity })),
        vehicleId: values.vehicleId || undefined,
      },
      {
        onSuccess: async (booking) => {
          if (values.employeeIds.length > 0) {
            try {
              await Promise.all(
                values.employeeIds.map((employeeId) =>
                  addAssignment.mutateAsync({
                    bookingId: booking.id,
                    data: { employeeId, teamId: employeeTeamTags[employeeId] },
                  })
                )
              );
            } catch {
              toast.error('Booking created, but assigning attendants failed');
            }
          }

          toast.success('Booking created');
          navigate(`/app/bookings/${booking.id}`);
        },
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to create booking'),
      }
    );
  };

  const vehicleCard = (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle</CardTitle>
        <CardDescription>
          {watchedCustomerId
            ? "Pick this client's vehicle, or add a new one — it determines the price for each service."
            : 'Select a client first to choose or add their vehicle.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (value === '__new__') {
                    setVehicleDialogOpen(true);
                    return;
                  }
                  field.onChange(value);
                }}
                disabled={!watchedCustomerId}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value) =>
                        formatVehicleLabel(vehicles.find((v) => v.id === value)) ||
                        (watchedCustomerId ? 'Select a vehicle' : 'Select a client first')
                      }
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {formatVehicleLabel(vehicle)}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Add a new vehicle</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const servicesCard = (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>
          {isCarWash && !hasVehicleType
            ? 'Select a vehicle type above to see pricing.'
            : 'Add one or more services for this booking.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={serviceToAdd} onValueChange={setServiceToAdd}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value) => {
                  const service = availableServices.find((s) => s.id === value);
                  if (!service) return 'Select a service to add';
                  return `${service.name} — ${formatServicePrice(service, watchedVehicleTypeId)}`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} — {formatServicePrice(service, watchedVehicleTypeId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={handleAddService} disabled={!serviceToAdd}>
            <Plus /> Add
          </Button>
        </div>

        {form.formState.errors.services?.message && (
          <p className="text-sm text-destructive">{form.formState.errors.services.message}</p>
        )}

        {fields.length > 0 && (
          <div className="space-y-2">
            <div className="hidden items-center gap-3 px-3 text-xs font-medium text-muted-foreground sm:flex">
              <p className="flex-1">Service</p>
              <p className="w-20 text-center">Qty</p>
              <p className="w-24 text-right">Amount</p>
              <div className="size-7" />
            </div>
            {fields.map((item, index) => {
              const service = serviceMap.get(item.serviceId);
              const quantity = Number(watchedServices[index]?.quantity || 0);
              const unitPrice = getServicePrice(service, watchedVehicleTypeId);
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="font-medium">{service?.name ?? 'Unknown service'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatServicePrice(service, watchedVehicleTypeId)} · {service?.durationMinutes} min
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name={`services.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="number" min="1" max="20" step="1" className="w-20" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <p className="w-24 text-right font-medium tabular-nums">
                    {unitPrice === null ? '—' : `${service?.currency} ${(unitPrice * quantity).toFixed(2)}`}
                  </p>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                    <Trash2 />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end border-t pt-4">
          <p className="text-lg font-semibold tabular-nums">
            Total: {currency} {total.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const missingSetup = setupStatus ? SETUP_REQUIREMENTS.filter((req) => !setupStatus[req.key]) : [];
  if (!setupStatusLoading && missingSetup.length > 0) {
    const canFixAny = missingSetup.some((req) => hasPermission(req.permission));
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/bookings')} className="-ml-2 w-fit">
            <ArrowLeft /> Back to bookings
          </Button>
          <PageHeader title="New booking" description="Schedule a new appointment for a client." />
        </div>
        <Card className="gap-3 border-amber-500/30 bg-amber-50 p-5 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-sm">Business setup isn't finished yet</CardTitle>
          </div>
          <CardDescription className="text-foreground/80">
            {canFixAny
              ? "You can't create a booking until these are set up:"
              : "You can't create a booking yet — ask your business owner or manager to finish setting up the business first:"}
          </CardDescription>
          {canFixAny && (
            <div className="flex flex-wrap gap-2">
              {missingSetup.map((req) =>
                hasPermission(req.permission) ? (
                  <Button key={req.key} variant="outline" size="sm" render={<Link to={req.to} />}>
                    Set up {req.label}
                  </Button>
                ) : (
                  <Badge key={req.key} variant="outline">
                    {req.label}
                  </Badge>
                )
              )}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/bookings')} className="-ml-2 w-fit">
          <ArrowLeft /> Back to bookings
        </Button>
        <PageHeader title="New booking" description="Schedule a new appointment for a client." />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => {
                    const comboboxItems =
                      selectedCustomer && !customers.some((c) => c.id === selectedCustomer.id)
                        ? [...customers, selectedCustomer]
                        : customers;

                    return (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <div className="flex gap-2">
                          <Combobox
                            items={comboboxItems}
                            value={selectedCustomer}
                            onValueChange={(customer) => {
                              setSelectedCustomer(customer);
                              field.onChange(customer?.id ?? '');
                              form.setValue('vehicleId', '');
                            }}
                            onInputValueChange={(value, { reason }) => {
                              if (reason === 'item-press') return;
                              setCustomerSearch(value);
                            }}
                            itemToStringLabel={formatCustomerLabel}
                            isItemEqualToValue={(item, value) => item.id === value.id}
                            filter={null}
                          >
                            <ComboboxInputGroup className="flex-1">
                              <FormControl>
                                <ComboboxInput />
                              </FormControl>
                              <ComboboxClear />
                              <ComboboxTrigger />
                            </ComboboxInputGroup>
                            <ComboboxContent>
                              <ComboboxEmpty>No clients found.</ComboboxEmpty>
                              <ComboboxList>
                                {(customer) => (
                                  <ComboboxItem key={customer.id} value={customer}>
                                    {formatCustomerLabel(customer)}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                          <Button type="button" variant="outline" size="icon" onClick={() => setCustomerDialogOpen(true)}>
                            <UserPlus />
                            <span className="sr-only">New client</span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
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
              </div>
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date &amp; time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {isCarWash && vehicleCard}
          {servicesCard}

          <Card>
            <CardHeader>
              <CardTitle>Attendants</CardTitle>
              <CardDescription>Assign the attendants who will provide these services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setTeamDialogOpen(true)}
                  disabled={!watchedBranchId}
                >
                  <Plus className="size-4" /> New team
                </Button>
              </div>
              <FormField
                control={form.control}
                name="employeeIds"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <AttendantAssignmentField
                      employees={employees}
                      teams={teams}
                      value={field.value}
                      onChange={field.onChange}
                      onTeamTagsChange={setEmployeeTeamTags}
                      branchSelected={Boolean(watchedBranchId)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/app/bookings')}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={createBooking.isPending}>
              {createBooking.isPending ? 'Creating...' : 'Create booking'}
            </Button>
          </div>
        </form>
      </Form>

      <CustomerFormDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={null}
        onSaved={(customer) => {
          setCustomerSearch('');
          setSelectedCustomer(customer);
          form.setValue('customerId', customer.id, { shouldValidate: true });
          form.setValue('vehicleId', '');
        }}
      />

      <TeamFormDialog
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        team={null}
        defaultBranchId={watchedBranchId}
        onSaved={(team) => {
          const teamMemberIds = (team.members ?? []).map((member) => member.id);
          const current = form.getValues('employeeIds') ?? [];
          form.setValue('employeeIds', [...new Set([...current, ...teamMemberIds])], { shouldValidate: true });
          setEmployeeTeamTags((prev) => {
            const next = { ...prev };
            teamMemberIds.forEach((id) => {
              next[id] = team.id;
            });
            return next;
          });
        }}
      />

      {isCarWash && (
        <VehicleFormDialog
          open={vehicleDialogOpen}
          onOpenChange={setVehicleDialogOpen}
          customerId={watchedCustomerId}
          vehicleTypes={vehicleTypes}
          onCreated={(vehicleId) => form.setValue('vehicleId', vehicleId, { shouldValidate: true })}
        />
      )}
    </div>
  );
}

function VehicleFormDialog({ open, onOpenChange, customerId, vehicleTypes, onCreated }) {
  const createVehicle = useCreateVehicle();

  const form = useForm({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: { registration: '', make: '', model: '', vehicleTypeId: 'none' },
  });

  useEffect(() => {
    if (open) form.reset({ registration: '', make: '', model: '', vehicleTypeId: 'none' });
  }, [open, form]);

  const onSubmit = (values) => {
    createVehicle.mutate(
      {
        customerId,
        registration: values.registration,
        make: values.make || undefined,
        model: values.model || undefined,
        vehicleTypeId: values.vehicleTypeId !== 'none' ? values.vehicleTypeId : undefined,
      },
      {
        onSuccess: (vehicle) => {
          toast.success('Vehicle added');
          onOpenChange(false);
          onCreated(vehicle.id);
        },
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to add vehicle'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a vehicle</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="registration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="vehicleTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value) =>
                            value === 'none' || !value
                              ? 'Not specified'
                              : (vehicleTypes.find((vt) => vt.id === value)?.name ?? 'Select type')
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {vehicleTypes.map((vt) => (
                        <SelectItem key={vt.id} value={vt.id}>
                          {vt.name}
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
              <Button type="submit" variant="brand" disabled={createVehicle.isPending}>
                {createVehicle.isPending ? 'Adding...' : 'Add vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AttendantAssignmentField({ employees, teams = [], value, onChange, onTeamTagsChange, branchSelected }) {
  const [search, setSearch] = useState('');
  const selectedIds = value ?? [];

  const attendantEmployees = employees.filter((employee) => isAttendantPosition(employee.position));

  const filteredEmployees = attendantEmployees.filter((employee) => {
    const haystack = `${employee.firstName} ${employee.lastName} ${employee.position ?? ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const selectedEmployees = selectedIds.map((id) => attendantEmployees.find((e) => e.id === id)).filter(Boolean);

  // Touching an assignment by hand always clears any team tag it had — once
  // a human picks or removes someone individually, it's no longer "the team".
  const clearTag = (id) =>
    onTeamTagsChange?.((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const removeEmployee = (id) => {
    onChange(selectedIds.filter((existingId) => existingId !== id));
    clearTag(id);
  };

  // A team is just a shortcut for picking each of its members — merge them into
  // the same `employeeIds` array the individual picker writes to, tagging each
  // newly-added member with this team so the resulting assignments can be
  // attributed to it in reports.
  const assignTeam = (team) => {
    const teamMemberIds = (team.members ?? []).map((member) => member.id);
    onChange([...new Set([...selectedIds, ...teamMemberIds])]);
    onTeamTagsChange?.((prev) => {
      const next = { ...prev };
      teamMemberIds.forEach((id) => {
        next[id] = team.id;
      });
      return next;
    });
  };

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
        <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" className="gap-1.5" />}>
          <UserPlus className="size-4" />
          {selectedEmployees.length > 0 ? 'Add attendant' : 'Assign attendant'}
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
            <DropdownMenuLabel>Attendants providing these services</DropdownMenuLabel>
            {filteredEmployees.length === 0 && (
              <p className="px-1.5 py-1.5 text-sm text-muted-foreground">
                {attendantEmployees.length === 0
                  ? `No active attendants/service providers${branchSelected ? ' in this branch' : ''}`
                  : 'No attendants match your search'}
              </p>
            )}
            {filteredEmployees.map((employee) => (
              <DropdownMenuCheckboxItem
                key={employee.id}
                checked={selectedIds.includes(employee.id)}
                onCheckedChange={(checked) => {
                  onChange(
                    checked ? [...selectedIds, employee.id] : selectedIds.filter((id) => id !== employee.id)
                  );
                  clearTag(employee.id);
                }}
              >
                {employee.firstName} {employee.lastName}
                {employee.position ? ` — ${employee.position}` : ''}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {teams.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" className="gap-1.5" />}>
            <Users className="size-4" />
            Assign team
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Teams at this branch</DropdownMenuLabel>
              {teams.map((team) => (
                <DropdownMenuItem key={team.id} onClick={() => assignTeam(team)}>
                  {team.name} ({team.members?.length ?? 0})
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
