import { useState } from 'react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, PauseCircle, Ban } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useAuthStore from '@/store/authStore';
import { usePlans } from './usePlans';
import { useSubscription } from './useSubscription';
import PlansGrid from './PlansGrid';
import SubscriptionPaymentPage from './SubscriptionPaymentPage';

const STATUS_CONFIG = {
  trialing: { label: 'Free trial', variant: 'outline', icon: Clock },
  active: { label: 'Active', variant: 'default', icon: CheckCircle2 },
  expired: { label: 'Trial expired', variant: 'destructive', icon: Ban },
  past_due: { label: 'Past due', variant: 'destructive', icon: PauseCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: Ban },
  suspended: { label: 'Suspended', variant: 'destructive', icon: PauseCircle },
};

const ERROR_REDIRECT_CODES = new Set(['ACCOUNT_SUSPENDED', 'ACCOUNT_CANCELLED']);

function RedirectReasonBanner({ message, code }) {
  const isError = ERROR_REDIRECT_CODES.has(code);
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
        isError
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400'
      }`}
    >
      <AlertTriangle className="size-4 shrink-0" />
      {message}
    </div>
  );
}

function TrialCountdown({ trialEndsAt }) {
  const end = new Date(trialEndsAt);
  const now = new Date();
  const daysLeft = differenceInDays(end, now);
  const hoursLeft = differenceInHours(end, now) % 24;

  if (end <= now) {
    return <span className="text-destructive font-medium">Expired</span>;
  }

  return (
    <span>
      {daysLeft > 0 && (
        <span className="font-semibold tabular-nums">{daysLeft}d </span>
      )}
      {(daysLeft < 3 || daysLeft === 0) && (
        <span className="font-semibold tabular-nums">{hoursLeft}h </span>
      )}
      remaining
    </span>
  );
}

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  // Lazy-init (not an effect) — this is a one-time synchronous read of
  // sessionStorage on mount, not a subscription to an external system.
  const [redirectReason] = useState(() => {
    const raw = sessionStorage.getItem('subscriptionRedirectReason');
    if (!raw) return null;
    sessionStorage.removeItem('subscriptionRedirectReason');
    try {
      const parsed = JSON.parse(raw);
      return parsed?.message ? parsed : null;
    } catch {
      return null;
    }
  });
  const subscriptionStatus = useAuthStore((s) => s.user?.subscriptionStatus);
  const trialEndsAt = useAuthStore((s) => s.user?.trialEndsAt);
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('tenant_owner');

  const { data: sub, isLoading: subLoading } = useSubscription();
  const { data: plans = [], isLoading: plansLoading } = usePlans();

  const statusConf = STATUS_CONFIG[subscriptionStatus] ?? STATUS_CONFIG.trialing;
  const StatusIcon = statusConf.icon;

  const isTrialing = subscriptionStatus === 'trialing';
  const isActive = subscriptionStatus === 'active';

  if (selectedPlan) {
    return (
      <SubscriptionPaymentPage
        plan={selectedPlan}
        billingCycle={billingCycle}
        trialStartedAt={sub?.trialStartedAt}
        onBack={() => setSelectedPlan(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscription"
        description="Manage your plan and billing."
      />

      {redirectReason && <RedirectReasonBanner message={redirectReason.message} code={redirectReason.code} />}

      {/* Current subscription status */}
      {subLoading ? (
        <Skeleton className="h-36" />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4 text-muted-foreground" />
                  {sub?.plan?.name ?? 'Free trial'}
                </CardTitle>
                <CardDescription>
                  {isActive && sub?.currentPeriodEnd
                    ? `Renews on ${format(new Date(sub.currentPeriodEnd), 'd MMM yyyy, h:mm a')}`
                    : isTrialing && trialEndsAt
                    ? `Trial ends on ${format(new Date(trialEndsAt), 'd MMM yyyy')} at ${format(new Date(trialEndsAt), 'h:mm a')}`
                    : null}
                </CardDescription>
              </div>
              <Badge variant={statusConf.variant} className="flex items-center gap-1 shrink-0">
                <StatusIcon className="size-3" />
                {statusConf.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {isTrialing && trialEndsAt && (
                <>
                  <div>
                    <dt className="text-muted-foreground">Trial started</dt>
                    <dd className="mt-0.5 font-medium">
                      {sub?.trialStartedAt ? format(new Date(sub.trialStartedAt), 'd MMM yyyy') : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Trial expires</dt>
                    <dd className="mt-0.5 font-medium">
                      {format(new Date(trialEndsAt), 'd MMM yyyy, h:mm a')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Time remaining</dt>
                    <dd className="mt-0.5 font-medium">
                      <TrialCountdown trialEndsAt={trialEndsAt} />
                    </dd>
                  </div>
                </>
              )}
              {isActive && sub && (
                <>
                  <div>
                    <dt className="text-muted-foreground">Billing cycle start</dt>
                    <dd className="mt-0.5 font-medium">
                      {format(new Date(sub.currentPeriodStart), 'd MMM yyyy')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Next renewal</dt>
                    <dd className="mt-0.5 font-medium">
                      {format(new Date(sub.currentPeriodEnd), 'd MMM yyyy')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Trial days credited</dt>
                    <dd className="mt-0.5 font-medium">{sub.trialSkipped ? 'Yes' : 'No'}</dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Plan selection — only tenant_owner can activate; all can view */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Available plans</h2>
            <p className="text-sm text-muted-foreground">
              {isTrialing
                ? 'Subscribe now and your unused trial days will be credited to your first billing period.'
                : 'Upgrade or change your plan at any time.'}
            </p>
          </div>

          {/* Billing cycle toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
            {['monthly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  billingCycle === cycle
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                {cycle === 'yearly' && (
                  <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                    Save ~17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {plansLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80" />)}
          </div>
        ) : (
          <PlansGrid
            plans={plans}
            billingCycle={billingCycle}
            currentPlanId={isActive ? sub?.planId : null}
            trialStartedAt={sub?.trialStartedAt}
            onSelectPlan={canManage ? (plan) => setSelectedPlan(plan) : undefined}
          />
        )}

        {!canManage && (
          <p className="text-center text-sm text-muted-foreground">
            Only the account owner can change the subscription plan.
          </p>
        )}
      </div>
    </div>
  );
}
