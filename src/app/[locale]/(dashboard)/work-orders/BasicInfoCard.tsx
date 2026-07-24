// src/app/[locale]/(dashboard)/work-orders/BasicInfoCard.tsx
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
import { WorkOrderSourceSelector } from "./SourceSelector";
import type { WorkOrderFormData } from "./types";
import { Info } from "lucide-react";

interface BasicInfoCardProps {
  formData: WorkOrderFormData;
  setFormData: (data: WorkOrderFormData) => void;
  priorities: any[];
  statuses?: any[];
  workOrderTypes: any[];
  isRtl: boolean;
  t: any;
  isSourceEditable?: boolean;
}

export function BasicInfoCard({
  formData,
  setFormData,
  priorities,
  statuses = [],
  workOrderTypes,
  isRtl,
  t,
  isSourceEditable = false,
}: BasicInfoCardProps) {
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

  // دالة مساعدة لعرض اسم النوع مع الكود (مثل باقي المكونات)
  const getTypeDisplay = (type: any) => {
    const name = isRtl ? type.name : (type.nameEn || type.name);
    return type.code ? `${type.code}. ${name}` : name;
  };

  // دالة مساعدة لعرض الأولوية مع اللون
  const getPriorityDisplay = (priority: any) => {
    return isRtl ? priority.name : (priority.nameEn || priority.name);
  };

  return (
    <div className="space-y-5">
      {/* الصف الأول: مصدر أمر العمل + نوع أمر العمل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <WorkOrderSourceSelector
            value={formData.source}
            onChange={(value) => setFormData({ ...formData, source: value })}
            isRtl={isRtl}
            disabled={!isSourceEditable}
          />
          {!isSourceEditable && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              <Info className="h-3.5 w-3.5" />
              <span>{getSourceHelperText()}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            {t("type")} <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.workOrderTypeId || ""}
            onValueChange={(v) => setFormData({ ...formData, workOrderTypeId: v })}
          >
            <SelectTrigger className="h-12 w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/60 transition-all px-4 text-slate-800 dark:text-slate-100">
              <SelectValue placeholder={t("selectType")} />
            </SelectTrigger>
            <SelectContent>
              {workOrderTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {getTypeDisplay(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* العنوان */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          {t("title")} <span className="text-rose-500">*</span>
        </Label>
        <Input
          value={formData.title ?? ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t("titlePlaceholder")}
          className="h-12 w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/60 transition-all text-base px-4 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {/* الوصف */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("description")}
        </Label>
        <Textarea
          value={formData.description ?? ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/60 transition-all p-4 min-h-[120px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {/* الصف الرابع: أولوية أمر العمل + حالة أمر العمل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            {t("workOrderPriority")} <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.priorityId ?? ""}
            onValueChange={(v) => setFormData({ ...formData, priorityId: v })}
          >
            <SelectTrigger className="h-12 w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/60 transition-all px-4 text-slate-800 dark:text-slate-100">
              <SelectValue placeholder={t("selectPriority")} />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-200 dark:border-slate-600"
                      style={{ backgroundColor: p.color || "#94a3b8" }}
                    />
                    <span className="text-slate-700 dark:text-slate-200">
                      {getPriorityDisplay(p)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("workOrderStatus")}
          </Label>
          <Select
            value={formData.statusId ?? ""}
            onValueChange={(v) => setFormData({ ...formData, statusId: v })}
          >
            <SelectTrigger className="h-12 w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/60 transition-all px-4 text-slate-800 dark:text-slate-100">
              <SelectValue placeholder={t("selectStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                <span className="text-slate-400 dark:text-slate-500">
                  {t("noStatus")}
                </span>
              </SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-200 dark:border-slate-600"
                      style={{ backgroundColor: s.color || "#94a3b8" }}
                    />
                    <span className="text-slate-700 dark:text-slate-200">
                      {isRtl ? s.name : (s.nameEn || s.name)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* سبب الإنشاء */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("reasonForCreation")}
        </Label>
        <Input
          value={formData.reason ?? ""}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder={t("reasonForCreation")}
          className="h-12 w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/60 transition-all text-base px-4 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}