// src/app/[locale]/(dashboard)/maintenance/BasicInfoSection.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import type {
  MaintenanceFormData,
  SetMaintenanceFormData,
  FrequencyType,
} from "./types";
import { getFrequencyLabel, getFrequencyOptions } from "./utils";

interface BasicInfoSectionProps {
  formData: MaintenanceFormData;
  setFormData: SetMaintenanceFormData;
  isRtl: boolean;
  t: (key: string) => string;
}

export function BasicInfoSection({
  formData,
  setFormData,
  isRtl,
  t,
}: BasicInfoSectionProps) {
  // دوال مساعدة
  const handleStartDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, startDate: value }));
  };

  const handleIsActiveChange = (value: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: value }));
  };

  // ✅ الحصول على خيارات التردد (بما فيها CUSTOM)
  const frequencyOptions = getFrequencyOptions(isRtl);

  // ✅ التحقق مما إذا كان التردد المحدد هو CUSTOM
  const isCustomFrequency = formData.frequency === "CUSTOM";

  // ✅ الحصول على التسمية المناسبة للتردد لعرضها في الـ Select
  const selectedFrequencyLabel = getFrequencyLabel(formData.frequency, isRtl);

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
          <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder={t("namePlaceholder")}
            className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* ✅ عمود التردد */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("frequency")}
            </Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  frequency: value as FrequencyType,
                }))
              }
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                <SelectValue placeholder={t("selectFrequency")}>
                  {selectedFrequencyLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* ✅ عرض الفترة التوضيحية بناءً على التردد (غير مخصص) */}
            {!isCustomFrequency && formData.frequency !== "CUSTOM" && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {isRtl ? "كل " : "Every "}
                {formData.frequency === "MONTHLY" && (isRtl ? "شهر" : "month")}
                {formData.frequency === "QUARTERLY" && (isRtl ? "3 أشهر" : "3 months")}
                {formData.frequency === "SEMI_ANNUAL" && (isRtl ? "6 أشهر" : "6 months")}
                {formData.frequency === "YEARLY" && (isRtl ? "سنة" : "year")}
              </p>
            )}
          </div>

          {/* ✅ عمود أيام التحضير المسبق (يظهر دائماً) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("leadDays")}
            </Label>
            <Input
              type="number"
              min={0}
              value={formData.leadDays}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  leadDays: parseInt(e.target.value) || 0,
                }))
              }
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* ✅ حقل الأيام (يظهر فقط عند اختيار CUSTOM) */}
          {isCustomFrequency && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t("customFrequencyDays") || "عدد الأيام بين الصيانة"}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.frequencyDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    frequencyDays: parseInt(e.target.value) || 0,
                  }))
                }
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                placeholder={isRtl ? "مثال: 45" : "e.g. 45"}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {isRtl ? "أدخل عدد الأيام بين كل صيانة وأخرى" : "Enter the number of days between each maintenance"}
              </p>
            </div>
          )}

          {/* ✅ عمود تاريخ البدء */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("startDate")}
            </Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {t("startDateHint")}
            </p>
          </div>
        </div>

        {/* ✅ حالة النشاط */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-700/30">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleIsActiveChange(e.target.checked)}
            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-600"
          />
          <Label
            htmlFor="isActive"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {t("active")}
          </Label>
        </div>
      </div>
    </>
  );
}