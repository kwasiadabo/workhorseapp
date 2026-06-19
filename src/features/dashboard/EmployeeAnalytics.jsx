import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarClock, HandCoins, Star } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/shared/StatCard';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { ASSIGNMENT_STATUS_VARIANTS, ASSIGNMENT_STATUSES, formatDuration } from '@/features/bookings/bookings.constants';
import { CASH_HANDOVER_STATUS_VARIANTS } from '@/features/cashHandovers/cashHandovers.constants';
import { useMyDashboard } from './useDashboard';

const ASSIGNMENT_STATUS_COLORS = {
  waiting: 'var(--color-chart-2)',
  in_progress: 'var(--color-info)',
  completed: 'var(--color-success)',
  cancelled: 'var(--color-chart-1)',
};

const formatLabel = (value = '') =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatMoney = (amount) => `GH¢ ${Number(amount ?? 0).toFixed(2)}`;

function ChartCard({ title, isEmpty, emptyMessage, footer, children }) {
  return (
    <Card className="gap-3 p-5">
      <CardTitle>{title}</CardTitle>
      <div className="h-64">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
      {footer}
    </Card>
  );
}

export default function EmployeeAnalytics() {
  const { data, isLoading } = useMyDashboard();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data?.hasEmployeeRecord) return null;

  const { assignments, payments, cashHandovers } = data;

  const assignmentData = ASSIGNMENT_STATUSES.map((status) => ({
    name: status,
    value: assignments.byStatus[status] ?? 0,
  }));
  const hasAssignmentData = assignmentData.some((d) => d.value > 0);

  const paymentMethodData = payments.byMethod.filter((m) => m.count > 0);
  const hasPaymentData = payments.allTime.count > 0;

  const avgSatisfactionDisplay = assignments.byStatus.completed === 0 ? '—' : `${assignments.avgSatisfactionRating.toFixed(1)} / 5`;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">My Performance</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total bookings assigned" value={assignments.totalBookings} icon={CalendarCheck} />
        <StatCard label="This month" value={assignments.thisMonthCount} icon={CalendarClock} />
        <StatCard label="Avg. satisfaction" value={avgSatisfactionDisplay} icon={Star} />
        <StatCard label="Cash handovers submitted" value={cashHandovers.totals.count} icon={HandCoins} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Assignment status breakdown"
          isEmpty={!hasAssignmentData}
          emptyMessage="No assignments yet."
          footer={
            assignments.avgDurationMinutes > 0 ? (
              <p className="text-xs text-muted-foreground">
                Avg. service time: {formatDuration(assignments.avgDurationMinutes)}
              </p>
            ) : null
          }
        >
          <PieChart>
            <Pie data={assignmentData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {assignmentData.map((entry) => (
                <Cell key={entry.name} fill={ASSIGNMENT_STATUS_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, formatLabel(name)]} />
          </PieChart>
        </ChartCard>

        <ChartCard title="Payments by method" isEmpty={!hasPaymentData} emptyMessage="No payments recorded yet.">
          <BarChart data={paymentMethodData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="method" tickFormatter={formatLabel} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value, _name, item) => [`${formatMoney(value)} (${item.payload.count})`, 'Total']}
              labelFormatter={formatLabel}
            />
            <Bar dataKey="totalAmount" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="gap-1 p-5">
          <p className="text-sm text-muted-foreground">Today</p>
          <p className="text-2xl font-semibold tabular-nums">{formatMoney(payments.today.totalAmount)}</p>
          <p className="text-xs text-muted-foreground">
            {payments.today.count} payment{payments.today.count === 1 ? '' : 's'}
          </p>
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-sm text-muted-foreground">This month</p>
          <p className="text-2xl font-semibold tabular-nums">{formatMoney(payments.thisMonth.totalAmount)}</p>
          <p className="text-xs text-muted-foreground">
            {payments.thisMonth.count} payment{payments.thisMonth.count === 1 ? '' : 's'}
          </p>
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-sm text-muted-foreground">All-time</p>
          <p className="text-2xl font-semibold tabular-nums">{formatMoney(payments.allTime.totalAmount)}</p>
          <p className="text-xs text-muted-foreground">
            {payments.allTime.count} payment{payments.allTime.count === 1 ? '' : 's'}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 p-5">
          <CardTitle>Upcoming bookings</CardTitle>
          {assignments.upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
          ) : (
            <div className="space-y-3">
              {assignments.upcoming.map((booking) => (
                <Link
                  key={booking.bookingId}
                  to={`/app/bookings/${booking.bookingId}`}
                  className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{booking.bookingNumber}</p>
                    <div className="flex items-center gap-1.5">
                      {booking.isTeamLead && <Badge variant="secondary">Team lead</Badge>}
                      {booking.assignmentStatus && (
                        <Badge variant={ASSIGNMENT_STATUS_VARIANTS[booking.assignmentStatus]}>
                          {formatLabel(booking.assignmentStatus)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {booking.customerName ?? 'Walk-in'} · {booking.branchName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(booking.scheduledAt)}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="gap-3 p-5">
          <CardTitle>Recent payments</CardTitle>
          {payments.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.recent.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{payment.bookingNumber ?? '—'}</p>
                    <p className="text-sm text-muted-foreground">{payment.customerName ?? 'Walk-in'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">
                      {payment.currency} {Number(payment.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatLabel(payment.method)} · {formatDateTime(payment.paidAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="gap-3 p-5">
        <CardTitle>Recent cash handovers</CardTitle>
        {cashHandovers.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cash handovers submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {cashHandovers.recent.map((handover) => (
              <div key={handover.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div>
                  <p className="font-medium">
                    {formatDate(handover.periodStart)} – {formatDate(handover.periodEnd)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Declared {formatMoney(handover.declaredAmount)} · Expected {formatMoney(handover.expectedAmount)}
                  </p>
                  <p
                    className={`text-xs ${
                      handover.variance === 0 ? 'text-muted-foreground' : handover.variance > 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    Variance: {handover.variance > 0 ? '+' : ''}
                    {formatMoney(handover.variance)}
                  </p>
                </div>
                <Badge variant={CASH_HANDOVER_STATUS_VARIANTS[handover.status]}>{formatLabel(handover.status)}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
