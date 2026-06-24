import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building, Wallet, TrendingUp, Clock, MessageSquare, CalendarCheck } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSuperAdminDashboard } from './useSuperAdminDashboard';

const STATUS_COLORS = {
  trial: 'var(--color-info)',
  active: 'var(--color-success)',
  suspended: 'var(--color-warning)',
  cancelled: 'var(--color-destructive)',
  trialing: 'var(--color-info)',
  past_due: 'var(--color-warning)',
  expired: 'var(--color-destructive)',
  confirmed: 'var(--color-chart-1)',
  in_progress: 'var(--color-chart-2)',
  awaiting_payment: 'var(--color-warning)',
  completed: 'var(--color-success)',
  no_show: 'var(--color-destructive)',
};

const formatMoney = (v) => `GH¢ ${Number(v ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatLabel = (v = '') => v.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const formatMonth = (month) => format(new Date(`${month}-01`), 'MMM yyyy');

const formatDate = (d) => format(new Date(d), 'd MMM yyyy');

const urgencyClass = (days) => {
  if (days <= 3) return 'text-destructive';
  if (days <= 14) return 'text-warning';
  return '';
};

function ChartCard({ title, isEmpty, emptyMessage = 'No data yet.', children }) {
  return (
    <Card className="gap-3 p-5">
      <CardTitle>{title}</CardTitle>
      <div className="h-56">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSuperAdminDashboard();

  const expiringRows = useMemo(() => {
    if (!data) return [];
    const trials = data.subscriptions.expiringTrials.map((row) => ({
      id: `trial-${row.tenantId}`,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      type: 'Trial',
      planName: '—',
      expiresOn: row.trialEndsAt,
      daysLeft: row.daysLeft,
      cancelAtPeriodEnd: false,
    }));
    const subscriptions = data.subscriptions.expiringSubscriptions.map((row) => ({
      id: `sub-${row.tenantId}`,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      type: 'Subscription',
      planName: row.planName,
      expiresOn: row.currentPeriodEnd,
      daysLeft: row.daysLeft,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    }));
    return [...trials, ...subscriptions].sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data]);

  const smsByTenant = useMemo(
    () => (data?.sms.byTenant ?? []).map((row) => ({ id: row.tenantId, ...row })),
    [data]
  );

  const bookingTopTenants = useMemo(
    () => (data?.bookings.topTenants ?? []).map((row) => ({ id: row.tenantId, ...row })),
    [data]
  );

  const tenantStatusData = useMemo(
    () =>
      Object.entries(data?.tenants.byStatus ?? {}).map(([status, count]) => ({ status, count })),
    [data]
  );

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Platform Overview" description="Cross-tenant analytics for the whole platform." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Platform Overview" description="Cross-tenant analytics for the whole platform." />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total tenants" value={data.tenants.total.toLocaleString()} icon={Building} />
        <StatCard label="Active tenants" value={data.tenants.byStatus.active.toLocaleString()} icon={Building} />
        <StatCard label="Trialing" value={data.tenants.byStatus.trial.toLocaleString()} icon={Clock} />
        <StatCard label="MRR" value={formatMoney(data.subscriptions.mrr)} icon={Wallet} />
        <StatCard label="ARR" value={formatMoney(data.subscriptions.arr)} icon={TrendingUp} sub="annualized from current MRR" />
      </div>

      {/* Tenant growth */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="New tenants — last 6 months" isEmpty={data.tenants.trend.every((r) => r.count === 0)}>
          <AreaChart data={data.tenants.trend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="tenantGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip labelFormatter={formatMonth} />
            <Area type="monotone" dataKey="count" name="New tenants" stroke="var(--color-brand)" strokeWidth={2} fill="url(#tenantGrad)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Tenants by status" isEmpty={tenantStatusData.every((r) => r.count === 0)}>
          <PieChart>
            <Pie data={tenantStatusData} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {tenantStatusData.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? 'var(--color-chart-1)'} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, formatLabel(name)]} />
          </PieChart>
        </ChartCard>
      </div>

      {/* Subscriptions & expiry */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Subscriptions & expiry</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Trials expiring (30d)" value={data.subscriptions.expiringTrials.length} icon={Clock} />
          <StatCard label="Renewals due (30d)" value={data.subscriptions.expiringSubscriptions.length} icon={CalendarCheck} />
          <StatCard label="Past due" value={data.subscriptions.byStatus.past_due} icon={Wallet} colorClass="text-destructive" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="MRR by plan" isEmpty={data.subscriptions.mrrByPlan.length === 0}>
            <BarChart data={data.subscriptions.mrrByPlan} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="planName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(value, _name, item) => [`${formatMoney(value)} (${item.payload.tenantCount} tenants)`, 'MRR']} />
              <Bar dataKey="mrr" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>

          <Card className="gap-3 p-5">
            <CardTitle>Expiring soon</CardTitle>
            <DataTable
              columns={[
                { key: 'tenantName', header: 'Tenant' },
                {
                  key: 'type',
                  header: 'Type',
                  render: (row) => (
                    <Badge variant={row.type === 'Trial' ? 'info' : 'secondary'}>
                      {row.type}
                      {row.cancelAtPeriodEnd ? ' (cancelling)' : ''}
                    </Badge>
                  ),
                },
                { key: 'planName', header: 'Plan' },
                { key: 'expiresOn', header: 'Expires on', render: (row) => formatDate(row.expiresOn) },
                {
                  key: 'daysLeft',
                  header: 'Days left',
                  className: 'text-right',
                  render: (row) => <span className={urgencyClass(row.daysLeft)}>{row.daysLeft}</span>,
                },
              ]}
              data={expiringRows}
              onRowClick={(row) => navigate(`/admin/tenants/${row.tenantId}`)}
              emptyMessage="Nothing expiring in the next 30 days."
            />
          </Card>
        </div>
      </div>

      {/* SMS usage */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">SMS usage</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Sent this month" value={data.sms.totalThisMonth.toLocaleString()} icon={MessageSquare} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="SMS sent — last 6 months" isEmpty={data.sms.trend.every((r) => r.count === 0)}>
            <BarChart data={data.sms.trend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip labelFormatter={formatMonth} />
              <Bar dataKey="count" name="SMS sent" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>

          <Card className="gap-3 p-5">
            <CardTitle>Top tenants by SMS usage (this month)</CardTitle>
            <DataTable
              columns={[
                { key: 'tenantName', header: 'Tenant' },
                { key: 'count', header: 'Sent', className: 'text-right' },
                { key: 'limit', header: 'Plan limit', className: 'text-right', render: (row) => row.limit ?? 'Unlimited' },
                {
                  key: 'percentUsed',
                  header: '% used',
                  className: 'text-right',
                  render: (row) =>
                    row.percentUsed == null ? (
                      '—'
                    ) : (
                      <Badge variant={row.percentUsed >= 100 ? 'destructive' : row.percentUsed >= 80 ? 'warning' : 'secondary'}>
                        {row.percentUsed}%
                      </Badge>
                    ),
                },
              ]}
              data={smsByTenant}
              onRowClick={(row) => navigate(`/admin/tenants/${row.tenantId}`)}
              emptyMessage="No SMS sent this month."
            />
          </Card>
        </div>
      </div>

      {/* Booking trend */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Booking trend</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Bookings this month" value={data.bookings.totalThisMonth.toLocaleString()} icon={CalendarCheck} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Bookings — last 6 months" isEmpty={data.bookings.trend.every((r) => r.count === 0)}>
            <AreaChart data={data.bookings.trend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip labelFormatter={formatMonth} />
              <Area type="monotone" dataKey="count" name="Bookings" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#bookingGrad)" />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Bookings by status (this month)" isEmpty={data.bookings.byStatus.length === 0}>
            <PieChart>
              <Pie data={data.bookings.byStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.bookings.byStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? 'var(--color-chart-1)'} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, formatLabel(name)]} />
            </PieChart>
          </ChartCard>
        </div>

        <Card className="gap-3 p-5">
          <CardTitle>Top tenants by booking volume (this month)</CardTitle>
          <DataTable
            columns={[
              { key: 'tenantName', header: 'Tenant' },
              { key: 'count', header: 'Bookings', className: 'text-right' },
            ]}
            data={bookingTopTenants}
            onRowClick={(row) => navigate(`/admin/tenants/${row.tenantId}`)}
            emptyMessage="No bookings this month."
          />
        </Card>
      </div>
    </div>
  );
}
