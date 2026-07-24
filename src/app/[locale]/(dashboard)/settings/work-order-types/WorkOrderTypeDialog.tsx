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
      <DialogContent className="sm:max-w-[520px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 shadow-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {type
              ? isRtl
                ? "تعديل نوع أمر العمل"
                : "Edit Work Order Type"
              : isRtl
              ? "إضافة نوع أمر عمل جديد"
              : "Add New Work Order Type"}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <WorkOrderTypeForm
            type={type}
            onSuccess={handleSuccess}
            isRtl={isRtl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}