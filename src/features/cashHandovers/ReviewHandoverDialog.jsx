import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cleanPayload } from '@/lib/forms';
import { formatDate } from '@/lib/dateFormat';
import { useReviewCashHandover } from './useCashHandovers';

export default function ReviewHandoverDialog({ open, onOpenChange, handover }) {
  const [reviewNotes, setReviewNotes] = useState('');
  const reviewHandover = useReviewCashHandover();

  const handleOpenChange = (next) => {
    if (!next) setReviewNotes('');
    onOpenChange(next);
  };

  if (!handover) return null;

  const employeeName = `${handover.Employee?.firstName ?? ''} ${handover.Employee?.lastName ?? ''}`.trim() || '—';
  const variance = Number(handover.variance);

  const handleReview = (status) => {
    reviewHandover.mutate(
      { id: handover.id, data: cleanPayload({ status, reviewNotes }) },
      {
        onSuccess: () => {
          toast.success(status === 'reconciled' ? 'Marked as reconciled' : 'Flagged as disputed');
          handleOpenChange(false);
        },
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to review cash handover'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review cash handover</DialogTitle>
          <DialogDescription>
            {employeeName} — {formatDate(handover.periodStart)} –{' '}
            {formatDate(handover.periodEnd)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Expected</dt>
              <dd>
                {handover.currency} {Number(handover.expectedAmount).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Declared</dt>
              <dd>
                {handover.currency} {Number(handover.declaredAmount).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Variance</dt>
              <dd className={variance < 0 ? 'text-destructive' : variance > 0 ? 'text-emerald-600' : ''}>
                {handover.currency} {variance.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Branch</dt>
              <dd>{handover.Branch?.name ?? '—'}</dd>
            </div>
          </dl>
          {handover.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes from {employeeName}</p>
              <p className="text-sm">{handover.notes}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Review notes</label>
            <Textarea
              placeholder="Optional notes"
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={reviewHandover.isPending}
            onClick={() => handleReview('disputed')}
          >
            Flag disputed
          </Button>
          <Button type="button" disabled={reviewHandover.isPending} onClick={() => handleReview('reconciled')}>
            Mark reconciled
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
