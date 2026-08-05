// src/app/[locale]/(dashboard)/settings/work-order-priorities/WorkOrderPriorityForm.tsx
"use client";

import { useState } from "react"; // ✅ حذف useEffect من الاستيراد
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPickerField } from "@/components/shared/form/ColorPickerField";
import { Loader2 } from "lucide-react";
import type { WorkOrderPriority } from "@/types/work-orders";

interface WorkOrderPriorityFormProps {
  priority: WorkOrderPriority | null;
  onSuccess: () => void;
  isRtl: boolean;
}

export function WorkOrderPriorityForm({
  priority,
  onSuccess,
  isRtl,
}: WorkOrderPriorityFormProps) {
  const t = useTranslations("WorkOrderPriorities");
  const [loading, setLoading] = useState(false);

  // ✅ دالة القيم الافتراضية
  const getInitialFormData = () => ({
    name: priority?.name ?? "",
    nameEn: priority?.nameEn ?? "",
    color: priority?.color ?? "#6B7280",
    isDefault: priority?.isDefault ?? false,
    isActive: priority?.isActive ?? true,
  });

  // ✅ تعريف state باستخدام الدالة
  const [formData, setFormData] = useState(getInitialFormData);

  // ✅ تم حذف useEffect بالكامل

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleColorChange = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        color: formData.color,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      };

      const url = priority
        ? `/api/work-order-priorities/${priority.id}`
        : "/api/work-order-priorities";
      const method = priority ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      toast.success(priority ? t("updateSuccess") : t("createSuccess"));
      onSuccess();
        } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("saveError");

      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("name")} <span className="text-rose-500">*</span>
        </Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل اسم الأولوية" : "Enter priority name"}
          required
          className="h-12 rounded-2xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("nameEn")}
        </Label>
        <Input
          name="nameEn"
          value={formData.nameEn}
          onChange={handleChange}
          placeholder={isRtl ? "الاسم بالإنجليزية" : "Name in English"}
          className="h-12 rounded-2xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      <ColorPickerField
        label={t("color")}
        value={formData.color}
        onChange={handleColorChange}
      />

      <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          <Checkbox
            id="isDefault"
            checked={formData.isDefault}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, isDefault: !!checked }))
            }
            className="h-5 w-5 rounded-lg border-slate-300 dark:border-slate-600 data-[state=checked]:bg-indigo-600"
          />
          <Label htmlFor="isDefault" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            {t("setAsDefault")}
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, isActive: !!checked }))
            }
            className="h-5 w-5 rounded-lg border-slate-300 dark:border-slate-600 data-[state=checked]:bg-emerald-600"
          />
          <Label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            {t("active")}
          </Label>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          className="flex-1 h-12 rounded-2xl border-slate-300/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all"
        >
          {isRtl ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {priority ? (isRtl ? "تحديث" : "Update") : (isRtl ? "حفظ" : "Save")}
        </Button>
      </div>
    </form>
  );
}