// src/app/[locale]/(dashboard)/settings/inspection-types/TemplateDialog.tsx
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
import type { InspectionTemplate, InspectionSection } from "./types";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, refetch?: boolean) => void;
  template: InspectionTemplate | null;
  sectionId?: string;
  sections: InspectionSection[];
  isRtl: boolean;
}

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  sectionId,
  sections,
  isRtl,
}: TemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(sectionId || "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const isEditing = !!template;

  useEffect(() => {
    if (template) {
      setSelectedSectionId(template.sectionId);
      setCode(template.code || "");
      setName(template.name || "");
      setNameAr(template.nameAr || "");
      setDescription(template.description || "");
      setIsActive(template.isActive ?? true);
    } else {
      setSelectedSectionId(sectionId || "");
      setCode("");
      setName("");
      setNameAr("");
      setDescription("");
      setIsActive(true);
    }
  }, [template, sectionId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSectionId || !code.trim() || !name.trim()) {
      toast.error(isRtl ? "القسم والكود والاسم مطلوبون" : "Section, code and name are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sectionId: selectedSectionId,
        code: code.trim(),
        name: name.trim(),
        nameAr: nameAr.trim(),
        description: description.trim(),
        isActive,
      };

      const url = isEditing
        ? `/api/inspection-templates/${template.id}`
        : "/api/inspection-templates";
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
                ? "تعديل نموذج الفحص"
                : "Edit Template"
              : isRtl
              ? "إضافة نموذج فحص جديد"
              : "Add New Template"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isRtl ? "أدخل بيانات نموذج الفحص" : "Enter template details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "القسم *" : "Section *"}
            </Label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-4"
            >
              <option value="">{isRtl ? "اختر القسم" : "Select section"}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {isRtl ? s.nameAr || s.name : s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              {isRtl ? "الكود *" : "Code *"}
            </Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isRtl ? "مثال: SAF-GEN" : "e.g. SAF-GEN"}
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
              placeholder={isRtl ? "مثال: General Safety" : "e.g. General Safety"}
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
              placeholder={isRtl ? "مثال: السلامة العامة" : "e.g. General Safety"}
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
              placeholder={isRtl ? "وصف النموذج" : "Template description"}
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