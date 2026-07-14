// src/app/[locale]/(dashboard)/settings/work-order-types/WorkOrderTypeDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkOrderTypeForm } from "./WorkOrderTypeForm";
import type { WorkOrderType } from "@/types/work-orders";

interface WorkOrderTypeDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  type: WorkOrderType | null;
  isRtl: boolean;
}

export function WorkOrderTypeDialog({
  open,
  onOpenChange,
  type,
  isRtl,
}: WorkOrderTypeDialogProps) {
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
        <WorkOrderTypeForm
          type={type}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}