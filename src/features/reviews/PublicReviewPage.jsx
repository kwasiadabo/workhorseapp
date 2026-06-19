import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const schema = z.object({
  stars: z.number().int().min(1, 'Please select a star rating').max(5),
  comment: z.string().max(1000).optional().or(z.literal('')),
});

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-colors"
        >
          <Star
            className={`size-8 ${n <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function PublicReviewPage() {
  const { token } = useParams();
  const [submitted, setSubmitted] = useState(false);

  const { data: review, isLoading, isError } = useQuery({
    queryKey: ['public-review', token],
    queryFn: () => api.get(`/public/review/${token}`).then((r) => r.data.data),
    retry: false,
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { stars: 0, comment: '' },
  });

  const submit = useMutation({
    mutationFn: (values) => api.post(`/public/review/${token}`, values).then((r) => r.data),
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Unable to submit review'),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center p-8">
          <p className="text-muted-foreground">This review link is invalid or has already been used.</p>
        </Card>
      </div>
    );
  }

  if (submitted || review?.tokenUsedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="mb-4 text-5xl">⭐</div>
          <h2 className="text-xl font-semibold mb-2">Thank you for your review!</h2>
          <p className="text-muted-foreground">Your feedback helps {review?.Tenant?.name ?? 'the business'} improve.</p>
        </Card>
      </div>
    );
  }

  const tenantName = review?.Tenant?.name ?? 'the business';
  const bookingRef = review?.Booking?.bookingNumber;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {review?.Tenant?.logoUrl && (
            <img src={review.Tenant.logoUrl} alt={tenantName} className="mx-auto mb-3 h-12 object-contain" />
          )}
          <CardTitle>How was your visit?</CardTitle>
          <CardDescription>
            Leave a review for {tenantName}
            {bookingRef ? ` — booking ${bookingRef}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="space-y-5">
              <FormField
                control={form.control}
                name="stars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your rating</FormLabel>
                    <FormControl>
                      <StarPicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about your experience…" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submit.isPending}>
                {submit.isPending ? 'Submitting…' : 'Submit review'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
