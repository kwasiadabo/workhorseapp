import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePositions, useDeletePosition } from './usePositions';
import PositionFormDialog from './PositionFormDialog';

export default function PositionsManagerDialog({ open, onOpenChange }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = usePositions({ limit: 100, sort: 'displayOrder' });
  const deletePosition = useDeletePosition();

  const openCreate = () => {
    setEditingPosition(null);
    setFormOpen(true);
  };

  const openEdit = (position) => {
    setEditingPosition(position);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deletePosition.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Position deleted');
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to delete position'),
    });
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'displayOrder', header: 'Order' },
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
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage positions</DialogTitle>
          <DialogDescription>
            Set up the roles your staff can be assigned to (e.g. Barber, Receptionist, Manager).
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={openCreate} variant="brand">
            <Plus /> Add position
          </Button>
        </div>
        <div className="rounded-xl border">
          <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No positions yet." />
        </div>

        <PositionFormDialog open={formOpen} onOpenChange={setFormOpen} position={editingPosition} />
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete this position?"
          description={`This will permanently remove "${deleteTarget?.name}". Service providers with this position will become unassigned.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={deletePosition.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
