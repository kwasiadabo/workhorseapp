import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/dateFormat';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useTenants } from './useSuperAdminTenants';
import { useAdminUsers } from './useSuperAdminUsers';

const ROLE_OPTIONS = ['tenant_owner', 'manager', 'receptionist', 'employee'];

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

export default function SuperAdminUsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [tenantId, setTenantId] = useState('all');
  const debouncedSearch = useDebouncedValue(search);

  const { data: tenantsData } = useTenants({ limit: 100 });
  const tenants = tenantsData?.data ?? [];

  const { data, isLoading, isError } = useAdminUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    role: role === 'all' ? undefined : role,
    isActive: status === 'all' ? undefined : status === 'active',
    tenantId: tenantId === 'all' ? undefined : tenantId,
  });

  const columns = [
    { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
    { key: 'email', header: 'Email', render: (row) => row.email },
    { key: 'tenant', header: 'Tenant', render: (row) => row.tenant?.name ?? '—' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant={ROLE_VARIANTS[row.role] ?? 'outline'}>{ROLE_LABELS[row.role] ?? row.role}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'default' : 'outline'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last login',
      render: (row) => (row.lastLoginAt ? formatDateTime(row.lastLoginAt) : 'Never'),
    },
  ];

  return (
    <div>
      <PageHeader title="Users" description="All user accounts across every tenant on the platform." />
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
          value={tenantId}
          onValueChange={(value) => {
            setTenantId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Tenant">
              {(value) =>
                value === 'all' || !value ? 'All tenants' : (tenants.find((tenant) => tenant.id === value)?.name ?? 'Tenant')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tenants</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value);
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
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {ROLE_LABELS[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border">
        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          isError={isError}
          onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
          emptyMessage="No users found."
        />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
