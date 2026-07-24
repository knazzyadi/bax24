// src/app/[locale]/(dashboard)/locations/floors/FloorDialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FloorForm } from './FloorForm';
import type { Floor, Building } from './types';

interface FloorDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  editingFloor: Floor | null;
  buildings: Building[];
  isRtl: boolean;
}

export function FloorDialog({
  open,
  onOpenChange,
  editingFloor,
  buildings,
  isRtl,
}: FloorDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {editingFloor
              ? isRtl
                ? 'تعديل دور'
                : 'Edit Floor'
              : isRtl
              ? 'إضافة دور جديد'
              : 'Add New Floor'}
          </DialogTitle>
        </DialogHeader>
        <FloorForm
          editingFloor={editingFloor}
          buildings={buildings}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}