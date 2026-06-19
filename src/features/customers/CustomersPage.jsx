import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAuthStore from '@/store/authStore';
import { useCustomers, useDeleteCustomer } from './useCustomers';
import CustomerFormDialog from './CustomerFormDialog';

export default function CustomersPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('customers.manage');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useCustomers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });
  const deleteCustomer = useDeleteCustomer();

  const openCreate = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteCustomer.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Client deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete client'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    { key: 'email', header: 'Email', render: (row) => row.email || '—' },
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
        title="Clients"
        description="Manage your client records."
        actions={
          canManage && (
            <Button onClick={openCreate} variant="brand">
              <Plus /> Add client
            </Button>
          )
        }
      />
      <div className="mb-4">
        <Input
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
      </div>
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No clients found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editingCustomer} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete this client?"
            description={`This will permanently remove "${deleteTarget?.name}". This action cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            isLoading={deleteCustomer.isPending}
          />
        </>
      )}
    </div>
  );
}
