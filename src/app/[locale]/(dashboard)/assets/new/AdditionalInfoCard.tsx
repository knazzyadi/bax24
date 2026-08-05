// src/app/[locale]/(dashboard)/assets/new/AdditionalInfoCard.tsx

"use client";

import type React from "react";

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
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (field: string, value: string) => void;
  suppliers: {
    id: string;
    name: string;
    nameEn?: string;
  }[];
  t: (key: string) => string;
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
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-cyan-50 p-2 dark:bg-cyan-950/40">
          <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </div>

        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("additionalDetails")}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("serialNumber")}
          </Label>

          <Input
            name="serialNumber"
            value={formData.serialNumber || ""}
            onChange={handleChange}
            placeholder={t("serialNumberPlaceholder")}
            className="h-12 rounded-xl border-slate-200 bg-white/50 px-4 text-base transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
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
            className="h-12 rounded-xl border-slate-200 bg-white/50 px-4 text-base transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
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
            className="h-12 rounded-xl border-slate-200 bg-white/50 px-4 text-base transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Truck className="h-4 w-4 text-indigo-400" />
            {t("supplier")}
          </Label>

          <Select
            value={formData.supplierId || ""}
            onValueChange={(value) =>
              handleSelectChange("supplierId", value)
            }
          >
            <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white/50 px-4 transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50">
              <SelectValue placeholder={t("selectSupplier")} />
            </SelectTrigger>

            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="none">
                {t("noSupplier")}
              </SelectItem>

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