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
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {status
              ? isRtl
                ? "تعديل الحالة"
                : "Edit Status"
              : isRtl
              ? "إضافة حالة جديدة"
              : "Add New Status"}
          </DialogTitle>
        </DialogHeader>
        <WorkOrderStatusForm
          status={status}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}