// src/app/[locale]/(dashboard)/settings/inspection-types/CategoryDialog.tsx
"use client";

import { useState, useCallback, } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { InspectionCategory, InspectionTemplate } from "./types";

// ============================================================
// ✅ دالة مساعدة لتهيئة البيانات
// ============================================================
const getInitialFormData = (
  category: InspectionCategory | null,
  templateId?: string
) => ({
  templateId: category?.templateId ?? templateId ?? "",
  code: category?.code ?? "",
  name: category?.name ?? "",
  nameAr: category?.nameAr ?? "",
  description: category?.description ?? "",
  isActive: category?.isActive ?? true,
});

// ============================================================
// المكون الرئيسي
// ============================================================
interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, refetch?: boolean) => void;
  category: InspectionCategory | null;
  templateId?: string;
  templates: InspectionTemplate[];
  isRtl: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  templateId,
  templates,
  isRtl,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;

  // ✅ استخدام useState مع دالة initializer
  const [formData, setFormData] = useState(() =>
    getInitialFormData(category, templateId)
  );

  // ✅ دالة معالجة فتح/إغلاق النافذة (بدون تعديل البيانات، لأن useEffect يتولى ذلك)
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!loading) {
        onOpenChange(newOpen, false);
      }
    },
    [loading, onOpenChange]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.templateId) {
      toast.error(isRtl ? "يرجى اختيار نموذج الفحص" : "Please select a template");
      return;
    }
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error(isRtl ? "الكود والاسم مطلوبان" : "Code and name are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        templateId: formData.templateId,
        code: formData.code.trim(),
        name: formData.name.trim(),
        nameAr: formData.nameAr.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
      };

      const url = isEditing
        ? `/api/inspection-categories/${category.id}`
        : "/api/inspection-categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشل الحفظ");
      }

      toast.success(isEditing ? "تم التحديث بنجاح" : "تمت الإضافة بنجاح");
      onOpenChange(false, true);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : (isRtl ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {isEditing
              ? isRtl
                ? "تعديل فئة الفحص"
                : "Edit Inspection Category"
              : isRtl
              ? "إضافة فئة فحص جديدة"
              : "Add New Inspection Category"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isRtl
              ? "أدخل بيانات الفئة ضمن نموذج الفحص"
              : "Enter category data within the inspection template"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* اختيار نموذج الفحص */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "نموذج الفحص *" : "Inspection Template *"}
            </Label>
            <select
              name="templateId"
              value={formData.templateId}
              onChange={handleChange}
              className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-4 focus:ring-2 focus:ring-indigo-500/50"
              required
            >
              <option value="">{isRtl ? "اختر النموذج" : "Select template"}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {isRtl ? t.nameAr || t.name : t.name}
                </option>
              ))}
            </select>
          </div>

          {/* الكود */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الكود *" : "Code *"}
            </Label>
            <Input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder={isRtl ? "مثال: SAF-01" : "e.g. SAF-01"}
              className="rounded-xl font-mono uppercase"
              dir="ltr"
            />
          </div>

          {/* الاسم (إنجليزي) */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الاسم (إنجليزي) *" : "Name (English) *"}
            </Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={isRtl ? "مثال: Fire Safety" : "e.g. Fire Safety"}
              className="rounded-xl"
              dir="ltr"
            />
          </div>

          {/* الاسم (عربي) */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الاسم (عربي)" : "Name (Arabic)"}
            </Label>
            <Input
              name="nameAr"
              value={formData.nameAr}
              onChange={handleChange}
              placeholder={isRtl ? "مثال: السلامة من الحرائق" : "e.g. Fire Safety"}
              className="rounded-xl"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الوصف (اختياري)" : "Description (Optional)"}
            </Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={isRtl ? "وصف مختصر لهذه الفئة..." : "Brief description for this category..."}
              className="rounded-xl min-h-[80px]"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          {/* حالة التفعيل */}
          <div className="flex items-center justify-between pt-2">
            <Label className="text-slate-700 dark:text-slate-300 cursor-pointer">
              {isRtl ? "حالة التفعيل" : "Active Status"}
            </Label>
            <Switch
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="rounded-xl"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
            >
              {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              {isEditing
                ? isRtl
                  ? "تحديث"
                  : "Update"
                : isRtl
                ? "إضافة"
                : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}