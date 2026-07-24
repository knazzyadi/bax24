// src/app/[locale]/(dashboard)/settings/suppliers/SupplierDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SupplierForm } from "./SupplierForm";
import type { Supplier } from "@/types/suppliers";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (refetch?: boolean) => void;
  supplier: Supplier | null;
  isRtl: boolean;
}

export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  isRtl,
}: SupplierDialogProps) {
  const handleSuccess = () => {
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 shadow-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {supplier
              ? isRtl
                ? "تعديل المورد"
                : "Edit Supplier"
              : isRtl
              ? "إضافة مورد جديد"
              : "Add New Supplier"}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <SupplierForm
            supplier={supplier}
            onSuccess={handleSuccess}
            isRtl={isRtl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}