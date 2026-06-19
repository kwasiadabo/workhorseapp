import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/dateFormat';
import { useBranches } from '@/features/branches/useBranches';
import { useExpenseCategories } from './useExpenseCategories';
import { useExpenses, useDeleteExpense } from './useExpenses';
import ExpenseFormDialog from './ExpenseFormDialog';

export default function ExpensesTab() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('expenses.manage');

  const [page, setPage] = useState(1);
  const [branchFilter, setBranchFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const { data: categoriesData } = useExpenseCategories({ limit: 100 });
  const categories = categoriesData?.data ?? [];

  const { data, isLoading, isError } = useExpenses({
    page,
    limit: 20,
    branchId: branchFilter === 'all' ? undefined : branchFilter,
    categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const deleteExpense = useDeleteExpense();

  const openCreate = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteExpense.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Expense deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete expense'),
    });
  };

  const columns = [
    { key: 'expenseDate', header: 'Date', render: (row) => formatDate(row.expenseDate) },
    { key: 'branch', header: 'Branch', render: (row) => row.Branch?.name ?? '—' },
    { key: 'category', header: 'Category', render: (row) => row.ExpenseCategory?.name ?? '—' },
    { key: 'description', header: 'Description', render: (row) => row.description || '—' },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      render: (row) => `${row.currency} ${Number(row.amount).toFixed(2)}`,
    },
    {
      key: 'recorder',
      header: 'Recorded by',
      render: (row) => (row.recorder ? `${row.recorder.firstName} ${row.recorder.lastName}` : '—'),
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Select
            value={branchFilter}
            onValueChange={(value) => {
              setBranchFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Branch">
                {(value) =>
                  value === 'all' || !value
                    ? 'All branches'
                    : (branches.find((b) => b.id === value)?.name ?? 'Branch')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category">
                {(value) =>
                  value === 'all' || !value
                    ? 'All categories'
                    : (categories.find((c) => c.id === value)?.name ?? 'Category')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
            aria-label="From date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
            aria-label="To date"
          />
        </div>
        {canManage && (
          <Button onClick={openCreate} variant="brand">
            <Plus /> Add expense
          </Button>
        )}
      </div>
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No expenses found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} expense={editingExpense} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete this expense?"
            description={`This will permanently remove the ${deleteTarget?.ExpenseCategory?.name ?? ''} expense of ${deleteTarget?.currency} ${Number(deleteTarget?.amount ?? 0).toFixed(2)}. This action cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            isLoading={deleteExpense.isPending}
          />
        </>
      )}
    </div>
  );
}
