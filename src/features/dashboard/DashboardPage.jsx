import { Link } from 'react-router-dom';
import { endOfDay, startOfDay } from 'date-fns';
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  CircleDot,
  HandCoins,
  ListChecks,
  Plus,
  Scissors,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';

import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/shared/StatCard';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import useAuthStore from '@/store/authStore';
import { useBookingsList } from '@/features/bookings/useBookings';
import { useDashboardSummary } from './useDashboard';
import EmployeeAnalytics from './EmployeeAnalytics';

const fmt = (n) => `GH¢ ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const QUICK_LINKS = [
  {
    to: '/app/bookings',
    label: 'Bookings',
    description: 'View and create bookings',
    icon: CalendarCheck,
    permissions: ['bookings.view', 'bookings.view_own'],
  },
  {
    to: '/app/queues',
    label: 'Queues',
    description: "Monitor service providers' queues",
    icon: ListChecks,
    permissions: ['bookings.manage'],
  },
  {
    to: '/app/payments',
    label: 'Payments',
    description: 'Track payments received',
    icon: Wallet,
    permissions: ['payments.view'],
  },
  {
    to: '/app/branches',
    label: 'Branches',
    description: 'Manage your locations',
    icon: Building2,
    permissions: ['branches.view'],
  },
  {
    to: '/app/employees',
    label: 'Service Providers',
    description: 'Manage your service providers',
    icon: Users,
    permissions: ['employees.view'],
  },
  {
    to: '/app/customers',
    label: 'Clients',
    description: 'View and manage clients',
    icon: UserRound,
    permissions: ['customers.view'],
  },
  {
    to: '/app/services',
    label: 'Services',
    description: 'Manage your service catalog',
    icon: Scissors,
    permissions: ['services.view'],
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);

  const canViewBookings = hasPermission('bookings.view') || hasPermission('bookings.view_own');
  const canCreateBooking = hasPermission('bookings.create');
  const canManageBookings = hasPermission('bookings.manage');

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary({ enabled: canManageBookings });

  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const todayBookings = useBookingsList(
    { limit: 1, scheduledFrom: todayStart, scheduledTo: todayEnd },
    { enabled: canViewBookings }
  );
  const inProgress = useBookingsList({ limit: 1, status: 'in_progress' }, { enabled: canViewBookings });
  const awaitingPayment = useBookingsList({ limit: 1, status: 'awaiting_payment' }, { enabled: canViewBookings });
  const completedToday = useBookingsList(
    { limit: 1, status: 'completed', scheduledFrom: todayStart, scheduledTo: todayEnd },
    { enabled: canViewBookings }
  );

  const links = QUICK_LINKS.filter((link) => link.permissions.some((p) => hasPermission(p)));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {user?.firstName}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
        </div>
        {canCreateBooking && (
          <Button render={<Link to="/app/bookings/new" />} variant="brand">
            <Plus /> New booking
          </Button>
        )}
      </div>

      {canViewBookings && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today's bookings" value={todayBookings.data?.meta?.total ?? 0} icon={CalendarClock} isLoading={todayBookings.isLoading} />
          <StatCard label="In progress" value={inProgress.data?.meta?.total ?? 0} icon={CircleDot} isLoading={inProgress.isLoading} />
          <StatCard label="Awaiting payment" value={awaitingPayment.data?.meta?.total ?? 0} icon={Clock} isLoading={awaitingPayment.isLoading} />
          <StatCard label="Completed today" value={completedToday.data?.meta?.total ?? 0} icon={CheckCircle2} isLoading={completedToday.isLoading} />
        </div>
      )}

      {canManageBookings && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Today's revenue" value={fmt(summary?.money?.todayRevenue)} icon={Banknote} isLoading={summaryLoading} />
            <StatCard label="Outstanding balance" value={fmt(summary?.money?.outstandingBalance)} icon={HandCoins} isLoading={summaryLoading} />
            <StatCard
              label="New clients this week"
              value={summary?.growth?.newCustomers ?? 0}
              sub={`${summary?.growth?.returningCustomers ?? 0} returning`}
              icon={UserPlus}
              isLoading={summaryLoading}
            />
            <StatCard
              label="Top service this week"
              value={summary?.growth?.topService?.name ?? '—'}
              sub={summary?.growth?.topService ? fmt(summary.growth.topService.revenue) : undefined}
              icon={TrendingUp}
              isLoading={summaryLoading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-3 p-5">
              <CardTitle className="text-sm">Upcoming bookings</CardTitle>
              {summaryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : summary?.upcoming?.length ? (
                <div className="divide-y">
                  {summary.upcoming.map((booking) => (
                    <Link
                      key={booking.bookingId}
                      to={`/app/bookings/${booking.bookingId}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{booking.customerName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {booking.branchName}
                          {booking.providerNames.length > 0 && ` · ${booking.providerNames.join(', ')}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(booking.scheduledAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No upcoming bookings.</p>
              )}
            </Card>

            <Card className="gap-3 p-5">
              <CardTitle className="text-sm">Staff utilization today</CardTitle>
              {summaryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : summary?.staffUtilization?.length ? (
                <div className="divide-y">
                  {summary.staffUtilization.map((staff) => (
                    <div key={staff.employeeId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{staff.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {staff.branchName} · {staff.todayCount} {staff.todayCount === 1 ? 'service' : 'services'} today
                        </p>
                      </div>
                      <Badge variant={staff.status === 'busy' ? 'default' : 'secondary'} className="shrink-0 capitalize">
                        {staff.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No active service providers.</p>
              )}
            </Card>
          </div>
        </>
      )}

      {links.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">Manage your business</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="group">
                <Card className="h-full gap-3 p-5 transition-colors hover:border-brand/30 hover:bg-brand/3">
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                      <link.icon className="size-4" />
                    </div>
                    <ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                  <div>
                    <CardTitle>{link.label}</CardTitle>
                    <CardDescription className="mt-1">{link.description}</CardDescription>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasRole('employee') && <EmployeeAnalytics />}
    </div>
  );
}
