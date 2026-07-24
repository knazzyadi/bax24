// src/app/[locale]/(dashboard)/settings/inspection-types/ItemDialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { InspectionItem } from "./types";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, refetch?: boolean) => void;
  item: InspectionItem | null;
  categoryId?: string;
  isRtl: boolean;
}

export function ItemDialog({
  open,
  onOpenChange,
  item,
  categoryId,
  isRtl,
}: ItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [inputType, setInputType] = useState<"pass_fail" | "numeric" | "text">("pass_fail");
  const [isActive, setIsActive] = useState(true);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setNameAr(item.nameAr || "");
      setDescription(item.description || "");
      setRiskLevel(item.riskLevel || "medium");
      setInputType(item.inputType || "pass_fail");
      setIsActive(item.isActive ?? true);
    } else {
      setName("");
      setNameAr("");
      setDescription("");
      setRiskLevel("medium");
      setInputType("pass_fail");
      setIsActive(true);
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() && !nameAr.trim()) {
      toast.error(isRtl ? "يرجى إدخال اسم البند" : "Please enter item name");
      return;
    }

    if (!categoryId && !isEditing) {
      toast.error(isRtl ? "يرجى اختيار فئة أولاً" : "Please select a category first");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        nameAr: nameAr.trim(),
        description: description.trim(),
        riskLevel,
        inputType,
        isActive,
        categoryId: isEditing ? undefined : categoryId,
      };

      const url = isEditing
        ? `/api/inspection-items/${item.id}`
        : "/api/inspection-items";
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

      toast.success(isEditing ? "تم تحديث البند" : "تمت إضافة البند");
      onOpenChange(false, true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onOpenChange(open, false)}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 p-0">
        <DialogHeader className="p-4 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
          <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {isEditing
              ? isRtl
                ? "تعديل بند الفحص"
                : "Edit Inspection Item"
              : isRtl
              ? "إضافة بند فحص جديد"
              : "Add New Inspection Item"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? "حدد تفاصيل البند الفرعي المطلوب التفتيش عليه"
              : "Specify the details of the sub-item to be inspected"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? "الاسم (إنجليزي)" : "Name (English)"}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isRtl ? "مثال: Fire Extinguisher" : "e.g. Fire Extinguisher"}
                className="h-10 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? "الاسم (عربي)" : "Name (Arabic)"}
              </Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={isRtl ? "مثال: طفاية حريق" : "e.g. Tufayet Harek"}
                className="h-10 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50"
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isRtl ? "الوصف (اختياري)" : "Description (Optional)"}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRtl ? "أدخل وصفاً مختصراً للبند..." : "Enter a brief description for the item..."}
              className="min-h-[60px] rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? "مستوى الخطورة" : "Risk Level"}
              </Label>
              <Select value={riskLevel} onValueChange={(val) => setRiskLevel(val as any)}>
                <SelectTrigger className="h-10 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50">
                  <SelectValue placeholder={isRtl ? "اختر الخطورة" : "Select risk"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isRtl ? "منخفض" : "Low"}</SelectItem>
                  <SelectItem value="medium">{isRtl ? "متوسط" : "Medium"}</SelectItem>
                  <SelectItem value="high">{isRtl ? "عالي" : "High"}</SelectItem>
                  <SelectItem value="critical">{isRtl ? "حرج" : "Critical"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? "نوع الإدخال" : "Input Type"}
              </Label>
              <Select value={inputType} onValueChange={(val) => setInputType(val as any)}>
                <SelectTrigger className="h-10 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50">
                  <SelectValue placeholder={isRtl ? "اختر النوع" : "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass_fail">{isRtl ? "نعم / لا" : "Pass / Fail"}</SelectItem>
                  <SelectItem value="numeric">{isRtl ? "رقمي" : "Numeric"}</SelectItem>
                  <SelectItem value="text">{isRtl ? "نصي" : "Text"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <Label htmlFor="item-active" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              {isRtl ? "تفعيل" : "Active"}
            </Label>
            <Switch
              id="item-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false, false)}
              disabled={loading}
              className="flex-1 h-10 rounded-xl border-slate-300/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/20"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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