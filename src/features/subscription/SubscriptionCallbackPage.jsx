import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { subscriptionApi } from './subscription.api';
import { refresh } from '@/features/auth/auth.api';
import useAuthStore from '@/store/authStore';

export default function SubscriptionCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [detail, setDetail] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const verify = async () => {
      const reference = searchParams.get('reference');
      if (!reference) {
        setErrorMessage('No payment reference found in the URL.');
        setStatus('error');
        return;
      }

      try {
        const data = await subscriptionApi.verifyPayment({ reference });
        try {
          const authData = await refresh();
          setAuth(authData);
        } catch {
          // non-fatal; subscription status updates on next page load / token refresh
        }
        setDetail(data);
        setStatus('success');
      } catch (err) {
        setErrorMessage(
          err?.response?.data?.message ?? 'Payment verification failed. Please contact support.',
        );
        setStatus('error');
      }
    };

    verify();
  }, [searchParams, setAuth]);

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying your payment…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto text-center">
        <CheckCircle2 className="size-12 text-green-500" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Payment successful</h2>
          <p className="text-sm text-muted-foreground">
            {detail?.planName ? (
              <>
                Your <span className="font-medium text-foreground">{detail.planName}</span> subscription
                is now active.
              </>
            ) : (
              'Your subscription is now active.'
            )}
            {detail?.periodEnd && (
              <> Next billing date: {format(new Date(detail.periodEnd), 'd MMM yyyy')}.</>
            )}
          </p>
          {detail?.daysUnused > 0 && (
            <p className="text-sm text-muted-foreground">
              {detail.daysUnused} unused trial{' '}
              {detail.daysUnused === 1 ? 'day was' : 'days were'} credited to your billing period.
            </p>
          )}
        </div>
        <Button onClick={() => navigate('/app/subscription')}>View subscription</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto text-center">
      <XCircle className="size-12 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Payment verification failed</h2>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      </div>
      <Button variant="outline" onClick={() => navigate('/app/subscription')}>
        Back to subscription
      </Button>
    </div>
  );
}
