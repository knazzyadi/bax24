// src/app/[locale]/(dashboard)/settings/asset-types/AssetTypeDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetTypeForm } from "./AssetTypeForm";
import type { AssetType } from "@/types/assets";

interface AssetTypeDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  type: AssetType | null;
  isRtl: boolean;
}

export function AssetTypeDialog({
  open,
  onOpenChange,
  type,
  isRtl,
}: AssetTypeDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {type ? (isRtl ? "تعديل النوع" : "Edit Type") : (isRtl ? "إضافة نوع جديد" : "Add New Type")}
          </DialogTitle>
        </DialogHeader>
        <AssetTypeForm
          type={type}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}