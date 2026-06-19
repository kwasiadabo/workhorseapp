import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAuthStore from '@/store/authStore';
import { useServiceCategories } from './useServiceCategories';
import { useServices, useDeleteService } from './useServices';
import ServiceFormDialog from './ServiceFormDialog';

export default function ServicesTab() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const businessType = useAuthStore((state) => state.user?.businessType);
  const canManage = hasPermission('services.manage');
  const isCarWash = businessType === 'car_wash';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: categoriesData } = useServiceCategories({ limit: 100 });
  const categories = categoriesData?.data ?? [];
  const categoryName = (categoryId) => categories.find((c) => c.id === categoryId)?.name ?? 'Uncategorized';

  const { data, isLoading, isError } = useServices({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
    isActive: statusFilter === 'all' ? undefined : statusFilter,
  });
  const deleteService = useDeleteService();

  const openCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const openEdit = (service) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteService.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Service deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete service'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category', render: (row) => categoryName(row.categoryId) },
    { key: 'duration', header: 'Duration', render: (row) => `${row.durationMinutes} min` },
    {
      key: 'price',
      header: 'Price',
      render: (row) => {
        if (isCarWash && row.vehiclePrices?.length > 0) {
          const prices = row.vehiclePrices.map((vp) => Number(vp.price));
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          return min === max
            ? `${row.currency} ${min.toFixed(2)}`
            : `${row.currency} ${min.toFixed(2)} – ${max.toFixed(2)}`;
        }
        return `${row.currency} ${Number(row.price).toFixed(2)}`;
      },
    },
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-xs"
          />
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Category">
                {(value) =>
                  value === 'all' || !value
                    ? 'All categories'
                    : (categories.find((category) => category.id === value)?.name ?? 'Category')
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
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-36">
              <SelectValue placeholder="Status">
                {(value) => ({ all: 'All statuses', true: 'Active', false: 'Inactive' })[value] ?? 'Status'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button onClick={openCreate} variant="brand">
            <Plus /> Add service
          </Button>
        )}
      </div>
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No services found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} service={editingService} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete this service?"
            description={`This will permanently remove "${deleteTarget?.name}". This action cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            isLoading={deleteService.isPending}
          />
        </>
      )}
    </div>
  );
}
