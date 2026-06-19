import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { usePlans } from '@/features/subscription/usePlans';
import { useTenant, useUpdateTenant, useCancelTenant } from './useSuperAdminTenants';

const STATUS_OPTIONS = ['trial', 'active', 'suspended', 'cancelled'];

const updateSchema = z.object({
  status: z.enum(STATUS_OPTIONS),
  trialEndsAt: z.string().optional().or(z.literal('')),
  planId: z.string().uuid().optional().or(z.literal('')),
});

export default function SuperAdminTenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useTenant(id);
  const { data: plans = [] } = usePlans();
  const updateTenant = useUpdateTenant();
  const cancelTenant = useCancelTenant();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(updateSchema),
    values: tenant
      ? {
          status: tenant.status,
          trialEndsAt: tenant.trialEndsAt ? format(new Date(tenant.trialEndsAt), "yyyy-MM-dd'T'HH:mm") : '',
          planId: tenant.planId ?? '',
        }
      : undefined,
  });

  const onSubmit = (values) => {
    updateTenant.mutate(
      {
        id,
        data: {
          status: values.status,
          trialEndsAt: values.trialEndsAt ? new Date(values.trialEndsAt).toISOString() : null,
          planId: values.planId || null,
        },
      },
      {
        onSuccess: () => toast.success('Tenant updated'),
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to update tenant'),
      }
    );
  };

  const handleCancelTenant = () => {
    cancelTenant.mutate(id, {
      onSuccess: () => {
        toast.success('Tenant cancelled');
        setConfirmOpen(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to cancel tenant'),
    });
  };

  if (isLoading || !tenant) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading tenant…</p>
      </div>
    );
  }

  const sub = tenant.subscription;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tenants')} className="w-fit">
        <ArrowLeft /> Back to tenants
      </Button>
      <PageHeader
        title={tenant.name}
        description={`/${tenant.slug}`}
        actions={
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={tenant.status === 'cancelled'}
          >
            Cancel tenant
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business details */}
        <Card>
          <CardHeader>
            <CardTitle>Business details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ['Email', tenant.email],
              ['Phone', tenant.phone || '—'],
              ['Address', tenant.address || '—'],
              ['Business type', tenant.businessType?.replace(/_/g, ' ')],
              ['Created', formatDate(tenant.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right capitalize">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Subscription status (admin editable) */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription management</CardTitle>
            <CardDescription>Update status, plan assignment, and trial end date/time.</CardDescription>
          </CardHeader>
          <CardContent>
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
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt} className="capitalize">
                              {opt}
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
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="No plan assigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No plan</SelectItem>
                          {plans.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — {p.currency} {Number(p.priceMonthly).toLocaleString()}/mo
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
                  name="trialEndsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trial expires at</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateTenant.isPending}>
                  {updateTenant.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Subscription record */}
      {sub && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription record</CardTitle>
            <CardDescription>
              Current subscription row — updated automatically when the tenant activates a plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Subscription status</dt>
                <dd className="mt-0.5">
                  <Badge variant={sub.status === 'active' ? 'default' : 'outline'} className="capitalize">
                    {sub.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="mt-0.5 font-medium">{sub.plan?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Trial started</dt>
                <dd className="mt-0.5">{sub.trialStartedAt ? formatDateTime(sub.trialStartedAt) : '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Period start</dt>
                <dd className="mt-0.5">{sub.currentPeriodStart ? formatDate(sub.currentPeriodStart) : '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Period end</dt>
                <dd className="mt-0.5">{sub.currentPeriodEnd ? formatDateTime(sub.currentPeriodEnd) : '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Trial days credited</dt>
                <dd className="mt-0.5">{sub.trialSkipped ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{tenant.Users?.length ?? 0} user(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant.Users?.length ? (
                tenant.Users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.firstName} {u.lastName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'default' : 'outline'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No users yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel this tenant?"
        description="This will set the tenant's status to cancelled and revoke their access. Their data will not be deleted."
        confirmLabel="Cancel tenant"
        onConfirm={handleCancelTenant}
        isLoading={cancelTenant.isPending}
      />
    </div>
  );
}
