import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useAuthStore from '@/store/authStore';
import { useBanks, useDeleteBank } from './useBanks';
import BankFormDialog from './BankFormDialog';

export default function BanksTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('banking.manage');

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useBanks({ page, limit: 20, sort: 'displayOrder' });
  const deleteBank = useDeleteBank();

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (bank) => { setEditing(bank); setFormOpen(true); };

  const handleDelete = () => {
    deleteBank.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success('Bank removed'); setDeleteTarget(null); },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Unable to remove bank'),
    });
  };

  const columns = [
    { key: 'name', header: 'Bank name' },
    { key: 'shortCode', header: 'Short code', render: (row) => row.shortCode || '—' },
    { key: 'displayOrder', header: 'Order' },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)}>
            <Pencil /><span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(row)}>
            <Trash2 /><span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    });
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openCreate} variant="brand"><Plus /> Add bank</Button>
        </div>
      )}
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No banks added yet." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <BankFormDialog open={formOpen} onOpenChange={setFormOpen} bank={editing} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Remove this bank?"
            description={`"${deleteTarget?.name}" will be removed. Existing accounts linked to it will not be affected.`}
            confirmLabel="Remove"
            onConfirm={handleDelete}
            isLoading={deleteBank.isPending}
          />
        </>
      )}
    </div>
  );
}
