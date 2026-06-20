import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatCard({ label, value, icon: Icon, isLoading, sub, colorClass = '' }) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon className="size-4" />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <p className={`truncate text-2xl font-semibold tabular-nums ${colorClass}`} title={typeof value === 'string' ? value : undefined}>
          {value}
        </p>
      )}
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
