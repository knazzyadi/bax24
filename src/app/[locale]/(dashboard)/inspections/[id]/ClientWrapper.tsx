// src/app/[locale]/(dashboard)/inspections/[id]/ClientWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
import { Loader2 } from "lucide-react";
import { InspectionHeader } from "./InspectionHeader";
import { InspectionStats } from "./InspectionStats";
import { InspectionItemsCard } from "./InspectionItemsCard";
import type { Inspection } from "../types";

interface ClientWrapperProps {
  initialData: {
    id: string;
    title: string;
    locationName?: string;
    scheduledDate: string;
    status: string;
    categories: {
      categoryId: string;
      categoryName: string;
      categoryNameAr?: string;
      items: any[];
    }[];
    results: any[];
    createdAt: string;
    updatedAt: string;
  };
  inspectionId: string;
  locale: string;
}

interface ResultState {
  id: string;
  itemId: string;
  result: "pass" | "fail" | "na";
  notes?: string;
  imageUrl?: string;
  workOrderId?: string;
}

export function ClientWrapper({ initialData, inspectionId, locale }: ClientWrapperProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const t = useTranslations("Inspections");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inspection, setInspection] = useState(initialData);
  const [resultsState, setResultsState] = useState<Record<string, ResultState>>({});
  const [status, setStatus] = useState(initialData.status);

  // تهيئة النتائج
  useEffect(() => {
    const initialResults: Record<string, ResultState> = {};
    initialData.categories.forEach((category) => {
      category.items.forEach((item) => {
        if (item.result) {
          initialResults[item.id] = item.result;
        } else {
          initialResults[item.id] = {
            id: `temp_${item.id}`,
            itemId: item.id,
            result: "na",
            notes: "",
          };
        }
      });
    });
    setResultsState(initialResults);
  }, [initialData]);

  // تحديث نتيجة بند
  const updateResult = (itemId: string, field: keyof ResultState, value: any) => {
    setResultsState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // حفظ التغييرات
  const handleSave = async (closeAfterSave: boolean = false) => {
    const resultsArray = Object.values(resultsState).map((r) => ({
      resultId: r.id.startsWith("temp_") ? undefined : r.id,
      itemId: r.itemId,
      result: r.result,
      notes: r.notes,
      imageUrl: r.imageUrl,
      workOrderId: r.workOrderId,
    }));

    setSaving(true);
    try {
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: resultsArray,
          status: closeAfterSave ? "completed" : status,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success(isRtl ? "تم حفظ التغييرات" : "Changes saved");

      if (closeAfterSave) {
        router.push(`/${locale}/inspections`);
      }
    } catch (err) {
      toast.error(isRtl ? "فشل الحفظ" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // حساب الإحصائيات
  const stats = {
    total: Object.values(resultsState).length,
    pass: Object.values(resultsState).filter((r) => r.result === "pass").length,
    fail: Object.values(resultsState).filter((r) => r.result === "fail").length,
    na: Object.values(resultsState).filter((r) => r.result === "na").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="relative space-y-8 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

        {/* رأس الصفحة */}
        <InspectionHeader
          title={inspection.title}
          locationName={inspection.locationName}
          scheduledDate={inspection.scheduledDate}
          status={status}
          isRtl={isRtl}
          onSave={() => handleSave(false)}
          onComplete={() => handleSave(true)}
          isSaving={saving}
          hasFailures={stats.fail > 0}
        />

        {/* الإحصائيات */}
        <InspectionStats stats={stats} isRtl={isRtl} />

        {/* ✅ الحاوية الرئيسية للعناوين والبنود (مثل AssetsCard) */}
        <InspectionItemsCard
        categories={inspection.categories}
        resultsState={resultsState}
        onUpdateResult={updateResult}
        isRtl={isRtl}
        t={t}
        locale={locale}
        />

      </div>
    </AdminGuard>
  );
}