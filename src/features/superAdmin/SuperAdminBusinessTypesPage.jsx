import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useBusinessTypes, useDeleteBusinessType } from './useSuperAdminBusinessTypes';
import BusinessTypeFormDialog from './BusinessTypeFormDialog';

export default function SuperAdminBusinessTypesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebouncedValue(search);
  const { data, isLoading, isError } = useBusinessTypes({
    page,
    limit: 20,
    sort: 'displayOrder',
    search: debouncedSearch || undefined,
  });
  const deleteType = useDeleteBusinessType();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteType.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Business type deleted');
        setDeleteTarget(null);
      },
      onError: (error) =>
        toast.error(error?.response?.data?.message ?? 'Unable to delete business type'),
    });
  };

  const columns = [
    { key: 'label', header: 'Label' },
    { key: 'value', header: 'Value', render: (row) => <code className="text-xs">{row.value}</code> },
    { key: 'displayOrder', header: 'Order' },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'inactive'}
          variants={{ active: 'success', inactive: 'secondary' }}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)}>
            <Pencil />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(row)}>
            <Trash2 />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Types"
        description="Manage the business types tenants can choose at registration."
        actions={
          <Button onClick={openCreate} variant="brand">
            <Plus /> Add type
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search types..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-xl border">
        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No business types found."
        />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      <BusinessTypeFormDialog open={formOpen} onOpenChange={setFormOpen} businessType={editing} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this business type?"
        description={`Deleting "${deleteTarget?.label}" will remove it from the platform. Existing tenants of this type are unaffected.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteType.isPending}
      />
    </div>
  );
}
