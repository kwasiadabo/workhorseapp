import { useState } from 'react';
import { CalendarOff, CheckCircle2, Plus, Pencil, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StatusBadge from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/dateFormat';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAuthStore from '@/store/authStore';
import { useBranches } from '@/features/branches/useBranches';
import { useEmployees, useDeleteEmployee } from './useEmployees';
import { usePositions } from './usePositions';
import EmployeeFormDialog from './EmployeeFormDialog';
import PositionsManagerDialog from './PositionsManagerDialog';

const STATUS_OPTIONS = ['active', 'inactive', 'on_leave'];

const STATUS_VARIANTS = {
  active: 'success',
  inactive: 'outline',
  on_leave: 'warning',
};

const STATUS_ICONS = {
  active: CheckCircle2,
  inactive: XCircle,
  on_leave: CalendarOff,
};

export default function EmployeesPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('employees.manage');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [positionsManagerOpen, setPositionsManagerOpen] = useState(false);

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];
  const branchName = (branchId) => branches.find((b) => b.id === branchId)?.name ?? '—';

  const { data: positionsData } = usePositions({ limit: 100 });
  const positions = positionsData?.data ?? [];
  const positionName = (positionId) => positions.find((p) => p.id === positionId)?.name ?? '—';

  const { data, isLoading, isError } = useEmployees({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    branchId: branchFilter === 'all' ? undefined : branchFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const deleteEmployee = useDeleteEmployee();

  const openCreate = () => {
    setEditingEmployee(null);
    setFormOpen(true);
  };

  const openEdit = (employee) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteEmployee.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Service provider deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete service provider'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
    { key: 'branch', header: 'Branch', render: (row) => branchName(row.branchId) },
    { key: 'position', header: 'Position', render: (row) => positionName(row.positionId) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} variants={STATUS_VARIANTS} icons={STATUS_ICONS} />
      ),
    },
    {
      key: 'hireDate',
      header: 'Hire date',
      render: (row) => (row.hireDate ? formatDate(row.hireDate) : '—'),
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
        title="Service Providers"
        description="Manage your staff roster."
        actions={
          canManage && (
            <>
              <Button variant="outline" onClick={() => setPositionsManagerOpen(true)}>
                Manage positions
              </Button>
              <Button onClick={openCreate} variant="brand">
                <Plus /> Add service provider
              </Button>
            </>
          )
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={branchFilter}
          onValueChange={(value) => {
            setBranchFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Branch">
              {(value) =>
                value === 'all' || !value ? 'All branches' : (branches.find((branch) => branch.id === value)?.name ?? 'Branch')
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
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Status">
              {(value) => (value === 'all' || !value ? 'All statuses' : value.replace('_', ' '))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt} className="capitalize">
                {opt.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No service providers found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={editingEmployee} />
          <PositionsManagerDialog open={positionsManagerOpen} onOpenChange={setPositionsManagerOpen} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete this service provider?"
            description={`This will permanently remove "${deleteTarget?.firstName} ${deleteTarget?.lastName}". This action cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            isLoading={deleteEmployee.isPending}
          />
        </>
      )}
    </div>
  );
}
