// src/app/[locale]/(dashboard)/inspections/[id]/ClientWrapper.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
import { Loader2, Hammer } from "lucide-react";
import { InspectionHeader } from "./InspectionHeader";
import { InspectionStats } from "./InspectionStats";
import { InspectionItemsCard } from "./InspectionItemsCard";
import type { ResultState, InspectionData, FindingDraft } from "../types";

interface ClientWrapperProps {
  initialData: InspectionData;
  inspectionId: string;
  locale: string;
}

// ===== دالة مساعدة لتحويل Finding إلى FindingDraft مع الاحتفاظ بـ id و status =====
const mapFindingToDraft = (finding: any): (FindingDraft & { id?: string; status?: string }) | null => {
  if (!finding) return null;
  return {
    id: finding.id,
    title: finding.title,
    description: finding.description || "",
    riskLevel: finding.riskLevel,
    correctiveAction: finding.correctiveAction || "",
    dueDate: finding.dueDate ? new Date(finding.dueDate).toISOString().split('T')[0] : "",
    status: finding.status,
  };
};

export function ClientWrapper({ initialData, inspectionId, locale }: ClientWrapperProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const t = useTranslations("Inspections");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingOrders, setCreatingOrders] = useState(false);
  const [inspection, setInspection] = useState(initialData);
  const [resultsState, setResultsState] = useState<Record<string, ResultState>>({});
  const [status, setStatus] = useState(initialData.status);

  // ===== تهيئة الحالة من البيانات الأولية =====
  useEffect(() => {
    const initialResults: Record<string, ResultState> = {};
    initialData.categories.forEach((category) => {
      category.items.forEach((item) => {
        const existingResult = item.result || null;
        if (existingResult) {
          const firstFinding = existingResult.findings?.[0];
          initialResults[item.id] = {
            id: existingResult.id || item.id,
            inspectionFormItemId: item.id,
            result: existingResult.result || "na",
            notes: existingResult.notes || "",
            imageUrl: existingResult.imageUrl || "",
            findingId: firstFinding?.id || undefined,
            workOrderId: existingResult.workOrderId || undefined,
            // ✅ تحويل الـ Finding إلى FindingDraft لتعبئة النموذج
            finding: mapFindingToDraft(firstFinding),
          };
        } else {
          initialResults[item.id] = {
            id: item.id,
            inspectionFormItemId: item.id,
            result: "na",
            notes: "",
            imageUrl: "",
          };
        }
      });
    });
    setResultsState(initialResults);
  }, [initialData]);

  // ===== تحديث نتيجة عنصر =====
  const updateResult = (inspectionFormItemId: string, field: keyof ResultState, value: any) => {
    setResultsState((prev) => ({
      ...prev,
      [inspectionFormItemId]: {
        ...prev[inspectionFormItemId],
        [field]: value,
      },
    }));
  };

  // ===== جلب بيانات الفحص المحدثة =====
  const fetchUpdatedInspection = async () => {
    const res = await fetch(`/api/inspections/${inspectionId}`);
    if (!res.ok) throw new Error("Failed to fetch updated inspection");
    const data = await res.json();
    return data;
  };

  // ===== تحديث resultsState من بيانات الفحص الجديدة =====
  const refreshResultsState = (inspectionData: InspectionData) => {
    const newResults: Record<string, ResultState> = {};
    inspectionData.categories.forEach((category) => {
      category.items.forEach((item) => {
        const existingResult = item.result || null;
        if (existingResult) {
          const firstFinding = existingResult.findings?.[0];
          newResults[item.id] = {
            id: existingResult.id || item.id,
            inspectionFormItemId: item.id,
            result: existingResult.result || "na",
            notes: existingResult.notes || "",
            imageUrl: existingResult.imageUrl || "",
            findingId: firstFinding?.id || undefined,
            workOrderId: existingResult.workOrderId || undefined,
            // ✅ تحويل الـ Finding إلى FindingDraft لتعبئة النموذج
            finding: mapFindingToDraft(firstFinding),
          };
        } else {
          newResults[item.id] = {
            id: item.id,
            inspectionFormItemId: item.id,
            result: "na",
            notes: "",
            imageUrl: "",
          };
        }
      });
    });
    setResultsState(newResults);
  };

  // ===== حفظ الفحص (مع Findings) =====
  const handleSave = async (closeAfterSave: boolean = false) => {
    const resultsArray = Object.values(resultsState).map((r) => {
      const resultPayload: any = {
        inspectionFormItemId: r.inspectionFormItemId,
        result: r.result,
        notes: r.notes || "",
        imageUrl: r.imageUrl || "",
      };

      if (r.finding) {
        resultPayload.findings = [
          {
            title: r.finding.title,
            description: r.finding.description || "",
            riskLevel: r.finding.riskLevel,
            correctiveAction: r.finding.correctiveAction || "",
            dueDate: r.finding.dueDate || null,
          },
        ];
      } else {
        resultPayload.findings = [];
      }

      return resultPayload;
    });

    setSaving(true);
    try {
      const newStatus = closeAfterSave ? "completed" : status;

      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: resultsArray,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success(isRtl ? "✅ تم حفظ التغييرات" : "✅ Changes saved");

      // ✅ جلب البيانات المحدثة وتحديث الحالة
      const updatedData = await fetchUpdatedInspection();
      setInspection(updatedData);
      refreshResultsState(updatedData);

      if (closeAfterSave) {
        setTimeout(() => {
          router.push(`/${locale}/inspections`);
        }, 1500);
      }
    } catch (err) {
      toast.error(isRtl ? "❌ فشل الحفظ" : "❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ===== إنهاء الفحص =====
  const handleComplete = () => {
    handleSave(true);
  };

  // ===== إنشاء أوامر العمل من Findings =====
  const handleCreateWorkOrders = async () => {
    // نجمع كل findingId من النتائج التي تحمل fail ولها findingId
    const findingIds = Object.values(resultsState)
      .filter((r) => r.result === "fail" && r.findingId)
      .map((r) => r.findingId as string);

    if (findingIds.length === 0) {
      toast.error(
        isRtl
          ? "⚠️ لا توجد ملاحظات محفوظة لإنشاء أوامر عمل"
          : "⚠️ No saved findings to create work orders"
      );
      return;
    }

    setCreatingOrders(true);
    try {
      const res = await fetch(`/api/work-orders/from-findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create work orders");

      toast.success(
        isRtl
          ? `✅ تم إنشاء ${data.count || 0} أمر عمل بنجاح`
          : `✅ Created ${data.count || 0} work order(s) successfully`
      );

      // تحديث البيانات بعد الإنشاء
      const updatedData = await fetchUpdatedInspection();
      setInspection(updatedData);
      refreshResultsState(updatedData);
      router.refresh();
    } catch (err: any) {
      toast.error(
        isRtl
          ? `❌ فشل إنشاء أوامر العمل: ${err.message}`
          : `❌ Failed to create work orders: ${err.message}`
      );
    } finally {
      setCreatingOrders(false);
    }
  };

  // ===== حساب عدد Findings (مع IDs صالحة) =====
  const findingsCount = Object.values(resultsState).filter(
    (r) => r.result === "fail" && r.findingId
  ).length;

  // ===== إحصائيات =====
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

        {/* ===== شريط الأدوات ===== */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <InspectionHeader
            title={inspection.title}
            locationName={inspection.locationName}
            scheduledDate={inspection.scheduledDate}
            status={status}
            isRtl={isRtl}
            onSave={() => handleSave(false)}
            onComplete={handleComplete}
            isSaving={saving}
            hasFailures={stats.fail > 0}
            inspectionId={inspectionId}
            locale={locale}
          />

          {findingsCount > 0 && (
            <button
              onClick={handleCreateWorkOrders}
              disabled={creatingOrders}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {creatingOrders ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Hammer className="h-4 w-4" />
              )}
              {isRtl ? "إنشاء أوامر عمل" : "Create Work Orders"}
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {findingsCount}
              </span>
            </button>
          )}
        </div>

        <InspectionStats stats={stats} isRtl={isRtl} />

        <InspectionItemsCard
          categories={inspection.categories}
          resultsState={resultsState}
          onUpdateResult={updateResult}
          isRtl={isRtl}
        />

        <div className="print-footer hidden print:block text-center text-xs text-gray-600 mt-10 pt-4 border-t border-gray-300">
          {isRtl ? "تم الإنشاء بواسطة نظام الفحص" : "Generated by Inspection System"}
          <br />
          {new Date().toLocaleDateString(isRtl ? "ar" : "en", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </AdminGuard>
  );
}