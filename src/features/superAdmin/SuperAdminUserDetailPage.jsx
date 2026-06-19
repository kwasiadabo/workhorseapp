import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserX, UserCheck, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TemporaryPasswordDialog from '@/components/shared/TemporaryPasswordDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { useAdminUser, useUpdateAdminUser, useResetAdminUserPassword } from './useSuperAdminUsers';

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

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

export default function SuperAdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading } = useAdminUser(id);
  const updateUser = useUpdateAdminUser();
  const resetPassword = useResetAdminUserPassword();

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState(null);

  if (isLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  const isOwner = user.role === 'tenant_owner';

  const handleDeactivate = () => {
    updateUser.mutate(
      { id: user.id, data: { isActive: false } },
      {
        onSuccess: () => {
          toast.success('User deactivated');
          setDeactivateOpen(false);
        },
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to deactivate user'),
      }
    );
  };

  const handleReactivate = () => {
    updateUser.mutate(
      { id: user.id, data: { isActive: true } },
      {
        onSuccess: () => toast.success('User reactivated'),
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to reactivate user'),
      }
    );
  };

  const handleResetPassword = () => {
    resetPassword.mutate(user.id, {
      onSuccess: (result) => {
        setResetPasswordOpen(false);
        setTemporaryPassword({ password: result.temporaryPassword, userName: `${user.firstName} ${user.lastName}` });
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to reset password'),
    });
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')} className="w-fit">
        <ArrowLeft /> Back to users
      </Button>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {user.isActive ? (
              <Button variant="destructive" onClick={() => setDeactivateOpen(true)} disabled={isOwner}>
                <UserX /> Deactivate
              </Button>
            ) : (
              <Button variant="outline" onClick={handleReactivate} disabled={updateUser.isPending}>
                <UserCheck /> Reactivate
              </Button>
            )}
            <Button variant="outline" onClick={() => setResetPasswordOpen(true)}>
              <KeyRound /> Reset password
            </Button>
          </div>
        }
      />
      {isOwner && (
        <p className="text-sm text-muted-foreground">
          This user is the tenant owner and can&apos;t be deactivated individually — suspend the tenant instead from{' '}
          <button
            type="button"
            className="underline"
            onClick={() => navigate(`/admin/tenants/${user.tenant?.id}`)}
          >
            its tenant page
          </button>
          .
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone || '—'} />
            <InfoRow
              label="Role"
              value={<Badge variant={ROLE_VARIANTS[user.role] ?? 'outline'}>{ROLE_LABELS[user.role] ?? user.role}</Badge>}
            />
            <InfoRow label="Branch" value={user.branch?.name ?? '—'} />
            <InfoRow
              label="Status"
              value={<Badge variant={user.isActive ? 'default' : 'outline'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant &amp; account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow
              label="Tenant"
              value={
                user.tenant ? (
                  <button type="button" className="underline" onClick={() => navigate(`/admin/tenants/${user.tenant.id}`)}>
                    {user.tenant.name}
                  </button>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow label="Tenant status" value={<span className="capitalize">{user.tenant?.status ?? '—'}</span>} />
            <InfoRow
              label="Last login"
              value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
            />
            <InfoRow label="Must change password" value={user.mustChangePassword ? 'Yes' : 'No'} />
            <InfoRow label="Created" value={formatDate(user.createdAt)} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate this user?"
        description={`"${user.firstName} ${user.lastName}" will no longer be able to log in. You can reactivate them later.`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        isLoading={updateUser.isPending}
      />
      <ConfirmDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        title="Reset this user's password?"
        description={`A new temporary password will be generated for "${user.firstName} ${user.lastName}", their active sessions will be ended, and they'll be required to set a new password on next login.`}
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
    </div>
  );
}
