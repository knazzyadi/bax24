// src/app/[locale]/(dashboard)/assets/new/AdditionalInfoCard.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Truck } from "lucide-react";
import type { NewAssetFormData } from "./types";

interface AdditionalInfoCardProps {
  formData: NewAssetFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: string, value: string) => void;
  suppliers: { id: string; name: string; nameEn?: string }[];
  t: any;
}

export function AdditionalInfoCard({
  formData,
  handleChange,
  handleSelectChange,
  suppliers,
  t,
}: AdditionalInfoCardProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40">
          <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("additionalDetails")}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("serialNumber")}
          </Label>
          <Input
            name="serialNumber"
            value={formData.serialNumber || ""}
            onChange={handleChange}
            placeholder={t("serialNumberPlaceholder")}
            className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("manufacturer")}
          </Label>
          <Input
            name="manufacturer"
            value={formData.manufacturer || ""}
            onChange={handleChange}
            placeholder={t("manufacturerPlaceholder")}
            className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("model")}
          </Label>
          <Input
            name="model"
            value={formData.model || ""}
            onChange={handleChange}
            placeholder={t("modelPlaceholder")}
            className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-indigo-400" />
            {t("supplier")}
          </Label>
          <Select
            value={formData.supplierId || ""}
            onValueChange={(v) => handleSelectChange("supplierId", v)}
          >
            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
              <SelectValue placeholder={t("selectSupplier")} />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="">{t("noSupplier")}</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}