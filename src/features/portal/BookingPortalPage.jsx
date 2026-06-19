import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import {
  Check, ChevronLeft, Clock, User, MapPin, Phone,
  CalendarDays, Loader2, CheckCircle2, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const fmt = (n) => {
  const num = Number(n);
  if (!isFinite(num)) return '—';
  return `GH₵${num.toFixed(2)}`;
};

const STEPS = ['Provider', 'Service', 'Time', 'Details', 'Confirm'];

// ── Branding ────────────────────────────────────────────────────────────────

function PoweredBy() {
  return (
    <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <img src="/favicon.svg" alt="" className="h-4 w-4 opacity-60" aria-hidden="true" />
      <span>Powered by <span className="font-semibold text-foreground/70">VX-Workhorse</span></span>
    </div>
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                ${i < current
                  ? 'bg-brand text-brand-foreground'
                  : i === current
                  ? 'ring-2 ring-brand bg-background text-brand'
                  : 'bg-muted text-muted-foreground'}`}
            >
              {i < current ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span className={`hidden sm:block text-[10px] font-medium ${i === current ? 'text-brand' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-6 sm:w-10 mb-4 ${i < current ? 'bg-brand' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function LoadingCards() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => <Skeleton key={n} className="h-20 w-full rounded-xl" />)}
    </div>
  );
}

// ── Back button ──────────────────────────────────────────────────────────────

function BackBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors"
    >
      <ChevronLeft className="size-4" /> Back
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function BookingPortalPage() {
  const { slug } = useParams();

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState({ staff: null, service: null, slot: null });
  const [pendingService, setPendingService] = useState(null); // service awaiting vehicle type pick
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [confirmed, setConfirmed] = useState(null);

  const detailsSchema = z.object({
    name: z.string().min(2, 'Full name is required'),
    phone: z.string().min(9, 'Phone number is required'),
    email: z.string().email('A valid email is required for deposit payment').or(z.literal('')),
    notes: z.string().max(500).optional().or(z.literal('')),
  });

  const form = useForm({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: '', phone: '', email: '', notes: '' },
  });

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: infoData, isLoading: infoLoading, isError: infoError } = useQuery({
    queryKey: ['portal', slug, 'info'],
    queryFn: () => api.get(`/public/${slug}/info`).then((r) => r.data.data),
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['portal', slug, 'staff'],
    queryFn: () => api.get(`/public/${slug}/staff`).then((r) => r.data.data),
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['portal', slug, 'services'],
    queryFn: () => api.get(`/public/${slug}/services`).then((r) => r.data.data),
    enabled: step >= 1,
  });

  const { data: availData, isLoading: availLoading } = useQuery({
    queryKey: ['portal', slug, 'avail', selected.staff?.id, selectedDate],
    queryFn: () =>
      api
        .get(`/public/${slug}/staff/${selected.staff.id}/availability`, { params: { date: selectedDate } })
        .then((r) => r.data.data),
    enabled: step === 2 && Boolean(selected.staff),
  });

  const depositPercent = infoData?.depositPercent ?? 0;
  const depositAmount = depositPercent > 0 && selected.service
    ? Math.round(Number(selected.service.price) * (depositPercent / 100) * 100) / 100
    : 0;

  // ── Mutation ───────────────────────────────────────────────────────────────

  const bookMutation = useMutation({
    mutationFn: (payload) =>
      api.post(`/public/${slug}/bookings`, payload).then((r) => r.data.data),
    onSuccess: (data) => setConfirmed(data),
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Booking failed. Please try again.'),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConfirmDirect = (formValues) => {
    if (depositPercent > 0) return;
    bookMutation.mutate({
      employeeId: selected.staff.id,
      serviceId: selected.service.id,
      vehicleTypeId: selected.service.vehicleTypeId || undefined,
      scheduledAt: selected.slot,
      branchId: infoData?.branches?.[0]?.id || null,
      ...formValues,
    });
  };

  const handlePayDeposit = (formValues) => {
    if (!formValues.email) {
      form.setError('email', { message: 'Email is required to process the deposit payment' });
      return;
    }
    const publicKey = infoData?.paystackPublicKey;
    if (!publicKey || !window.PaystackPop) {
      toast.error('Payment is not available right now. Please try again.');
      return;
    }
    const payload = {
      employeeId: selected.staff.id,
      serviceId: selected.service.id,
      vehicleTypeId: selected.service.vehicleTypeId || undefined,
      scheduledAt: selected.slot,
      branchId: infoData?.branches?.[0]?.id || null,
      ...formValues,
    };
    const amountInPesewas = Math.round(Number(selected.service.price) * (depositPercent / 100) * 100);
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: formValues.email,
      amount: amountInPesewas,
      currency: 'GHS',
      metadata: { custom_fields: [{ display_name: 'Customer', variable_name: 'customer', value: formValues.name }] },
      callback: (response) => {
        bookMutation.mutate({ ...payload, paystackReference: response.reference });
      },
      onClose: () => toast.error('Payment cancelled. Complete payment to confirm your booking.'),
    });
    handler.openIframe();
  };

  const tenant = infoData?.tenant;

  // ── Loading / returning from Paystack ─────────────────────────────────────

  if (infoLoading) {
    return (
      <PageShell>
        <Skeleton className="h-32 w-full rounded-2xl mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <PoweredBy />
      </PageShell>
    );
  }

  if (infoError) {
    return (
      <PageShell>
        <Card className="text-center p-10">
          <p className="text-muted-foreground">This business is not accepting bookings at this time.</p>
        </Card>
        <PoweredBy />
      </PageShell>
    );
  }

  // ── Confirmation screen ───────────────────────────────────────────────────

  if (confirmed) {
    return (
      <PageShell tenant={tenant}>
        <Card className="text-center p-10 space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10">
            <CheckCircle2 className="size-8 text-brand" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Booking confirmed!</h2>
            <p className="text-muted-foreground text-sm">
              Your booking <span className="font-semibold text-foreground">{confirmed.bookingNumber}</span> is set for{' '}
              <span className="font-semibold text-foreground">
                {format(new Date(confirmed.scheduledAt), "EEEE, MMMM d 'at' h:mm a")}
              </span>.
            </p>
          </div>
          {confirmed.depositAmount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
              <Check className="size-3.5" />
              Deposit of {fmt(confirmed.depositAmount)} paid
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Show this booking number when you arrive. We look forward to seeing you!
          </p>
        </Card>
        <PoweredBy />
      </PageShell>
    );
  }

  // ── Main booking flow ─────────────────────────────────────────────────────

  return (
    <PageShell tenant={tenant}>
      <StepIndicator current={step} />

      {/* Step 0 — Staff */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Choose your service provider</CardTitle></CardHeader>
          <CardContent>
            {staffLoading ? <LoadingCards /> : (
              <div className="space-y-2">
                {(staffData ?? []).map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => { setSelected((s) => ({ ...s, staff: emp })); setStep(1); }}
                    className="w-full flex items-center gap-3 rounded-xl border p-4 text-left hover:border-brand/50 hover:bg-brand/5 transition-colors group"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted group-hover:bg-brand/10">
                      <User className="size-5 text-muted-foreground group-hover:text-brand" />
                    </div>
                    <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                    <ChevronLeft className="ml-auto size-4 rotate-180 text-muted-foreground" />
                  </button>
                ))}
                {(staffData ?? []).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">No service providers available at this time.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1a — Service list */}
      {step === 1 && !pendingService && (
        <Card>
          <CardHeader>
            <BackBtn onClick={() => setStep(0)} />
            <CardTitle>Choose a service</CardTitle>
          </CardHeader>
          <CardContent>
            {servicesLoading ? <LoadingCards /> : (
              <div className="space-y-2">
                {(servicesData ?? []).map((svc) => {
                  const hasVehiclePrices = svc.vehiclePrices?.length > 0;
                  const priceDisplay = hasVehiclePrices
                    ? (() => {
                        const prices = svc.vehiclePrices.map((vp) => Number(vp.price));
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
                      })()
                    : fmt(svc.price);
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => {
                        if (hasVehiclePrices) {
                          setPendingService(svc);
                        } else {
                          setSelected((s) => ({
                            ...s,
                            service: {
                              id: svc.id,
                              name: svc.name,
                              price: svc.price,
                              durationMinutes: svc.durationMinutes,
                              vehicleTypeId: null,
                              vehicleTypeName: null,
                            },
                          }));
                          setStep(2);
                        }
                      }}
                      className="w-full flex items-center justify-between rounded-xl border p-4 text-left hover:border-brand/50 hover:bg-brand/5 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{svc.name}</p>
                        <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" /> {svc.durationMinutes} min
                          {hasVehiclePrices && <span className="ml-1">· {svc.vehiclePrices.length} vehicle types</span>}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-brand">{priceDisplay}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1b — Vehicle type picker */}
      {step === 1 && pendingService && (
        <Card>
          <CardHeader>
            <BackBtn onClick={() => setPendingService(null)} />
            <CardTitle>{pendingService.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Select your vehicle type</p>
            <div className="space-y-2">
              {pendingService.vehiclePrices
                .slice()
                .sort((a, b) => (a.VehicleType?.displayOrder ?? 0) - (b.VehicleType?.displayOrder ?? 0))
                .map((vp) => (
                  <button
                    key={vp.vehicleTypeId}
                    type="button"
                    onClick={() => {
                      setSelected((s) => ({
                        ...s,
                        service: {
                          id: pendingService.id,
                          name: pendingService.name,
                          price: vp.price,
                          durationMinutes: pendingService.durationMinutes,
                          vehicleTypeId: vp.vehicleTypeId,
                          vehicleTypeName: vp.VehicleType?.name ?? 'Unknown',
                        },
                      }));
                      setPendingService(null);
                      setStep(2);
                    }}
                    className="w-full flex items-center justify-between rounded-xl border p-4 text-left hover:border-brand/50 hover:bg-brand/5 transition-colors"
                  >
                    <span className="font-medium">{vp.VehicleType?.name ?? 'Unknown'}</span>
                    <span className="font-semibold text-sm text-brand">{fmt(vp.price)}</span>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Time */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <BackBtn onClick={() => { setSelected((s) => ({ ...s, service: null })); setStep(1); }} />
            <CardTitle>Choose a date & time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="date"
              value={selectedDate}
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelected((s) => ({ ...s, slot: null }));
              }}
              className="max-w-xs"
            />
            {availLoading ? (
              <LoadingCards />
            ) : (availData?.slots ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No available slots on this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(availData?.slots ?? []).map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => { setSelected((s) => ({ ...s, slot: slot.time })); setStep(3); }}
                    className={`rounded-lg border p-2.5 text-sm font-medium transition-colors
                      ${!slot.available
                        ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
                        : 'hover:border-brand hover:bg-brand hover:text-brand-foreground'}`}
                  >
                    {format(new Date(slot.time), 'HH:mm')}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Details */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <BackBtn onClick={() => setStep(2)} />
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(() => setStep(4))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input placeholder="Ama Mensah" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl><Input placeholder="0201234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email {depositPercent > 0 ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(optional)</span>}
                    </FormLabel>
                    <FormControl><Input type="email" placeholder="ama@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="Any special requests?" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" variant="brand" className="w-full">
                  Continue
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 4 — Confirm */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <BackBtn onClick={() => setStep(3)} />
            <CardTitle>Review your booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-2.5 text-sm">
              <Row label="Provider" value={`${selected.staff?.firstName} ${selected.staff?.lastName}`} />
              <Row label="Service" value={selected.service?.name} />
              {selected.service?.vehicleTypeName && (
                <Row label="Vehicle type" value={selected.service.vehicleTypeName} />
              )}
              <Row
                label="Date & time"
                value={selected.slot ? format(new Date(selected.slot), "EEE d MMM 'at' HH:mm") : '—'}
              />
              <Row label="Duration" value={`${selected.service?.durationMinutes} min`} />
              <Separator />
              <Row label="Name" value={form.getValues('name')} />
              <Row label="Phone" value={form.getValues('phone')} />
              {form.getValues('email') && <Row label="Email" value={form.getValues('email')} />}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{fmt(selected.service?.price ?? 0)}</span>
              </div>
              {depositPercent > 0 && (
                <div className="flex justify-between text-brand font-medium">
                  <span>Deposit due now ({depositPercent}%)</span>
                  <span>{fmt(depositAmount)}</span>
                </div>
              )}
            </div>

            {depositPercent > 0 ? (
              <div className="space-y-3">
                <Button
                  variant="brand"
                  className="w-full"
                  size="lg"
                  disabled={bookMutation.isPending}
                  onClick={form.handleSubmit(handlePayDeposit)}
                >
                  {bookMutation.isPending ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Confirming…</>
                  ) : (
                    <><Zap className="mr-2 size-4" /> Pay deposit {fmt(depositAmount)} &amp; confirm</>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Secured by Paystack. Remaining balance of {fmt(Number(selected.service?.price ?? 0) - depositAmount)} is due at the appointment.
                </p>
              </div>
            ) : (
              <Button
                variant="brand"
                className="w-full"
                size="lg"
                disabled={bookMutation.isPending}
                onClick={form.handleSubmit(handleConfirmDirect)}
              >
                {bookMutation.isPending ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> Confirming…</>
                ) : (
                  'Confirm booking'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <PoweredBy />
    </PageShell>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function PageShell({ children, tenant }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-brand/5 via-background to-brand-2/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-6 w-6" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight">VX-Workhorse</span>
          </div>
          {tenant?.phone && (
            <a
              href={`tel:${tenant.phone}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="size-3.5" />
              {tenant.phone}
            </a>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Business card */}
        {tenant && (
          <div className="mb-8 text-center space-y-3">
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="mx-auto h-16 w-16 rounded-2xl object-cover ring-1 ring-border shadow-sm"
              />
            ) : (
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-brand/20">
                <span className="text-2xl font-bold text-brand">
                  {tenant.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{tenant.name}</h1>
              {tenant.address && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <MapPin className="size-3" /> {tenant.address}
                </p>
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
              <CalendarDays className="size-3.5" />
              Book your appointment
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
