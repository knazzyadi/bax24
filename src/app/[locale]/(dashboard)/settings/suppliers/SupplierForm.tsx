// src/app/[locale]/(dashboard)/settings/suppliers/SupplierForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Phone, Mail } from "lucide-react";
import type { Supplier } from "@/types/assets";

interface SupplierFormProps {
  supplier: Supplier | null;
  onSuccess: () => void;
  isRtl: boolean;
}

export function SupplierForm({
  supplier,
  onSuccess,
  isRtl,
}: SupplierFormProps) {
  const t = useTranslations("Suppliers");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    isActive: true,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        nameEn: supplier.nameEn || "",
        code: supplier.code || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        isActive: supplier.isActive !== undefined ? supplier.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        nameEn: "",
        code: "",
        contactPerson: "",
        phone: "",
        email: "",
        isActive: true,
      });
    }
  }, [supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
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
        contactPerson: formData.contactPerson.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
      };

      const url = supplier
        ? `/api/suppliers/${supplier.id}`
        : "/api/suppliers";
      const method = supplier ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }

      toast.success(supplier ? t("updateSuccess") : t("createSuccess"));
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
          placeholder={isRtl ? "أدخل اسم المورد" : "Enter supplier name"}
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
        <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <User className="h-4 w-4 text-muted-foreground" />
          {t("contactPerson")}
        </Label>
        <Input
          name="contactPerson"
          value={formData.contactPerson}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل اسم جهة الاتصال" : "Enter contact person name"}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {t("phone")}
        </Label>
        <Input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل رقم الهاتف" : "Enter phone number"}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {t("email")}
        </Label>
        <Input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل البريد الإلكتروني" : "Enter email address"}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
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
          {supplier ? (isRtl ? "تحديث" : "Update") : (isRtl ? "حفظ" : "Save")}
        </Button>
      </div>
    </form>
  );
}