// src/app/[locale]/(dashboard)/locations/buildings/BuildingDialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BuildingForm } from './BuildingForm';
import type { Building, Branch } from './types';

interface BuildingDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  editingBuilding: Building | null;
  branches: Branch[];
  isRtl: boolean;
}

export function BuildingDialog({
  open,
  onOpenChange,
  editingBuilding,
  branches,
  isRtl,
}: BuildingDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {editingBuilding
              ? isRtl
                ? 'تعديل مبنى'
                : 'Edit Building'
              : isRtl
              ? 'إضافة مبنى جديد'
              : 'Add New Building'}
          </DialogTitle>
        </DialogHeader>
        <BuildingForm
          editingBuilding={editingBuilding}
          branches={branches}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}