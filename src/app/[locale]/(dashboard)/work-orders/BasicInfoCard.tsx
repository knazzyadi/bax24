// src/app/[locale]/(dashboard)/work-orders/shared/BasicInfoCard.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkOrderSourceSelector } from "../components/SourceSelector";
import type { WorkOrderFormData } from "../types";
import { Info } from "lucide-react";

interface BasicInfoCardProps {
  formData: WorkOrderFormData;
  setFormData: (data: WorkOrderFormData) => void;
  priorities: any[];
  statuses?: any[];
  workOrderTypes: any[];
  isRtl: boolean;
  t: any;
  isSourceEditable?: boolean; // ✅ صلاحية تعديل المصدر
}

export function BasicInfoCard({
  formData,
  setFormData,
  priorities,
  statuses = [],
  workOrderTypes,
  isRtl,
  t,
  isSourceEditable = false, // القيمة الافتراضية false
}: BasicInfoCardProps) {
  // ✅ رسالة توضيحية بناءً على المصدر
  const getSourceHelperText = () => {
    if (formData.source === "manual") {
      return isRtl ? "تم إنشاء هذا الأمر يدوياً" : "Manually created work order";
    }
    if (formData.source === "ticket") {
      return isRtl ? "تم تحويل هذا الأمر من بلاغ" : "Converted from a ticket";
    }
    if (formData.source === "pm") {
      return isRtl ? "ناتج عن خطة صيانة وقائية" : "Generated from PM plan";
    }
    if (formData.source === "checklist") {
      return isRtl ? "ناتج عن قائمة فحص" : "Generated from checklist";
    }
    return "";
  };

  return (
    <div className="space-y-5">
      {/* الصف الأول: مصدر أمر العمل + نوع أمر العمل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <WorkOrderSourceSelector
            value={formData.source}
            onChange={(value) => setFormData({ ...formData, source: value })}
            isRtl={isRtl}
            disabled={!isSourceEditable} // ✅ تعطيل إذا لم يكن مسموحاً
          />
          {!isSourceEditable && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Info className="h-3.5 w-3.5" />
              <span>{getSourceHelperText()}</span>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("type")} <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(v) => setFormData({ ...formData, type: v as any })}
          >
            <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
              <SelectValue placeholder={t("selectType")} />
            </SelectTrigger>
            <SelectContent>
              {workOrderTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {isRtl ? type.name : type.nameEn || type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* العنوان */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("title")} <span className="text-rose-500">*</span>
        </Label>
        <Input
          value={formData.title ?? ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t("titlePlaceholder")}
          className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
        />
      </div>

      {/* الوصف */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("description")}
        </Label>
        <Textarea
          value={formData.description ?? ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[100px]"
        />
      </div>

      {/* الصف الرابع: أولوية أمر العمل + حالة أمر العمل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("workOrderPriority")} <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.priorityId ?? ""}
            onValueChange={(v) => setFormData({ ...formData, priorityId: v })}
          >
            <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
              <SelectValue placeholder={t("selectPriority")} />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || "#94a3b8" }} />
                    {isRtl ? p.name : p.nameEn || p.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("workOrderStatus")}
          </Label>
          <Select
            value={formData.statusId ?? ""}
            onValueChange={(v) => setFormData({ ...formData, statusId: v })}
          >
            <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
              <SelectValue placeholder={t("selectStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("noStatus")}</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || "#94a3b8" }} />
                    {isRtl ? s.name : s.nameEn || s.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* سبب الإنشاء */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("reasonForCreation")}
        </Label>
        <Input
          value={formData.reason ?? ""}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder={t("reasonForCreation")}
          className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
        />
      </div>
    </div>
  );
}