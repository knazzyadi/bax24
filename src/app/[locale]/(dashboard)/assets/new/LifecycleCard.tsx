// src/app/[locale]/(dashboard)/assets/new/LifecycleCard.tsx

"use client";

import type React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ShieldCheck, Wrench, Clock } from "lucide-react";

import type { NewAssetFormData } from "./types";

interface LifecycleCardProps {
  formData: NewAssetFormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  t: (key: string) => string;
}

export function LifecycleCard({
  formData,
  handleChange,
  t,
}: LifecycleCardProps) {
  return (
    <div className="space-y-5">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2 dark:bg-blue-950/40">
          <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>

        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("lifecycle")}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Calendar className="h-4 w-4 text-indigo-400" />
            {t("purchaseDate")}
          </Label>

          <Input
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate || ""}
            onChange={handleChange}
            className="h-12 rounded-xl border-slate-200 bg-white/50 px-4 transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Clock className="h-4 w-4 text-amber-400" />
            {t("operationDate")}
          </Label>

          <Input
            name="operationDate"
            type="date"
            value={formData.operationDate || ""}
            onChange={handleChange}
            className="h-12 rounded-xl border-slate-200 bg-white/50 px-4 transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            {t("warrantyEnd")}
          </Label>

          <Input
            name="warrantyEnd"
            type="date"
            value={formData.warrantyEnd || ""}
            onChange={handleChange}
            className="h-12 rounded-xl border-slate-200 bg-white/50 px-4 transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Wrench className="h-4 w-4 text-rose-400" />
            {t("lastMaintenance")}
          </Label>

          <Input
            name="lastMaintenanceDate"
            type="date"
            value={formData.lastMaintenanceDate || ""}
            onChange={handleChange}
            className="h-12 rounded-xl border-slate-200 bg-white/50 px-4 transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
          />

          <p className="text-xs italic text-slate-400 dark:text-slate-500">
            {t("lastMaintenanceHint")}
          </p>
        </div>
      </div>
    </div>
  );
}