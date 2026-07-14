// src/app/[locale]/(dashboard)/settings/asset-statuses/AssetStatusDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetStatusForm } from "./AssetStatusForm";
import type { AssetStatus } from "@/types/assets";

interface AssetStatusDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  status: AssetStatus | null;
  isRtl: boolean;
}

export function AssetStatusDialog({
  open,
  onOpenChange,
  status,
  isRtl,
}: AssetStatusDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {status ? (isRtl ? "تعديل الحالة" : "Edit Status") : (isRtl ? "إضافة حالة جديدة" : "Add New Status")}
          </DialogTitle>
        </DialogHeader>
        <AssetStatusForm
          status={status}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}