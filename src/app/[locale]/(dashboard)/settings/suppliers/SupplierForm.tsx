// src/app/[locale]/(dashboard)/settings/suppliers/SupplierForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User } from "lucide-react";
import type { Supplier } from "@/types/suppliers";
import { cn } from "@/lib/utils";

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
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxNumber: "",
    isActive: true,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        nameEn: supplier.nameEn || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        taxNumber: supplier.taxNumber || "",
        isActive: supplier.isActive !== undefined ? supplier.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        nameEn: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        taxNumber: "",
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
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        contactPerson: formData.contactPerson.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        taxNumber: formData.taxNumber.trim() || null,
        isActive: formData.isActive,
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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
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
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* الصف الأول: الاسم (إجباري) */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("name")} <span className="text-rose-500">*</span>
        </Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل اسم المورد" : "Enter supplier name"}
          required
          className="h-11 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      {/* الصف الثاني: الاسم بالإنجليزية + المندوب (عمودان) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("nameEn")}
          </Label>
          <Input
            name="nameEn"
            value={formData.nameEn}
            onChange={handleChange}
            placeholder={isRtl ? "الاسم بالإنجليزية" : "Name in English"}
            className="h-11 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <User className="h-4 w-4 text-slate-400" />
            {t("contactPerson")}
          </Label>
          <Input
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder={isRtl ? "أدخل اسم المندوب" : "Enter contact person"}
            className="h-11 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* الصف الثالث: رقم الهاتف + البريد الإلكتروني (عمودان) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("phone")}
          </Label>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={isRtl ? "أدخل رقم الهاتف" : "Enter phone number"}
            className="h-11 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("email")}
          </Label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={isRtl ? "أدخل البريد الإلكتروني" : "Enter email address"}
            className="h-11 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* الصف الرابع: العنوان (صف كامل) */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("address")}
        </Label>
        <Input
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل العنوان" : "Enter address"}
          className="h-11 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      {/* الصف الخامس: الرقم الضريبي */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("taxNumber")}
        </Label>
        <Input
          name="taxNumber"
          value={formData.taxNumber}
          onChange={handleChange}
          placeholder={isRtl ? "أدخل الرقم الضريبي" : "Enter tax number"}
          className="h-11 rounded-xl border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      {/* الصف السادس: حالة التفعيل */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isActive: !!checked }))
          }
          className="h-5 w-5 rounded-lg border-slate-300 dark:border-slate-600 data-[state=checked]:bg-emerald-600"
        />
        <Label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          {t("active")}
        </Label>
      </div>

      {/* الأزرار */}
      <div className="flex gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          className="flex-1 h-11 rounded-xl border-slate-300/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all"
        >
          {isRtl ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {supplier ? (isRtl ? "تحديث" : "Update") : (isRtl ? "حفظ" : "Save")}
        </Button>
      </div>
    </form>
  );
}