// src/app/[locale]/(dashboard)/locations/rooms/RoomDialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RoomForm } from './RoomForm';
import type { Room, Floor } from './types';

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  editingRoom: Room | null;
  floors: Floor[];
  isRtl: boolean;
}

export function RoomDialog({
  open,
  onOpenChange,
  editingRoom,
  floors,
  isRtl,
}: RoomDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {editingRoom
              ? isRtl
                ? 'تعديل غرفة'
                : 'Edit Room'
              : isRtl
              ? 'إضافة غرفة جديدة'
              : 'Add New Room'}
          </DialogTitle>
        </DialogHeader>
        <RoomForm
          editingRoom={editingRoom}
          floors={floors}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}