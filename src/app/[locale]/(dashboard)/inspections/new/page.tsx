// src/app/[locale]/(dashboard)/inspections/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { InspectionCategory } from "../../settings/inspection-types/types";

const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm";

export default function NewInspectionPage() {
  const router = useRouter();
  const t = useTranslations("Inspections");
  const locale = useLocale();
  const isRtl = locale === "ar";

  // بيانات النموذج
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);

  // جلب العناوين الرئيسية من قاعدة البيانات
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch("/api/inspection-categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data.filter((c: any) => c.isActive));
      } catch (err) {
        toast.error(isRtl ? "فشل تحميل العناوين" : "Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // إضافة عنوان رئيسي جديد إلى القائمة
  const handleAddCategory = (categoryId: string) => {
    if (!categoryId) return;
    if (selectedCategoryIds.includes(categoryId)) {
      toast.warning(isRtl ? "هذا العنوان مضاف مسبقاً" : "This category is already added");
      return;
    }
    setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
  };

  // إزالة عنوان من القائمة
  const handleRemoveCategory = (categoryId: string) => {
    setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId));
  };

  // حفظ الفحص
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(isRtl ? "يرجى إدخال عنوان للفحص" : "Please enter an inspection title");
      return;
    }
    if (selectedCategoryIds.length === 0) {
      toast.error(isRtl ? "يرجى إضافة عنوان رئيسي واحد على الأقل" : "Please add at least one main category");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        locationName: locationName.trim() || undefined,
        scheduledDate: new Date(scheduledDate).toISOString(),
        categoryIds: selectedCategoryIds,
      };

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل الحفظ");
      }

      const data = await res.json();
      toast.success(isRtl ? "تم إنشاء الفحص بنجاح" : "Inspection created successfully");
      
      // التوجيه لصفحة التفاصيل لبدء التشيك ليست
      router.push(`/${locale}/inspections/${data.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // الحصول على اسم العنوان من الـ ID
  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return isRtl ? cat?.nameAr || cat?.name : cat?.name;
  };

  // القوائم المتاحة (غير المضافة)
  const availableCategories = categories.filter(c => !selectedCategoryIds.includes(c.id));

  return (
    <div className="relative min-h-screen p-6 space-y-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 -z-10" />

      {/* رأس الصفحة */}
      <header className="relative flex items-center gap-4">
        <Link href={`/${locale}/inspections`}>
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {isRtl ? "فحص جديد" : "New Inspection"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRtl ? "اختر العناوين الرئيسية ثم انتقل للتفاصيل لإضافة النتائج" : "Select main categories then go to details to add results"}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={cn("relative p-6 space-y-6", glassCard)}>
        {/* الحقول الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>{isRtl ? "عنوان الفحص" : "Inspection Title"}</Label>
            <Input
              placeholder={isRtl ? "مثال: فحص السلامة الربع سنوي" : "e.g. Quarterly Safety Inspection"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>{isRtl ? "الموقع / القسم" : "Location / Department"}</Label>
            <Input
              placeholder={isRtl ? "مثال: غرفة العمليات - الطابق الثاني" : "e.g. OR - 2nd Floor"}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{isRtl ? "تاريخ الفحص" : "Inspection Date"}</Label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="rounded-xl w-fit"
          />
        </div>

        <hr className="border-slate-200/50" />

        {/* جزء اختيار العناوين (مثل العقود) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-base font-semibold">
              {isRtl ? "عناوين الفحص الرئيسية" : "Main Inspection Categories"}
            </Label>
            <div className="flex gap-2">
              <Select onValueChange={handleAddCategory} disabled={loadingCategories || availableCategories.length === 0}>
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue placeholder={isRtl ? "أضف عنواناً..." : "Add category..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {isRtl ? cat.nameAr || cat.name : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() => {
                  // اختيار أول عنوان غير مضاف تلقائياً (اختصار)
                  if (availableCategories.length > 0) handleAddCategory(availableCategories[0].id);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* عرض العناوين المضافة (مثل ملخص العقد) */}
          {selectedCategoryIds.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              {isRtl ? "لم تقم بإضافة أي عنوان. استخدم القائمة المنسدلة لإضافة عناوين الفحص." : "No categories added. Use the dropdown to add inspection categories."}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedCategoryIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300"
                >
                  {getCategoryName(id)}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(id)}
                    className="hover:bg-indigo-200/50 rounded-full p-0.5 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* أزرار الحفظ */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
          <Link href={`/${locale}/inspections`}>
            <Button type="button" variant="outline" className="rounded-xl">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
          >
            {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            <Save className="h-4 w-4 ml-2" />
            {isRtl ? "حفظ والانتقال للفحص" : "Save & Go to Inspection"}
          </Button>
        </div>
      </form>
    </div>
  );
}