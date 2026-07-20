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
  const [cbahiCode, setCbahiCode] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [inputType, setInputType] = useState<"pass_fail" | "numeric" | "text">("pass_fail");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setNameAr(item.nameAr || "");
      setCbahiCode(item.cbahiCode || "");
      setRiskLevel(item.riskLevel || "medium");
      setInputType(item.inputType || "pass_fail");
      setSortOrder(item.sortOrder || 0);
      setIsActive(item.isActive ?? true);
    } else {
      setName("");
      setNameAr("");
      setCbahiCode("");
      setRiskLevel("medium");
      setInputType("pass_fail");
      setSortOrder(0);
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
      toast.error(isRtl ? "يرجى اختيار عنوان رئيسي أولاً" : "Please select a category first");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        nameAr: nameAr.trim(),
        cbathiCode: cbahiCode.trim(), // احتفظ بالاسم الإنجليزي للحقل
        riskLevel,
        inputType,
        sortOrder: Number(sortOrder) || 0,
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {isEditing
              ? isRtl
                ? "تعديل بند الفحص"
                : "Edit Inspection Item"
              : isRtl
              ? "إضافة بند فحص جديد"
              : "Add New Inspection Item"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isRtl
              ? "حدد تفاصيل البند الفرعي المطلوب التفتيش عليه"
              : "Specify the details of the sub-item to be inspected"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-name" className="text-slate-700 dark:text-slate-300">
                {isRtl ? "الاسم (إنجليزي)" : "Name (English)"}
              </Label>
              <Input
                id="item-name"
                placeholder={isRtl ? "مثال: Fire Extinguisher" : "e.g. Fire Extinguisher"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-700"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name-ar" className="text-slate-700 dark:text-slate-300">
                {isRtl ? "الاسم (عربي)" : "Name (Arabic)"}
              </Label>
              <Input
                id="item-name-ar"
                placeholder={isRtl ? "مثال: طفاية حريق" : "e.g. Tufayet Harek"}
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-700"
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cbahi-code" className="text-slate-700 dark:text-slate-300">
              {isRtl ? "كود معيار سيباهي (اختياري)" : "CBAHI Standard Code (Optional)"}
            </Label>
            <Input
              id="cbahi-code"
              placeholder={isRtl ? "مثال: FMS.06" : "e.g. FMS.06"}
              value={cbahiCode}
              onChange={(e) => setCbahiCode(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-700 font-mono"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                {isRtl ? "مستوى الخطورة" : "Risk Level"}
              </Label>
              <Select
                value={riskLevel}
                onValueChange={(val) => setRiskLevel(val as any)}
              >
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700">
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
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                {isRtl ? "نوع الإدخال" : "Input Type"}
              </Label>
              <Select
                value={inputType}
                onValueChange={(val) => setInputType(val as any)}
              >
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder={isRtl ? "اختر النوع" : "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass_fail">{isRtl ? "نعم / لا" : "Pass / Fail"}</SelectItem>
                  <SelectItem value="numeric">{isRtl ? "رقمي (قراءة)" : "Numeric (Reading)"}</SelectItem>
                  <SelectItem value="text">{isRtl ? "نصي (وصف)" : "Text (Description)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="sort-order" className="text-slate-700 dark:text-slate-300">
                {isRtl ? "ترتيب العرض" : "Display Order"}
              </Label>
              <Input
                id="sort-order"
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="rounded-xl border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-5">
              <Label htmlFor="item-active" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                {isRtl ? "تفعيل" : "Active"}
              </Label>
              <Switch
                id="item-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
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