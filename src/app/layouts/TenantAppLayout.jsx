import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { differenceInDays, differenceInHours } from 'date-fns';
import { isCarBusiness } from '@/lib/businessTypes';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  UserRound,
  Scissors,
  CalendarCheck,
  ChartNoAxesCombined,
  ChartBar,
  BarChart2,
  BarChart3,
  TrendingUp,
  ListChecks,
  Receipt,
  Wallet,
  Banknote,
  Landmark,
  ArrowLeftRight,
  Scale,
  Car,
  CreditCard,
  Globe,
  Settings2,
  Menu,
  AlertTriangle,
  Percent,
  UserSearch,
  Gift,
  Star,
  MessageSquare,
  Compass,
  UsersRound,
} from 'lucide-react';

import useAuthStore from '@/store/authStore';
import SidebarNav from '@/components/layout/SidebarNav';
import UserMenu from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/getting-started', label: 'Getting Started', icon: Compass },

  {
    type: 'group',
    label: 'Operations',
    icon: CalendarCheck,
    children: [
      { to: '/app/bookings', label: 'Bookings', icon: CalendarCheck, permissions: ['bookings.view'] },
      { to: '/app/customers', label: 'Clients', icon: UserRound, permissions: ['customers.view'] },
      { to: '/app/loyalty', label: 'Loyalty Program', icon: Gift, permissions: ['customers.view'] },
      { to: '/app/reviews', label: 'Reviews', icon: Star, permissions: ['bookings.view'] },
      { to: '/app/sms', label: 'SMS Campaigns', icon: MessageSquare, permissions: ['sms.manage'] },
      { to: '/app/my-services', label: 'My Queue', icon: ListChecks, roles: ['employee'] },
      { to: '/app/queues', label: 'Queues', icon: ListChecks, permissions: ['bookings.manage'] },
    ],
  },

  {
    type: 'group',
    label: 'Finance',
    icon: Wallet,
    children: [
      { to: '/app/service-payments', label: 'Service Payments', icon: Receipt, permissions: ['payments.create'] },
      { to: '/app/payments', label: 'Payment History', icon: Wallet, permissions: ['payments.view'] },
      { to: '/app/expenses', label: 'Expenses', icon: Banknote, permissions: ['expenses.view'] },
      { to: '/app/banking/transactions', label: 'Bank Transactions', icon: ArrowLeftRight, permissions: ['banking.view'] },
    ],
  },

  {
    type: 'group',
    label: 'Reports',
    icon: BarChart2,
    children: [
      { to: '/app/expense-report', label: 'Expense Report', icon: ChartBar, permissions: ['expenses.view'] },
      { to: '/app/banking/reports', label: 'Bank Reports', icon: Scale, permissions: ['banking.view'] },
      { to: '/app/bookings-report', label: 'Bookings Report', icon: BarChart2, permissions: ['reports.view'] },
      { to: '/app/payments-report', label: 'Payments Report', icon: BarChart3, permissions: ['reports.view'] },
      { to: '/app/revenue-report', label: 'Revenue Report', icon: TrendingUp, permissions: ['reports.view'] },
      { to: '/app/commission-report', label: 'Commission Report', icon: Percent, permissions: ['employees.manage'] },
      { to: '/app/service-provider-report', label: 'Service Provider Report', icon: UserSearch, permissions: ['reports.view'] },
      { to: '/app/team-performance-report', label: 'Team Performance Report', icon: UsersRound, permissions: ['reports.view'] },
      { to: '/app/analytics', label: 'Business Analytics', icon: ChartNoAxesCombined, roles: ['tenant_owner'] },
    ],
  },

  {
    type: 'group',
    label: 'Setups',
    icon: Settings2,
    children: [
      { to: '/app/branches', label: 'Branches', icon: Building2, permissions: ['branches.view'] },
      { to: '/app/employees', label: 'Workers', icon: Users, permissions: ['employees.view'] },
      { to: '/app/teams', label: 'Teams', icon: UsersRound, permissions: ['employees.view'] },
      { to: '/app/users', label: 'Users', icon: UserCog, permissions: ['users.view'] },
      { to: '/app/services', label: 'Services', icon: Scissors, permissions: ['services.view'] },
      { to: '/app/banking/setup', label: 'Banks & Accounts', icon: Landmark, permissions: ['banking.manage'] },
      { to: '/app/vehicle-types', label: 'Vehicle Types', icon: Car, permissions: ['bookings.manage'], carOnly: true },
    ],
  },

  { to: '/app/portal-settings', label: 'Online Booking', icon: Globe, roles: ['tenant_owner'] },
  { to: '/app/subscription', label: 'Subscription', icon: CreditCard, roles: ['tenant_owner'] },
];

