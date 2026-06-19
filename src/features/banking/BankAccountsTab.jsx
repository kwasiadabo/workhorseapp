import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useAuthStore from '@/store/authStore';
import { useBankAccounts, useDeleteBankAccount } from './useBankAccounts';
import BankAccountFormDialog from './BankAccountFormDialog';

const formatMoney = (amount, currency = 'GHS') =>
  `${currency} ${Number(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BankAccountsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('banking.manage');

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useBankAccounts({ page, limit: 20 });
  const deleteAccount = useDeleteBankAccount();

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (account) => { setEditing(account); setFormOpen(true); };

  const handleDelete = () => {
    deleteAccount.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success('Account removed'); setDeleteTarget(null); },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Unable to remove account'),
    });
  };

  const columns = [
    {
      key: 'accountName',
      header: 'Account',
      render: (row) => (
        <div>
          <p className="font-medium">{row.accountName}</p>
          <p className="text-xs text-muted-foreground">{row.accountNumber}</p>
        </div>
      ),
    },
    { key: 'bank', header: 'Bank', render: (row) => row.Bank?.name ?? '—' },
    {
      key: 'accountType',
      header: 'Type',
      render: (row) => <span className="capitalize">{row.accountType}</span>,
    },
    {
      key: 'openingBalance',
      header: 'Opening balance',
      className: 'text-right tabular-nums',
      render: (row) => formatMoney(row.openingBalance, row.currency),
    },
    { key: 'branch', header: 'Branch', render: (row) => row.Branch?.name ?? 'All branches' },
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
          <Button onClick={openCreate} variant="brand"><Plus /> Add account</Button>
        </div>
      )}
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No bank accounts added yet." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <BankAccountFormDialog open={formOpen} onOpenChange={setFormOpen} account={editing} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Remove this account?"
            description={`"${deleteTarget?.accountName}" will be removed. Existing transactions linked to it cannot be deleted this way.`}
            confirmLabel="Remove"
            onConfirm={handleDelete}
            isLoading={deleteAccount.isPending}
          />
        </>
      )}
    </div>
  );
}
