// src/app/[locale]/(dashboard)/settings/work-order-cancel-reasons/WorkOrderCancelReasonDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkOrderCancelReasonForm } from "./WorkOrderCancelReasonForm";
import type { WorkOrderCancelReason } from "@/types/work-orders";

interface WorkOrderCancelReasonDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  reason: WorkOrderCancelReason | null;
  isRtl: boolean;
}

export function WorkOrderCancelReasonDialog({
  open,
  onOpenChange,
  reason,
  isRtl,
}: WorkOrderCancelReasonDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {reason ? (isRtl ? "تعديل سبب الإلغاء" : "Edit Cancel Reason") : (isRtl ? "إضافة سبب إلغاء جديد" : "Add New Cancel Reason")}
          </DialogTitle>
        </DialogHeader>
        <WorkOrderCancelReasonForm
          reason={reason}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}