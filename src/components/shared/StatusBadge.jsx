import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function StatusBadge({ status, variants = {}, icons = {}, className }) {
  const Icon = icons[status];

  return (
    <Badge variant={variants[status] ?? 'secondary'} className={cn('capitalize', className)}>
      {Icon && <Icon data-icon="inline-start" />}
      {status?.replace('_', ' ')}
    </Badge>
  );
}