const SUBSCRIPTION_WARN_DAYS = 7;

function StatusBanner({ variant = 'warning', message, cta }) {
  const isError = variant === 'error';
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${isError ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'}`}>
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="size-4 shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      <Link to="/app/subscription" className="shrink-0 rounded-md border border-current px-2.5 py-0.5 text-xs font-medium hover:bg-black/5 transition-colors">
        {cta}
      </Link>
    </div>
  );
}

function SubscriptionBanner({ subscriptionStatus, trialEndsAt, currentPeriodEnd }) {
  const now = new Date();

  if (subscriptionStatus === 'trialing' && trialEndsAt) {
    const end = new Date(trialEndsAt);
    const daysLeft = Math.max(0, differenceInDays(end, now));
    const hoursLeft = Math.max(0, differenceInHours(end, now) % 24);
    const isExpired = end <= now;
    const message = isExpired
      ? 'Your free trial has expired.'
      : daysLeft > 0
      ? `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${end.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}).`
      : `Your free trial expires today in ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}.`;
    return <StatusBanner variant={isExpired ? 'error' : 'warning'} message={message} cta={isExpired ? 'Subscribe now' : 'Upgrade now'} />;
  }

  if (subscriptionStatus === 'active' && currentPeriodEnd) {
    const end = new Date(currentPeriodEnd);
    const daysLeft = differenceInDays(end, now);
    if (daysLeft > SUBSCRIPTION_WARN_DAYS) return null;
    const message = daysLeft <= 0
      ? 'Your subscription expires today.'
      : `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} on ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    return <StatusBanner variant="warning" message={message} cta="Renew now" />;
  }

  if (subscriptionStatus === 'expired') {
    return <StatusBanner variant="error" message="Your subscription has expired. Renew to regain full access." cta="Renew now" />;
  }

  if (subscriptionStatus === 'suspended') {
    return <StatusBanner variant="error" message="Your account has been suspended due to a payment issue." cta="Resolve now" />;
  }

  if (subscriptionStatus === 'cancelled') {
    return <StatusBanner variant="error" message="Your subscription has been cancelled." cta="Reactivate" />;
  }

  return null;
}

export default function TenantAppLayout() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);
  const tenantName = useAuthStore((s) => s.user?.tenantName ?? 'WorkHorse');
  const subscriptionStatus = useAuthStore((s) => s.user?.subscriptionStatus);
  const trialEndsAt = useAuthStore((s) => s.user?.trialEndsAt);
  const currentPeriodEnd = useAuthStore((s) => s.user?.currentPeriodEnd);
  const [navOpen, setNavOpen] = useState(false);

  const businessType = useAuthStore((s) => s.user?.businessType);

  const isVisible = (item) =>
    (!item.permissions || item.permissions.some((p) => hasPermission(p))) &&
    (!item.roles || item.roles.some((r) => hasRole(r))) &&
    (!item.carOnly || isCarBusiness(businessType));

  const items = NAV_ITEMS.flatMap((item) => {
    if (item.type === 'group') {
      const children = item.children.filter(isVisible);
      return children.length ? [{ ...item, children }] : [];
    }
    return isVisible(item) ? [item] : [];
  });

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-56 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-base font-semibold">{tenantName}</span>
        </div>
        <SidebarNav items={items} className="flex-1 p-2" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setNavOpen(true)}>
            <Menu />
            <span className="sr-only">Open menu</span>
          </Button>
          <span className="text-sm font-medium md:hidden">{tenantName}</span>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <SubscriptionBanner subscriptionStatus={subscriptionStatus} trialEndsAt={trialEndsAt} currentPeriodEnd={currentPeriodEnd} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="gap-0 p-0">
          <SheetHeader className="h-14 justify-center border-b">
            <SheetTitle>{tenantName}</SheetTitle>
          </SheetHeader>
          <SidebarNav items={items} className="flex-1 p-2" onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
