import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/store/authStore';
import { useExpenseCategories, useDeleteExpenseCategory } from './useExpenseCategories';
import ExpenseCategoryFormDialog from './ExpenseCategoryFormDialog';

export default function ExpenseCategoriesTab() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('expenses.manage');

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useExpenseCategories({ page, limit: 20, sort: 'displayOrder' });
  const deleteCategory = useDeleteExpenseCategory();

  const openCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Category deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete category'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'displayOrder', header: 'Order' },
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
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openCreate} variant="brand">
            <Plus /> Add category
          </Button>
        </div>
      )}
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No categories found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <ExpenseCategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete this category?"
            description={`This will permanently remove "${deleteTarget?.name}". Expenses in this category will become uncategorized.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            isLoading={deleteCategory.isPending}
          />
        </>
      )}
    </div>
  );
}
