import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAuthStore from '@/store/authStore';
import { isCarBusiness } from '@/lib/businessTypes';
import { useBranches } from '@/features/branches/useBranches';
import { useCustomers } from '@/features/customers/useCustomers';
import CustomerFormDialog from '@/features/customers/CustomerFormDialog';
import { useEmployees } from '@/features/employees/useEmployees';
import { useServices } from '@/features/services/useServices';
import { useCreateBooking, useAddAssignment } from './useBookings';
import { useVehicleTypes } from './useVehicleTypes';

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
  vehicleTypeId: z.string().optional(),
  vehicleRegistration: z.string().max(50).optional().or(z.literal('')),
  vehicleMake: z.string().max(100).optional().or(z.literal('')),
  vehicleModel: z.string().max(100).optional().or(z.literal('')),
});

const DEFAULT_VALUES = {
  branchId: '',
  customerId: '',
  scheduledAt: '',
  notes: '',
  services: [],
  employeeIds: [],
  vehicleTypeId: 'none',
  vehicleRegistration: '',
  vehicleMake: '',
  vehicleModel: '',
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

// Only employees holding an "attendant"/"service provider" position can be
// assigned to provide booking services — other positions (e.g. manager,
// receptionist) shouldn't show up in the picker.
const ATTENDANT_POSITIONS = ['attendant', 'attendants', 'service provider', 'service providers'];
const isAttendantPosition = (position) => ATTENDANT_POSITIONS.includes(position?.trim().toLowerCase());

const getServicePrice = (service, vehicleTypeId) => {
  if (service?.vehiclePrices?.length && vehicleTypeId && vehicleTypeId !== 'none') {
    const vp = service.vehiclePrices.find((p) => p.vehicleTypeId === vehicleTypeId);
    if (vp !== undefined) return Number(vp.price);
  }
  return Number(service?.price ?? 0);
};

export default function BookingCreatePage() {
  const navigate = useNavigate();
  const businessType = useAuthStore((s) => s.user?.businessType);
  const isCarWash = isCarBusiness(businessType);

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [serviceToAdd, setServiceToAdd] = useState('');
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
  const watchedVehicleTypeId = useWatch({ control: form.control, name: 'vehicleTypeId' });

  const { data: employeesData } = useEmployees({ branchId: watchedBranchId || undefined, status: 'active', limit: 100 });
  const employees = employeesData?.data ?? [];

  const hasVehicleType = watchedVehicleTypeId && watchedVehicleTypeId !== 'none';

  const total = watchedServices.reduce((sum, item) => {
    const service = serviceMap.get(item.serviceId);
    const qty = Number(item.quantity) || 0;
    return sum + getServicePrice(service, watchedVehicleTypeId) * qty;
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
        vehicleTypeId: values.vehicleTypeId && values.vehicleTypeId !== 'none' ? values.vehicleTypeId : undefined,
        vehicleRegistration: values.vehicleRegistration || undefined,
        vehicleMake: values.vehicleMake || undefined,
        vehicleModel: values.vehicleModel || undefined,
      },
      {
        onSuccess: async (booking) => {
          if (values.employeeIds.length > 0) {
            try {
              await Promise.all(
                values.employeeIds.map((employeeId) =>
                  addAssignment.mutateAsync({ bookingId: booking.id, data: { employeeId } })
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
          {isCarWash
            ? 'Select the vehicle type first — it determines the price for each service.'
            : 'Optional vehicle details for this booking.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="vehicleTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type">
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
          <FormField
            control={form.control}
            name="vehicleRegistration"
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
          <FormField
            control={form.control}
            name="vehicleMake"
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
            name="vehicleModel"
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
              <SelectValue placeholder="Select a service to add">
                {(value) => {
                  const service = availableServices.find((s) => s.id === value);
                  if (!service) return 'Select a service to add';
                  const price = getServicePrice(service, watchedVehicleTypeId);
                  return `${service.name} — ${service.currency} ${price.toFixed(2)}`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableServices.map((service) => {
                const price = getServicePrice(service, watchedVehicleTypeId);
                return (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} — {service.currency} {price.toFixed(2)}
                  </SelectItem>
                );
              })}
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
            {fields.map((item, index) => {
              const service = serviceMap.get(item.serviceId);
              const quantity = Number(watchedServices[index]?.quantity || 0);
              const unitPrice = getServicePrice(service, watchedVehicleTypeId);
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="font-medium">{service?.name ?? 'Unknown service'}</p>
                    <p className="text-sm text-muted-foreground">
                      {service?.currency} {unitPrice.toFixed(2)} · {service?.durationMinutes} min
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
                    {service?.currency} {(unitPrice * quantity).toFixed(2)}
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

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/bookings')} className="w-fit">
        <ArrowLeft /> Back to bookings
      </Button>
      <PageHeader title="New booking" description="Schedule a new appointment for a client." />

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
                                <ComboboxInput placeholder="Search clients..." />
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
            <CardContent>
              <FormField
                control={form.control}
                name="employeeIds"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <AttendantAssignmentField
                      employees={employees}
                      value={field.value}
                      onChange={field.onChange}
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
            <Button type="submit" disabled={createBooking.isPending}>
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
        }}
      />
    </div>
  );
}

function AttendantAssignmentField({ employees, value, onChange, branchSelected }) {
  const [search, setSearch] = useState('');
  const selectedIds = value ?? [];

  const attendantEmployees = employees.filter((employee) => isAttendantPosition(employee.position));

  const filteredEmployees = attendantEmployees.filter((employee) => {
    const haystack = `${employee.firstName} ${employee.lastName} ${employee.position ?? ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const selectedEmployees = selectedIds.map((id) => attendantEmployees.find((e) => e.id === id)).filter(Boolean);

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
        <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" className="gap-1.5" />}>
          <UserPlus className="size-4" />
          {selectedEmployees.length > 0 ? 'Add attendant' : 'Assign attendant'}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="p-1">
            <Input
              placeholder="Search service providers..."
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
                  : 'No service providers match your search'}
              </p>
            )}
            {filteredEmployees.map((employee) => (
              <DropdownMenuCheckboxItem
                key={employee.id}
                checked={selectedIds.includes(employee.id)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked ? [...selectedIds, employee.id] : selectedIds.filter((id) => id !== employee.id)
                  )
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
