import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import api from '@/lib/axios';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function StarDisplay({ stars }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`size-3.5 ${n <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
      ))}
    </div>
  );
}

const COLUMNS = [
  {
    key: 'stars',
    header: 'Rating',
    render: (row) => <StarDisplay stars={row.stars} />,
  },
  {
    key: 'customer',
    header: 'Client',
    render: (row) => row.Customer?.name ?? '—',
  },
  {
    key: 'comment',
    header: 'Comment',
    render: (row) => row.comment || <span className="text-muted-foreground">No comment</span>,
  },
  {
    key: 'booking',
    header: 'Booking',
    render: (row) => row.Booking?.bookingNumber ?? '—',
  },
  {
    key: 'date',
    header: 'Submitted',
    render: (row) =>
      row.tokenUsedAt ? formatDistanceToNow(new Date(row.tokenUsedAt), { addSuffix: true }) : '—',
  },
];

export default function ReviewsPage() {
  const [page, setPage] = useState(1);

  const { data: summary } = useQuery({
    queryKey: ['reviews', 'summary'],
    queryFn: () => api.get('/reviews/summary').then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page],
    queryFn: () => api.get('/reviews', { params: { page, limit: 20 } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Reviews" description="See what clients say about your business." />

      <div className="flex gap-4">
        <Card className="flex items-center gap-3 p-4 min-w-[160px]">
          {summary ? (
            <>
              <div>
                <p className="text-muted-foreground text-xs">Average rating</p>
                <p className="text-2xl font-bold">{summary.avgStars ?? '—'}</p>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <StarDisplay stars={Math.round(Number(summary.avgStars ?? 0))} />
                <span className="text-muted-foreground text-xs">{summary.total} reviews</span>
              </div>
            </>
          ) : (
            <Skeleton className="h-12 w-32" />
          )}
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable
          columns={COLUMNS}
          data={data?.data}
          isLoading={isLoading}
          emptyMessage="No reviews yet."
        />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </Card>
    </div>
  );
}
