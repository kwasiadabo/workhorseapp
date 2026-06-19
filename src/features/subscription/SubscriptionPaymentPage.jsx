import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { ArrowLeft, Lock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { subscriptionApi } from './subscription.api';

export default function SubscriptionPaymentPage({ plan, billingCycle, trialStartedAt, onBack }) {
  const [isPending, setIsPending] = useState(false);

  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const perLabel = billingCycle === 'yearly' ? 'year' : 'month';

  const daysUsed = trialStartedAt
    ? Math.ceil((Date.now() - new Date(trialStartedAt).getTime()) / 86_400_000)
    : 0;
  const daysUnused = Math.max(0, 30 - daysUsed);
  const cycleDays = billingCycle === 'yearly' ? 365 : 30;
  const firstPeriodEnd = addDays(new Date(), cycleDays + daysUnused);

  const handlePay = async () => {
    setIsPending(true);
    try {
      const { authorization_url } = await subscriptionApi.initializePayment({
        planId: plan.id,
        billingCycle,
      });
      window.location.href = authorization_url;
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Could not initiate payment. Please try again.');
      setIsPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to plans
      </button>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        {/* Paystack checkout redirect */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Secure payment via Paystack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              You'll be taken to Paystack's secure checkout to complete your payment. Paystack
              supports card, Mobile Money, and bank transfers.
            </p>

            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {plan.currency} {Number(price).toLocaleString()} / {perLabel}
                </span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handlePay} disabled={isPending}>
              {isPending ? (
                'Redirecting to payment…'
              ) : (
                <>
                  Pay with Paystack
                  <ExternalLink className="ml-2 size-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Order summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                Order summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between font-medium">
                <span>{plan.name}</span>
                <span>{plan.currency} {Number(price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Billing cycle</span>
                <span className="capitalize">{perLabel}ly</span>
              </div>
              {daysUnused > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Trial credit</span>
                  <span>+{daysUnused} days</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total due today</span>
                <span>{plan.currency} {Number(price).toLocaleString()}</span>
              </div>
              {daysUnused > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  First period ends {format(firstPeriodEnd, 'd MMM yyyy')}.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Secured by Paystack
          </div>
        </div>
      </div>
    </div>
  );
}
