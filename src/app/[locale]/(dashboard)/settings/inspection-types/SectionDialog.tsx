// src/app/[locale]/(dashboard)/settings/inspection-types/SectionDialog.tsx
"use client";

import { useEffect, useState } from "react";
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
import type { InspectionSection } from "./types";

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, refetch?: boolean) => void;
  section: InspectionSection | null;
  isRtl: boolean;
}

export function SectionDialog({
  open,
  onOpenChange,
  section,
  isRtl,
}: SectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const isEditing = !!section;

  useEffect(() => {
    if (section) {
      setCode(section.code || "");
      setName(section.name || "");
      setNameAr(section.nameAr || "");
      setDescription(section.description || "");
      setIsActive(section.isActive ?? true);
    } else {
      setCode("");
      setName("");
      setNameAr("");
      setDescription("");
      setIsActive(true);
    }
  }, [section, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      toast.error(isRtl ? "الكود والاسم مطلوبان" : "Code and name are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        nameAr: nameAr.trim(),
        description: description.trim(),
        isActive,
      };

      const url = isEditing
        ? `/api/inspection-sections/${section.id}`
        : "/api/inspection-sections";
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

      toast.success(isEditing ? "تم التحديث" : "تمت الإضافة");

      // ✅ إغلاق الحوار مع إعادة التحميل
      onOpenChange(false, true);
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
                ? "تعديل القسم"
                : "Edit Section"
              : isRtl
              ? "إضافة قسم جديد"
              : "Add New Section"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isRtl ? "أدخل بيانات القسم" : "Enter section details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الكود *" : "Code *"}
            </Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isRtl ? "مثال: SAF" : "e.g. SAF"}
              className="rounded-xl font-mono uppercase"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الاسم (إنجليزي) *" : "Name (English) *"}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRtl ? "مثال: Safety" : "e.g. Safety"}
              className="rounded-xl"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الاسم (عربي)" : "Name (Arabic)"}
            </Label>
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={isRtl ? "مثال: السلامة" : "e.g. Safety"}
              className="rounded-xl"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الوصف (اختياري)" : "Description (Optional)"}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRtl ? "وصف القسم" : "Section description"}
              className="rounded-xl min-h-[80px]"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label className="text-slate-700 dark:text-slate-300 cursor-pointer">
              {isRtl ? "حالة التفعيل" : "Active Status"}
            </Label>
            <Switch
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