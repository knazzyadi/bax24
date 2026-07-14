// src/app/[locale]/(dashboard)/settings/work-order-close-reasons/WorkOrderCloseReasonForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { WorkOrderCloseReason } from "@/types/work-orders";

interface WorkOrderCloseReasonFormProps {
  reason: WorkOrderCloseReason | null;
  onSuccess: () => void;
  isRtl: boolean;
}

export function WorkOrderCloseReasonForm({
  reason,
  onSuccess,
  isRtl,
}: WorkOrderCloseReasonFormProps) {
  const t = useTranslations("WorkOrderCloseReasons");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    code: "",
    description: "",
    order: 0,
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    if (reason) {
      setFormData({
        name: reason.name || "",
        nameEn: reason.nameEn || "",
        code: reason.code || "",
        description: reason.description || "",
        order: reason.order ?? 0,
        isDefault: reason.isDefault || false,
        isActive: reason.isActive !== undefined ? reason.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        nameEn: "",
        code: "",
        description: "",
        order: 0,
        isDefault: false,
        isActive: true,
      });
    }
  }, [reason]);

  // ✅ دالة معالجة محسّنة للـ input والـ checkbox
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    // ✅ التعامل مع checkbox باستخدام (e.target as HTMLInputElement).checked
    const checked = type === "checkbox" 
      ? (e.target as HTMLInputElement).checked 
      : undefined;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
        ...formData,
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        code: formData.code.trim() || null,
        description: formData.description.trim() || null,
        order: Number(formData.order),
      };

      const url = reason
        ? `/api/work-order-close-reasons/${reason.id}`
        : "/api/work-order-close-reasons";
      const method = reason ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }

      toast.success(reason ? t("updateSuccess") : t("createSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || t("saveError"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {t("name")} <span className="text-destructive">*</span>
        </Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل اسم السبب" : "Enter reason name"}
          required
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {t("nameEn")}
        </Label>
        <Input
          name="nameEn"
          value={formData.nameEn}
          onChange={handleChange}
          placeholder={isRtl ? "الاسم بالإنجليزية" : "Name in English"}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {t("code")}
        </Label>
        <Input
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل الكود" : "Enter code"}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {t("description")}
        </Label>
        <Input
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={isRtl ? "وصف السبب (اختياري)" : "Description (optional)"}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {t("order")}
        </Label>
        <Input
          name="order"
          type="number"
          value={formData.order}
          onChange={handleChange}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Checkbox
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isDefault: !!checked }))
          }
        />
        <Label htmlFor="isDefault" className="text-sm font-medium text-foreground cursor-pointer">
          {t("setAsDefault")}
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isActive: !!checked }))
          }
        />
        <Label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer">
          {t("active")}
        </Label>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          className="flex-1 rounded-xl border-border h-11"
        >
          {isRtl ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {reason ? (isRtl ? "تحديث" : "Update") : (isRtl ? "حفظ" : "Save")}
        </Button>
      </div>
    </form>
  );
}