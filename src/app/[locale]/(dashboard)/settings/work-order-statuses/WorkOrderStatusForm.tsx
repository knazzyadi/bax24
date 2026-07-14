// src/app/[locale]/(dashboard)/settings/work-order-statuses/WorkOrderStatusForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPickerField } from "@/components/shared/form/ColorPickerField";
import { Loader2 } from "lucide-react";
import type { WorkOrderStatus } from "@/types/work-orders";

interface WorkOrderStatusFormProps {
  status: WorkOrderStatus | null;
  onSuccess: () => void;
  isRtl: boolean;
}

export function WorkOrderStatusForm({
  status,
  onSuccess,
  isRtl,
}: WorkOrderStatusFormProps) {
  const t = useTranslations("WorkOrderStatuses");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    code: "",
    color: "#6B7280",
    order: 0,
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name || "",
        nameEn: status.nameEn || "",
        code: status.code || "",
        color: status.color || "#6B7280",
        order: status.order ?? 0,
        isDefault: status.isDefault || false,
        isActive: status.isActive !== undefined ? status.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        nameEn: "",
        code: "",
        color: "#6B7280",
        order: 0,
        isDefault: false,
        isActive: true,
      });
    }
  }, [status]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        ...formData,
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        code: formData.code.trim() || null,
        order: Number(formData.order),
      };

      const url = status
        ? `/api/work-order-statuses/${status.id}`
        : "/api/work-order-statuses";
      const method = status ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }

      toast.success(status ? t("updateSuccess") : t("createSuccess"));
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
      {/* الاسم */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {t("name")} <span className="text-rose-500">*</span>
        </Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل اسم الحالة" : "Enter status name"}
          required
          className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
        />
      </div>

      {/* الاسم بالإنجليزية */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("nameEn")}</Label>
        <Input
          name="nameEn"
          value={formData.nameEn}
          onChange={handleChange}
          placeholder={isRtl ? "الاسم بالإنجليزية" : "Name in English"}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
        />
      </div>

      {/* الكود */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("code")}</Label>
        <Input
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل الكود" : "Enter code"}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
        />
      </div>

      {/* اللون */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("color")}</Label>
        <ColorPickerField
          label={t("color")}
          value={formData.color}
          onChange={handleColorChange}
        />
      </div>

      {/* الترتيب */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("order")}</Label>
        <Input
          name="order"
          type="number"
          value={formData.order}
          onChange={handleChange}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
        />
      </div>

      {/* افتراضي */}
      <div className="flex items-center gap-3 pt-2">
        <Checkbox
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isDefault: !!checked }))
          }
        />
        <Label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
          {t("setAsDefault")}
        </Label>
      </div>

      {/* نشط */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isActive: !!checked }))
          }
        />
        <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
          {t("active")}
        </Label>
      </div>

      {/* الأزرار */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 h-11"
        >
          {isRtl ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium h-11 shadow-lg shadow-violet-500/20"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {status ? (isRtl ? "تحديث" : "Update") : (isRtl ? "حفظ" : "Save")}
        </Button>
      </div>
    </form>
  );
}