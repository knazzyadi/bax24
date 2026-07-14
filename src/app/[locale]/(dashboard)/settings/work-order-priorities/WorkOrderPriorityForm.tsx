// src/app/[locale]/(dashboard)/settings/work-order-priorities/WorkOrderPriorityForm.tsx
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
    if (priority) {
      setFormData({
        name: priority.name || "",
        nameEn: priority.nameEn || "",
        code: priority.code || "",
        color: priority.color || "#6B7280",
        order: priority.order ?? 0,
        isDefault: priority.isDefault || false,
        isActive: priority.isActive !== undefined ? priority.isActive : true,
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
  }, [priority]);

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
        ...formData,
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        code: formData.code.trim() || null,
        order: Number(formData.order),
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
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }

      toast.success(priority ? t("updateSuccess") : t("createSuccess"));
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
          placeholder={isRtl ? "أدخل اسم الأولوية" : "Enter priority name"}
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

      <ColorPickerField
        label={t("color")}
        value={formData.color}
        onChange={handleColorChange}
      />

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
          {priority ? (isRtl ? "تحديث" : "Update") : (isRtl ? "حفظ" : "Save")}
        </Button>
      </div>
    </form>
  );
}