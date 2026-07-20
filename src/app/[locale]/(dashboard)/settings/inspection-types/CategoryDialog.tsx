// src/app/[locale]/(dashboard)/settings/inspection-types/CategoryDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
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
import type { InspectionCategory } from "./types";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, refetch?: boolean) => void;
  category: InspectionCategory | null;
  isRtl: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  isRtl,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const isEditing = !!category;

  // تعبئة النموذج عند التعديل
  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setNameAr(category.nameAr || "");
      setDescription(category.description || "");
      setIsActive(category.isActive ?? true);
    } else {
      setName("");
      setNameAr("");
      setDescription("");
      setIsActive(true);
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من صحة الإدخال
    if (!name.trim() && !nameAr.trim()) {
      toast.error(isRtl ? "يرجى إدخال الاسم على الأقل بلغة واحدة" : "Please enter at least one language name");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        nameAr: nameAr.trim(),
        description: description.trim(),
        isActive,
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
      onOpenChange(false, true); // إغلاق مع إعادة تحميل البيانات
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onOpenChange(open, false)}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {isEditing
              ? isRtl
                ? "تعديل عنوان الفحص"
                : "Edit Inspection Category"
              : isRtl
              ? "إضافة عنوان فحص جديد"
              : "Add New Inspection Category"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isRtl
              ? "أدخل بيانات العنوان الرئيسي لقوائم الفحص"
              : "Enter the main category data for inspection checklists"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الاسم (إنجليزي)" : "Name (English)"}
            </Label>
            <Input
              id="name"
              placeholder={isRtl ? "مثال: Safety" : "e.g. Safety"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameAr" className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الاسم (عربي)" : "Name (Arabic)"}
            </Label>
            <Input
              id="nameAr"
              placeholder={isRtl ? "مثال: السلامة" : "e.g. Al-Salama"}
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الوصف (اختياري)" : "Description (Optional)"}
            </Label>
            <Textarea
              id="description"
              placeholder={isRtl ? "وصف مختصر لهذا العنوان..." : "Brief description for this category..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500 min-h-[80px]"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="isActive" className="text-slate-700 dark:text-slate-300 cursor-pointer">
              {isRtl ? "حالة التفعيل" : "Active Status"}
            </Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false, false)}
              disabled={loading}
              className="rounded-xl border-slate-300 dark:border-slate-700"
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