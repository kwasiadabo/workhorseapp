import { format, addDays } from 'date-fns';
import { Check, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PAGE_LOAD_NOW = Date.now();

const FEATURE_LABELS = {
  branches: 'Branch management',
  employees: 'Service provider management',
  customers: 'Client management',
  services: 'Service catalog',
  bookings: 'Bookings',
  payments: 'Payments',
  expenses: 'Expense tracking',
  reports: 'Revenue, bookings & payment reports',
  expense_report: 'Expense & cost reports',
  analytics: 'Business analytics & branch performance',
  sms: 'SMS reminders, receipts & promotions',
  priority_support: 'Priority support',
  advanced_analytics: 'Advanced analytics & commission insights',
};

// Feature keys whose plan comparison benefits from a concrete number rather
// than just a checkmark — e.g. "(up to 10,000/mo)" for SMS.
const featureDetail = (key, plan) => {
  if (key === 'sms' && plan.smsMonthlyLimit != null) {
    return `(up to ${Number(plan.smsMonthlyLimit).toLocaleString()}/mo)`;
  }
  return null;
};

function PlanCard({ plan, billingCycle, currentPlanId, trialStartedAt, onSelectPlan, isHighestPlan }) {
  const isCurrentPlan = plan.id === currentPlanId;
  const features = JSON.parse(plan.features ?? '[]');

  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const perLabel = billingCycle === 'yearly' ? '/yr' : '/mo';

  const daysUsed = trialStartedAt
    ? Math.ceil((PAGE_LOAD_NOW - new Date(trialStartedAt).getTime()) / 86_400_000)
    : 0;
  const daysUnused = Math.max(0, 30 - daysUsed);
  const cycleDays = billingCycle === 'yearly' ? 365 : 30;
  const firstPeriodEnd = addDays(new Date(), cycleDays + daysUnused);


  return (
    <Card
      className={cn(
        'flex flex-col gap-0',
        isCurrentPlan && 'ring-2 ring-brand',
        isHighestPlan && !isCurrentPlan && 'ring-2 ring-brand shadow-lg scale-[1.02]'
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <CardDescription className="mt-1 text-sm">{plan.description}</CardDescription>
          </div>
          {isCurrentPlan ? (
            <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
              Current
            </span>
          ) : (
            isHighestPlan && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-foreground">
                <Sparkles className="size-3" /> Recommended
              </span>
            )
          )}
        </div>
        <div className="mt-3">
          <span className="text-3xl font-bold tabular-nums">
            {plan.currency} {Number(price).toLocaleString()}
          </span>
          <span className="ml-1 text-sm text-muted-foreground">{perLabel}</span>
        </div>
        <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
          <p>
            {plan.maxBranches == null ? 'Unlimited' : plan.maxBranches}{' '}
            {plan.maxBranches === 1 ? 'branch' : 'branches'} ·{' '}
            {plan.maxEmployees == null ? 'Unlimited' : plan.maxEmployees} service providers ·{' '}
            {plan.maxBookingsPerMonth == null ? 'Unlimited' : `${plan.maxBookingsPerMonth}/mo`} bookings
          </p>
        </div>
        {isHighestPlan && (
          <p className="mt-2 text-xs font-medium text-brand">
            Go all-in: every feature unlocked, the highest SMS volume, and priority support — built for
            businesses ready to scale without limits.
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        <ul className="space-y-1.5">
          {features.map((key) => {
            const detail = featureDetail(key, plan);
            return (
              <li key={key} className="flex items-center gap-2 text-sm">
                <Check className="size-3.5 shrink-0 text-brand" />
                {FEATURE_LABELS[key] ?? key}
                {detail && <span className="text-muted-foreground">{detail}</span>}
              </li>
            );
          })}
        </ul>

        <div className="mt-auto space-y-2 pt-2">
          {daysUnused > 0 && !isCurrentPlan && (
            <p className="text-[11px] text-muted-foreground">
              {daysUnused} unused trial {daysUnused === 1 ? 'day' : 'days'} credited — first period
              ends {format(firstPeriodEnd, 'd MMM yyyy')}.
            </p>
          )}
          <Button
            className="w-full"
            variant={isCurrentPlan ? 'outline' : isHighestPlan ? 'brand' : 'default'}
            disabled={isCurrentPlan}
            onClick={() => onSelectPlan?.(plan)}
          >
            {isCurrentPlan ? 'Current plan' : isHighestPlan ? 'Upgrade & unlock everything' : 'Select plan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlansGrid({ plans, billingCycle, currentPlanId, trialStartedAt, onSelectPlan }) {
  // "Highest" plan = the one with the most features unlocked, not the
  // highest price — plan prices can be temporarily overridden for payment
  // sandbox testing, but the feature set (Advanced+ is a strict superset of
  // Business+) reliably identifies the top tier either way.
  const featureCount = (plan) => (JSON.parse(plan.features ?? '[]')).length;
  const highestPlanId = plans.reduce(
    (highest, plan) => (highest == null || featureCount(plan) > featureCount(highest) ? plan : highest),
    null
  )?.id;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          billingCycle={billingCycle}
          currentPlanId={currentPlanId}
          trialStartedAt={trialStartedAt}
          onSelectPlan={onSelectPlan}
          isHighestPlan={plan.id === highestPlanId}
        />
      ))}
    </div>
  );
}
