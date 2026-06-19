import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const CASH_HANDOVER_STATUSES = ['submitted', 'reconciled', 'disputed'];

export const REVIEW_STATUSES = ['reconciled', 'disputed'];

export const CASH_HANDOVER_STATUS_VARIANTS = {
  submitted: 'warning',
  reconciled: 'success',
  disputed: 'destructive',
};

export const CASH_HANDOVER_STATUS_ICONS = {
  submitted: Clock,
  reconciled: CheckCircle2,
  disputed: AlertTriangle,
};

// Local "YYYY-MM-DD" -> UTC start/end-of-day ISO strings, so a one-day period
// covers every payment recorded that day regardless of time of day.
export const toPeriodStart = (dateStr) => `${dateStr}T00:00:00.000`;
export const toPeriodEnd = (dateStr) => `${dateStr}T23:59:59.999`;

export const todayDateInput = () => new Date().toISOString().slice(0, 10);
