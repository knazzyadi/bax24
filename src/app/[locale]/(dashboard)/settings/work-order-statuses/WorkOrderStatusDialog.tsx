// src/app/[locale]/(dashboard)/settings/work-order-statuses/WorkOrderStatusDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkOrderStatusForm } from "./WorkOrderStatusForm";
import type { WorkOrderStatus } from "@/types/work-orders";

interface WorkOrderStatusDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  status: WorkOrderStatus | null;
  isRtl: boolean;
}

export function WorkOrderStatusDialog({
  open,
  onOpenChange,
  status,
  isRtl,
}: WorkOrderStatusDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 shadow-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {status
              ? isRtl
                ? "تعديل حالة أمر العمل"
                : "Edit Work Order Status"
              : isRtl
              ? "إضافة حالة أمر عمل جديدة"
              : "Add New Work Order Status"}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <WorkOrderStatusForm
            status={status}
            onSuccess={handleSuccess}
            isRtl={isRtl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}