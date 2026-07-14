// src/app/[locale]/(dashboard)/settings/work-order-priorities/WorkOrderPriorityDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkOrderPriorityForm } from "./WorkOrderPriorityForm";
import type { WorkOrderPriority } from "@/types/work-orders";

interface WorkOrderPriorityDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  priority: WorkOrderPriority | null;
  isRtl: boolean;
}

export function WorkOrderPriorityDialog({
  open,
  onOpenChange,
  priority,
  isRtl,
}: WorkOrderPriorityDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {priority
              ? isRtl
                ? "تعديل الأولوية"
                : "Edit Priority"
              : isRtl
              ? "إضافة أولوية جديدة"
              : "Add New Priority"}
          </DialogTitle>
        </DialogHeader>
        <WorkOrderPriorityForm
          priority={priority}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}