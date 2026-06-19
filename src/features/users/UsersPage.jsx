import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, UserX, UserCheck, KeyRound, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TemporaryPasswordDialog from '@/components/shared/TemporaryPasswordDialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAuthStore from '@/store/authStore';
import { useBranches } from '@/features/branches/useBranches';
import { useUsers, useDeactivateUser, useUpdateUser, useResetUserPassword } from './useUsers';
import UserFormDialog from './UserFormDialog';

const ROLE_OPTIONS = ['manager', 'receptionist', 'employee'];

const ROLE_LABELS = {
  tenant_owner: 'Owner',
  manager: 'Manager',
  receptionist: 'Receptionist',
  employee: 'Service Provider',
};

const ROLE_VARIANTS = {
  tenant_owner: 'default',
  manager: 'secondary',
  receptionist: 'outline',
  employee: 'outline',
};

export default function UsersPage() {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('users.manage');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState(null);

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const { data, isLoading, isError } = useUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    branchId: branchFilter === 'all' ? undefined : branchFilter,
  });
  const deactivateUser = useDeactivateUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetUserPassword();

  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleDeactivate = () => {
    deactivateUser.mutate(deactivateTarget.id, {
      onSuccess: () => {
        toast.success('User deactivated');
        setDeactivateTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to deactivate user'),
    });
  };

  const handleReactivate = (user) => {
    updateUser.mutate(
      { id: user.id, data: { isActive: true } },
      {
        onSuccess: () => toast.success('User reactivated'),
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to reactivate user'),
      }
    );
  };

  const handleResetPassword = () => {
    resetPassword.mutate(resetPasswordTarget.id, {
      onSuccess: (result) => {
        setResetPasswordTarget(null);
        setTemporaryPassword({
          password: result.temporaryPassword,
          userName: `${resetPasswordTarget.firstName} ${resetPasswordTarget.lastName}`,
        });
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to reset password'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
    { key: 'email', header: 'Email', render: (row) => row.email },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant={ROLE_VARIANTS[row.role] ?? 'outline'}>{ROLE_LABELS[row.role] ?? row.role}</Badge>
      ),
    },
    { key: 'branch', header: 'Branch', render: (row) => row.branch?.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'default' : 'outline'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => {
        const isOwner = row.role === 'tenant_owner';
        const isSelf = row.id === currentUserId;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/app/users/${row.id}`)}>
              <Eye />
              <span className="sr-only">View</span>
            </Button>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(row)} disabled={isOwner}>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  {row.isActive ? (
                    <DropdownMenuItem
                      onClick={() => setDeactivateTarget(row)}
                      disabled={isOwner || isSelf}
                      variant="destructive"
                    >
                      <UserX /> Deactivate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleReactivate(row)}>
                      <UserCheck /> Reactivate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setResetPasswordTarget(row)} disabled={isSelf}>
                    <KeyRound /> Reset password
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage staff logins, roles and branch assignments."
        actions={
          canManage && (
            <Button onClick={openCreate} variant="brand">
              <Plus /> Add user
            </Button>
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
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Role">
              {(value) => (value === 'all' || !value ? 'All roles' : (ROLE_LABELS[value] ?? value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No users found." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>

      {canManage && (
        <>
          <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />
          <ConfirmDialog
            open={Boolean(deactivateTarget)}
            onOpenChange={(open) => !open && setDeactivateTarget(null)}
            title="Deactivate this user?"
            description={`"${deactivateTarget?.firstName} ${deactivateTarget?.lastName}" will no longer be able to log in. You can reactivate them later.`}
            confirmLabel="Deactivate"
            onConfirm={handleDeactivate}
            isLoading={deactivateUser.isPending}
          />
          <ConfirmDialog
            open={Boolean(resetPasswordTarget)}
            onOpenChange={(open) => !open && setResetPasswordTarget(null)}
            title="Reset this user's password?"
            description={`A new temporary password will be generated for "${resetPasswordTarget?.firstName} ${resetPasswordTarget?.lastName}", their active sessions will be ended, and they'll be required to set a new password on next login.`}
            confirmLabel="Reset password"
            variant="default"
            onConfirm={handleResetPassword}
            isLoading={resetPassword.isPending}
          />
          <TemporaryPasswordDialog
            open={Boolean(temporaryPassword)}
            onOpenChange={(open) => !open && setTemporaryPassword(null)}
            password={temporaryPassword?.password}
            userName={temporaryPassword?.userName}
          />
        </>
      )}
    </div>
  );
}
