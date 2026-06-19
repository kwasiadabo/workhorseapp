import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useAuthStore from '@/store/authStore';
import { useVehicleTypes, useDeleteVehicleType } from './useVehicleTypes';
import VehicleTypeFormDialog from './VehicleTypeFormDialog';

export default function VehicleTypesPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('bookings.manage');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useVehicleTypes({ limit: 100, sort: 'displayOrder' });
  const deleteVehicleType = useDeleteVehicleType();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (vt) => {
    setEditing(vt);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteVehicleType.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Vehicle type deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete vehicle type'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'displayOrder', header: 'Order', className: 'text-right w-20' },
    ...(canManage
      ? [
          {
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
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Types"
        description="Define the vehicle categories your business serves (e.g. Saloon, SUV, Pickup, Truck)."
        actions={
          canManage && (
            <Button onClick={openCreate} variant="brand">
              <Plus /> Add vehicle type
            </Button>
          )
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No vehicle types yet. Add the types your business services."
        />
      </Card>

      <VehicleTypeFormDialog open={formOpen} onOpenChange={setFormOpen} vehicleType={editing} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this vehicle type?"
        description={`"${deleteTarget?.name}" will be removed. Existing bookings that used this type will keep their reference.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteVehicleType.isPending}
      />
    </div>
  );
}
