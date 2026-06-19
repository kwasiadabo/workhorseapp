import { useMemo, useState } from 'react';
import { format, startOfMonth, subDays } from 'date-fns';
import { Plus, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import FormattedDateInput from '@/components/shared/FormattedDateInput';
import { Card } from '@/components/ui/card';
import useAuthStore from '@/store/authStore';
import { useBankAccounts } from './useBankAccounts';
import { useBankTransactions, useDeleteBankTransaction } from './useBankTransactions';
import BankTransactionFormDialog from './BankTransactionFormDialog';

const formatMoney = (amount) =>
  Number(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = format(new Date(), 'yyyy-MM-dd');
const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

export default function BankTransactionsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('banking.manage');

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState('deposit');
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [accountFilter, setAccountFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);

  const { data: accountsData } = useBankAccounts({ limit: 100 });
  const accounts = accountsData?.data ?? [];

  const queryParams = useMemo(() => ({
    page,
    limit: 25,
    bankAccountId: accountFilter === 'all' ? undefined : accountFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [page, accountFilter, typeFilter, startDate, endDate]);

  const { data, isLoading, isError } = useBankTransactions(queryParams);
  const deleteTx = useDeleteBankTransaction();

  const openCreate = (type) => { setDefaultType(type); setEditing(null); setFormOpen(true); };
  const openEdit = (tx) => { setEditing(tx); setFormOpen(true); };

  const handleDelete = () => {
    deleteTx.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success('Transaction deleted'); setDeleteTarget(null); },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Unable to delete transaction'),
    });
  };

  // Compute totals from current page (approximate — full totals come from the report page)
  const transactions = data?.data ?? [];
  const pageDeposits = transactions.filter((t) => t.type === 'deposit').reduce((sum, t) => sum + Number(t.amount), 0);
  const pageWithdrawals = transactions.filter((t) => t.type === 'withdrawal').reduce((sum, t) => sum + Number(t.amount), 0);

  const columns = [
    {
      key: 'transactionDate',
      header: 'Date',
      render: (row) => row.transactionDate,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) =>
        row.type === 'deposit' ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
            <ArrowDownToLine className="mr-1 size-3" />Deposit
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400">
            <ArrowUpFromLine className="mr-1 size-3" />Withdrawal
          </Badge>
        ),
    },
    {
      key: 'account',
      header: 'Account',
      render: (row) => (
        <div>
          <p className="font-medium">{row.BankAccount?.accountName ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.BankAccount?.Bank?.name ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right tabular-nums font-medium',
      render: (row) => (
        <span className={row.type === 'deposit' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
          {row.type === 'withdrawal' ? '−' : '+'}{formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: 'referenceNumber',
      header: 'Reference',
      render: (row) => row.referenceNumber || '—',
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => row.description || '—',
    },
    {
      key: 'recorder',
      header: 'Recorded by',
      render: (row) =>
        row.recorder ? `${row.recorder.firstName} ${row.recorder.lastName}` : '—',
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
    <div className="space-y-6">
      <PageHeader
        title="Bank Transactions"
        description="Record and track deposits and withdrawals across all bank accounts."
        actions={
          canManage && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openCreate('withdrawal')}>
                <ArrowUpFromLine /> Record withdrawal
              </Button>
              <Button onClick={() => openCreate('deposit')} variant="brand">
                <ArrowDownToLine /> Record deposit
              </Button>
            </div>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={accountFilter}
          onValueChange={(v) => { setAccountFilter(v); setPage(1); }}
          items={[{ value: 'all', label: 'All accounts' }, ...accounts.map((a) => ({ value: a.id, label: a.accountName }))]}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.accountName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue>{typeFilter === 'all' ? 'All types' : typeFilter === 'deposit' ? 'Deposits' : 'Withdrawals'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
            <SelectItem value="withdrawal">Withdrawals</SelectItem>
          </SelectContent>
        </Select>

        <FormattedDateInput
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="w-42"
        />
        <FormattedDateInput
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="w-42"
        />
      </div>

      {/* Page summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 gap-1">
          <p className="text-sm text-muted-foreground">Deposits (this page)</p>
          <p className="text-xl font-semibold tabular-nums text-green-700 dark:text-green-400">+{formatMoney(pageDeposits)}</p>
        </Card>
        <Card className="p-4 gap-1">
          <p className="text-sm text-muted-foreground">Withdrawals (this page)</p>
          <p className="text-xl font-semibold tabular-nums text-red-700 dark:text-red-400">−{formatMoney(pageWithdrawals)}</p>
        </Card>
        <Card className="p-4 gap-1">
          <p className="text-sm text-muted-foreground">Net (this page)</p>
          <p className={`text-xl font-semibold tabular-nums ${pageDeposits - pageWithdrawals >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {pageDeposits - pageWithdrawals >= 0 ? '+' : '−'}{formatMoney(Math.abs(pageDeposits - pageWithdrawals))}
          </p>
        </Card>
      </div>

      <div className="rounded-xl border">
        <DataTable
          columns={columns}
          data={transactions}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No transactions found for the selected filters."
        />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <BankTransactionFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            transaction={editing}
            defaultType={defaultType}
          />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete this transaction?"
            description="This action cannot be undone. The bank balance will be recalculated."
            confirmLabel="Delete"
            onConfirm={handleDelete}
            isLoading={deleteTx.isPending}
          />
        </>
      )}
    </div>
  );
}
