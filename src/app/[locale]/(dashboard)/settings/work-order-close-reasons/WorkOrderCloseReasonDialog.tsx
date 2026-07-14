// src/app/[locale]/(dashboard)/settings/work-order-close-reasons/WorkOrderCloseReasonDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkOrderCloseReasonForm } from "./WorkOrderCloseReasonForm";
import type { WorkOrderCloseReason } from "@/types/work-orders";

interface WorkOrderCloseReasonDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  reason: WorkOrderCloseReason | null;
  isRtl: boolean;
}

export function WorkOrderCloseReasonDialog({
  open,
  onOpenChange,
  reason,
  isRtl,
}: WorkOrderCloseReasonDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {reason ? (isRtl ? "تعديل سبب الإغلاق" : "Edit Close Reason") : (isRtl ? "إضافة سبب إغلاق جديد" : "Add New Close Reason")}
          </DialogTitle>
        </DialogHeader>
        <WorkOrderCloseReasonForm
          reason={reason}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}