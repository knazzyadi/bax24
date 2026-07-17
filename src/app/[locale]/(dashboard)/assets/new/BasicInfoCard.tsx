// src/app/[locale]/(dashboard)/assets/new/BasicInfoCard.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, FileText } from "lucide-react";
import type { NewAssetFormData } from "./types";

interface BasicInfoCardProps {
  formData: NewAssetFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  t: any;
}

export function BasicInfoCard({ formData, handleChange, t }: BasicInfoCardProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
          <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("basicInfo")}
        </h2>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("name")} <span className="text-rose-500">*</span>
          </Label>
          <Input
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            placeholder={t("namePlaceholder")}
            required
            className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-indigo-400" />
            {t("nameEn")}
          </Label>
          <Input
            name="nameEn"
            value={formData.nameEn || ""}
            onChange={handleChange}
            placeholder={t("nameEnPlaceholder")}
            className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("description")}
          </Label>
          <Textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder={t("descriptionPlaceholder")}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}