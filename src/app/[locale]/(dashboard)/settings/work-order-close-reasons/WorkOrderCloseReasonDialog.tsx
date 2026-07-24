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
      <DialogContent className="sm:max-w-[520px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 shadow-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {reason
              ? isRtl
                ? "تعديل سبب الإغلاق"
                : "Edit Close Reason"
              : isRtl
              ? "إضافة سبب إغلاق جديد"
              : "Add New Close Reason"}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <WorkOrderCloseReasonForm
            reason={reason}
            onSuccess={handleSuccess}
            isRtl={isRtl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}