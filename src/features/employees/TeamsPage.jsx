import { useState } from 'react';
import { CheckCircle2, Plus, Pencil, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StatusBadge from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAuthStore from '@/store/authStore';
import { useBranches } from '@/features/branches/useBranches';
import { useTeams, useDeleteTeam } from './useTeams';
import TeamFormDialog from './TeamFormDialog';

const STATUS_VARIANTS = { active: 'success', inactive: 'outline' };
const STATUS_ICONS = { active: CheckCircle2, inactive: XCircle };

export default function TeamsPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('employees.manage');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];
  const branchName = (branchId) => branches.find((b) => b.id === branchId)?.name ?? '—';

  const { data, isLoading, isError } = useTeams({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    branchId: branchFilter === 'all' ? undefined : branchFilter,
  });
  const deleteTeam = useDeleteTeam();

  const openCreate = () => {
    setEditingTeam(null);
    setFormOpen(true);
  };

  const openEdit = (team) => {
    setEditingTeam(team);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteTeam.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Team deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete team'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'branch', header: 'Branch', render: (row) => branchName(row.branchId) },
    {
      key: 'members',
      header: 'Members',
      render: (row) =>
        row.members?.length
          ? row.members.map((m) => `${m.firstName} ${m.lastName}`).join(', ')
          : '—',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.isActive ? 'active' : 'inactive'} variants={STATUS_VARIANTS} icons={STATUS_ICONS} />
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
        title="Teams"
        description="Group service providers into teams for services that need more than one attendant."
        actions={
          canManage && (
            <Button onClick={openCreate} variant="brand">
              <Plus /> Add team
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name..."
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
      </div>
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No teams found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <TeamFormDialog open={formOpen} onOpenChange={setFormOpen} team={editingTeam} />
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete this team?"
            description={`This will permanently remove "${deleteTarget?.name}". It will no longer be available as a staffing shortcut on bookings.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            isLoading={deleteTeam.isPending}
          />
        </>
      )}
    </div>
  );
}
