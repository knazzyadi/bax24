// src/app/[locale]/(dashboard)/settings/suppliers/SupplierDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SupplierForm } from "./SupplierForm";
import type { Supplier } from "@/types/assets";

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
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {supplier ? (isRtl ? "تعديل المورد" : "Edit Supplier") : (isRtl ? "إضافة مورد جديد" : "Add New Supplier")}
          </DialogTitle>
        </DialogHeader>
        <SupplierForm
          supplier={supplier}
          onSuccess={handleSuccess}
          isRtl={isRtl}
        />
      </DialogContent>
    </Dialog>
  );
}