import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  BarChart2,
  Building2,
  CalendarCheck,
  CreditCard,
  Globe,
  Landmark,
  ListChecks,
  Receipt,
  Scissors,
  Sparkles,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';

import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import useAuthStore from '@/store/authStore';
import { markOnboardingSeen } from '@/lib/onboarding';

const SECTIONS = [
  {
    title: '1. Set up your business',
    icon: Building2,
    description:
      "Before you can take a single booking, tell WorkHorse how your business is organized — where you operate, who works there, and what you sell.",
    steps: [
      { label: 'Add your branches / locations', detail: 'Every booking, employee and report belongs to a branch.', to: '/app/branches', icon: Building2, permissions: ['branches.view'] },
      { label: 'Add your staff', detail: 'Create employee profiles and assign each one a position.', to: '/app/employees', icon: Users, permissions: ['employees.view'] },
      { label: 'Create staff login accounts', detail: 'Give managers, receptionists and employees their own login with the right role.', to: '/app/users', icon: UserCog, permissions: ['users.view'] },
      { label: 'Build your service catalog', detail: 'Define categories and services with price & duration — these are snapshotted onto every booking.', to: '/app/services', icon: Scissors, permissions: ['services.view'] },
      { label: 'Connect your bank accounts', detail: 'Optional — lets you reconcile card and mobile-money payments against bank statements.', to: '/app/banking/setup', icon: Landmark, permissions: ['banking.manage'] },
    ],
  },
  {
    title: '2. Manage your subscription',
    icon: CreditCard,
    description:
      'New businesses get a 30-day free trial automatically. Once it ends, choose a paid plan to keep full access — some features, like SMS campaigns, are only available on higher tiers.',
    steps: [
      { label: 'Check your trial status & choose a plan', detail: 'Unused trial days are credited to your first paid billing period.', to: '/app/subscription', icon: CreditCard, roles: ['tenant_owner'] },
      { label: 'Turn on your public online booking page', detail: 'Optional — lets customers see your services and request a slot online.', to: '/app/portal-settings', icon: Globe, roles: ['tenant_owner'] },
    ],
  },
  {
    title: '3. Take bookings',
    icon: CalendarCheck,
    description:
      "Bookings are walk-in: a receptionist, manager or owner opens a booking when the customer arrives and assigns staff to it. From there, its status moves through confirmed → in progress → awaiting payment → completed on its own, as the work and payment happen — there's no manual status to update on the happy path.",
    steps: [
      { label: 'Create a booking for a walk-in customer', detail: 'Pick the customer, the services they want, and assign staff.', to: '/app/bookings/new', icon: CalendarCheck, permissions: ['bookings.create'] },
      { label: 'View and manage all bookings', detail: "Cancel or mark a no-show for visits that won't proceed.", to: '/app/bookings', icon: CalendarCheck, permissions: ['bookings.view'] },
      { label: 'Work your queue', detail: 'See the services assigned to you and mark them started or completed.', to: '/app/my-services', icon: ListChecks, roles: ['employee'] },
      { label: "Monitor everyone's queue", detail: "See every staff member's in-progress and waiting work across the branch.", to: '/app/queues', icon: ListChecks, permissions: ['bookings.manage'] },
    ],
  },
  {
    title: '4. Record payments',
    icon: Wallet,
    description:
      "A booking only reaches \"completed\" once it's fully paid — payment is the final step regardless of how far the service work has progressed. Record payments as customers pay, and reconcile cash at the end of a shift.",
    steps: [
      { label: 'Record a payment against a booking', detail: 'Cash, card or mobile money — partial payments are supported.', to: '/app/service-payments', icon: Receipt, permissions: ['payments.create'] },
      { label: 'View payment history', detail: 'See every payment recorded across the business.', to: '/app/payments', icon: Wallet, permissions: ['payments.view'] },
      { label: 'Reconcile cash handovers', detail: 'Declare cash handed over by an employee and compare it to what they should have collected.', to: '/app/cash-handovers', icon: Banknote, permissions: ['cash_handovers.view', 'cash_handovers.manage'] },
      { label: 'Track business expenses', detail: 'Log day-to-day spend against expense categories.', to: '/app/expenses', icon: Banknote, permissions: ['expenses.view'] },
      { label: 'Review bank transactions', detail: 'Match incoming payments against your connected bank accounts.', to: '/app/banking/transactions', icon: ArrowLeftRight, permissions: ['banking.view'] },
    ],
  },
  {
    title: '5. Track performance with reports',
    icon: BarChart2,
    description:
      'Once bookings and payments are flowing, use reports to understand revenue, staff performance and overall business health.',
    steps: [
      { label: 'Revenue report', detail: 'Revenue over time, by branch or service.', to: '/app/revenue-report', icon: BarChart2, permissions: ['reports.view'] },
      { label: 'Bookings report', detail: 'Volume, statuses and trends across all bookings.', to: '/app/bookings-report', icon: BarChart2, permissions: ['reports.view'] },
      { label: 'Payments report', detail: 'Payments received, broken down by method and period.', to: '/app/payments-report', icon: BarChart2, permissions: ['reports.view'] },
      { label: 'Commission report', detail: 'What each staff member has earned from completed services.', to: '/app/commission-report', icon: BarChart2, permissions: ['employees.manage'] },
      { label: 'Service provider report', detail: 'Performance per staff member — bookings handled, revenue generated.', to: '/app/service-provider-report', icon: BarChart2, permissions: ['reports.view'] },
      { label: 'Business analytics overview', detail: 'A high-level dashboard of how the business is doing.', to: '/app/analytics', icon: BarChart2, roles: ['tenant_owner'] },
    ],
  },
];

export default function GettingStartedPage() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);

  useEffect(() => {
    markOnboardingSeen(user?.id);
  }, [user?.id]);

  const isVisible = (step) =>
    (!step.permissions || step.permissions.some((p) => hasPermission(p))) &&
    (!step.roles || step.roles.some((r) => hasRole(r)));

  const sections = SECTIONS.map((section) => ({
    ...section,
    steps: section.steps.filter(isVisible),
  })).filter((section) => section.steps.length > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Getting started"
        description={`Welcome${user?.firstName ? `, ${user.firstName}` : ''} — here's how WorkHorse fits together, from setup to your first report.`}
      />

      <Card className="gap-2 border-brand/20 bg-brand/5 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" />
          <CardTitle className="text-sm">The flow, in one paragraph</CardTitle>
        </div>
        <CardDescription className="text-foreground/80">
          Set up your branches, staff and services, then make sure your subscription is active.
          From there, every visit follows the same pattern: open a booking when a customer
          arrives, assign staff to it, and record payment once the work is done — the booking's
          status updates itself along the way. Reports then summarize everything you've
          recorded, so you can see how the business is performing.
        </CardDescription>
      </Card>

      {sections.map((section) => (
        <Card key={section.title} className="gap-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <section.icon className="size-4" />
            </div>
            <div>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription className="mt-1">{section.description}</CardDescription>
            </div>
          </div>

          <div className="divide-y rounded-lg border">
            {section.steps.map((step) => (
              <Link
                key={step.to}
                to={step.to}
                className="group flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
              >
                <step.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.detail}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
