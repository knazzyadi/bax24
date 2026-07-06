// src/app/[locale]/(reporting)/reports/preview/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Eye, Database, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PreviewData {
  data: any[];
  columns: string[];
  modelType: string;
}

// =========================
// تنسيقات موحدة
// =========================
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

// =========================
// دوال مساعدة
// =========================
function getModelLabel(modelType: string, isRtl: boolean): string {
  const labels: Record<string, { ar: string; en: string }> = {
    assets: { ar: "الأصول", en: "Assets" },
    workOrders: { ar: "أوامر العمل", en: "Work Orders" },
    tickets: { ar: "التذاكر", en: "Tickets" },
    inventory: { ar: "المخزون", en: "Inventory" },
  };
  const label = labels[modelType];
  if (!label) return modelType;
  return isRtl ? label.ar : label.en;
}

export default function ReportPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";

  const modelType = searchParams.get("model") || "assets";
  const columnsParam = searchParams.get("columns") || "";

  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!columnsParam) {
      setError(isRtl ? "لا توجد أعمدة محددة للمعاينة" : "No columns specified for preview");
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        const res = await fetch(
          `/api/reports/preview?model=${modelType}&columns=${columnsParam}`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || (isRtl ? "فشل تحميل المعاينة" : "Failed to load preview"));
        }
        const data = await res.json();
        setPreviewData(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [modelType, columnsParam, isRtl]);

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Card className="max-w-2xl mx-auto mt-8 border-rose-200 dark:border-rose-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30">
                <Eye className="h-12 w-12 text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isRtl ? "خطأ في المعاينة" : "Preview Error"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
              <Button
                onClick={() => router.back()}
                className="mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                {isRtl ? "العودة" : "Back"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!previewData || previewData.data.length === 0) {
    return (
      <div className="relative p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Card className="max-w-2xl mx-auto mt-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                <Database className="h-12 w-12 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isRtl ? "لا توجد بيانات" : "No Data"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isRtl
                  ? "لا توجد بيانات للمعاينة مع الأعمدة المحددة"
                  : "No data to preview with the selected columns"}
              </p>
              <Button
                onClick={() => router.back()}
                className="mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                {isRtl ? "العودة" : "Back"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columns = previewData.columns;
  const rows = previewData.data;
  const modelLabel = getModelLabel(previewData.modelType, isRtl);

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Eye className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? "معاينة التقرير" : "Report Preview"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? `نموذج: ${modelLabel} | عدد الأعمدة: ${columns.length}`
                : `Model: ${modelLabel} | Columns: ${columns.length}`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>
      </div>

      {/* بطاقة الجدول */}
      <div className={glassCard}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "بيانات المعاينة" : "Preview Data"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRtl
                  ? `إجمالي السجلات: ${rows.length}`
                  : `Total records: ${rows.length}`}
              </p>
            </div>
          </div>
        </div>

        <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className="text-center font-semibold text-sm text-slate-600 dark:text-slate-300 px-4 py-3"
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className="text-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                      {row[col] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* معلومات إضافية */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? `عرض ${rows.length} سجل من أصل ${rows.length}`
              : `Showing ${rows.length} of ${rows.length} records`}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50/50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
              <Database className="h-3 w-3" />
              {modelLabel}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
              <FileText className="h-3 w-3" />
              {columns.length} {isRtl ? "عمود" : "columns"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}