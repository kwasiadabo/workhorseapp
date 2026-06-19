import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, CheckCircle2, PauseCircle, Sparkles } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/dateFormat';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useTenants } from './useSuperAdminTenants';

const STATUS_OPTIONS = ['trial', 'active', 'suspended', 'cancelled'];

const STATUS_VARIANTS = {
  trial: 'info',
  active: 'success',
  suspended: 'warning',
  cancelled: 'destructive',
};

const STATUS_ICONS = {
  trial: Sparkles,
  active: CheckCircle2,
  suspended: PauseCircle,
  cancelled: Ban,
};

const businessTypeLabel = (value) =>
  value
    ?.split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

export default function SuperAdminTenantsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError } = useTenants({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
  });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug', className: 'text-muted-foreground' },
    { key: 'businessType', header: 'Type', render: (row) => businessTypeLabel(row.businessType) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} variants={STATUS_VARIANTS} icons={STATUS_ICONS} />
      ),
    },
    { key: 'plan', header: 'Plan', render: (row) => row.Plan?.name ?? '—' },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div>
      <PageHeader title="Tenants" description="All businesses registered on the platform." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name, email or slug..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt} className="capitalize">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border">
        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          isError={isError}
          onRowClick={(row) => navigate(`/admin/tenants/${row.id}`)}
          emptyMessage="No tenants found."
        />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
