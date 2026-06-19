import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAuthStore from '@/store/authStore';
import { useBranches, useDeleteBranch } from './useBranches';
import BranchFormDialog from './BranchFormDialog';

export default function BranchesPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('branches.manage');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useBranches({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });
  const deleteBranch = useDeleteBranch();

  const openCreate = () => {
    setEditingBranch(null);
    setFormOpen(true);
  };

  const openEdit = (branch) => {
    setEditingBranch(branch);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteBranch.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Branch deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete branch'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'city', header: 'City', render: (row) => row.city || '—' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    { key: 'email', header: 'Email', render: (row) => row.email || '—' },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <Badge variant={row.isActive ? 'default' : 'outline'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>,
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
            <Pencil />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(row)}>
            <Trash2 />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Branches"
        description="Manage your business locations."
        actions={
          canManage && (
            <Button onClick={openCreate} variant="brand">
              <Plus /> Add branch
            </Button>
          )
        }
      />
      <div className="mb-4">
        <Input
          placeholder="Search by name or city..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
      </div>
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No branches found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <BranchFormDialog open={formOpen} onOpenChange={setFormOpen} branch={editingBranch} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete this branch?"
            description={`This will permanently remove "${deleteTarget?.name}". This action cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            isLoading={deleteBranch.isPending}
          />
        </>
      )}
    </div>
  );
}
