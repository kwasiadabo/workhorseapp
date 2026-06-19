import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Gift, Star, Trophy } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import useAuthStore from '@/store/authStore';
import { useLoyaltySettings, useUpdateLoyaltySettings, useLoyaltyCustomers, useRedeemPoints } from './useLoyalty';

const settingsSchema = z.object({
  loyaltyThreshold: z.coerce.number().int().min(1, 'Must be at least 1'),
  loyaltyRewardDescription: z.string().max(500).optional().or(z.literal('')),
});

function SettingsCard() {
  const { data: settings, isLoading } = useLoyaltySettings();
  const update = useUpdateLoyaltySettings();

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    values: settings
      ? { loyaltyThreshold: settings.loyaltyThreshold, loyaltyRewardDescription: settings.loyaltyRewardDescription ?? '' }
      : { loyaltyThreshold: 10, loyaltyRewardDescription: '' },
  });

  const onSubmit = (values) => {
    update.mutate(
      { loyaltyThreshold: values.loyaltyThreshold, loyaltyRewardDescription: values.loyaltyRewardDescription || null },
      {
        onSuccess: () => toast.success('Loyalty settings saved'),
        onError: () => toast.error('Failed to save settings'),
      }
    );
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="size-4" /> Loyalty program settings
        </CardTitle>
        <CardDescription>Customers earn 1 point per completed visit. Set the threshold to trigger a reward.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
            <FormField
              control={form.control}
              name="loyaltyThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points required for reward</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>e.g. 10 means the customer redeems after 10 visits</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loyaltyRewardDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Free haircut on next visit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function LoyaltyPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('customers.manage');
  const { data: settings } = useLoyaltySettings();
  const threshold = settings?.loyaltyThreshold ?? 10;

  const [page, setPage] = useState(1);
  const [redeemTarget, setRedeemTarget] = useState(null);
  const redeemPoints = useRedeemPoints();

  const { data, isLoading } = useLoyaltyCustomers({ page, limit: 25 });
  const customers = data?.data ?? [];

  const handleRedeem = () => {
    redeemPoints.mutate(redeemTarget.id, {
      onSuccess: (result) => {
        toast.success(
          `Reward redeemed! ${redeemTarget.name} now has ${result.loyaltyPoints} points.${result.reward ? ` Reward: ${result.reward}` : ''}`
        );
        setRedeemTarget(null);
      },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to redeem points'),
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Client',
      render: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'loyaltyPoints',
      header: 'Points',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Trophy className={`size-3.5 ${row.loyaltyPoints >= threshold ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          <span className="font-semibold">{row.loyaltyPoints}</span>
          {row.loyaltyPoints >= threshold && (
            <Badge variant="secondary" className="text-xs">Ready to redeem</Badge>
          )}
        </div>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) =>
        row.loyaltyPoints >= threshold ? (
          <Button size="sm" variant="outline" onClick={() => setRedeemTarget(row)}>
            <Gift className="mr-1 size-3.5" /> Redeem
          </Button>
        ) : null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Loyalty Program" description="Track client visit points and manage rewards." />

      {canManage && <SettingsCard />}

      <Card className="p-0 overflow-hidden">
        <div className="border-b p-4">
          <h3 className="font-semibold">Client points</h3>
          <p className="text-muted-foreground text-sm">Sorted by highest points. Redeem when a client reaches {threshold} points.</p>
        </div>
        <DataTable columns={columns} data={customers} isLoading={isLoading} emptyMessage="No client records found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </Card>

      <ConfirmDialog
        open={Boolean(redeemTarget)}
        onOpenChange={(open) => !open && setRedeemTarget(null)}
        title="Redeem loyalty reward?"
        description={`This will deduct ${threshold} points from ${redeemTarget?.name}'s account (current: ${redeemTarget?.loyaltyPoints ?? 0} pts).${settings?.loyaltyRewardDescription ? ` Reward: "${settings.loyaltyRewardDescription}"` : ''}`}
        confirmLabel="Redeem"
        onConfirm={handleRedeem}
        isLoading={redeemPoints.isPending}
      />
    </div>
  );
}
