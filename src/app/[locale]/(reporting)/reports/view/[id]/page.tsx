"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface ReportRow {
  [key: string]: unknown;
}

interface ReportData {
  id: string;
  name: string;
  description: string | null;
  modelType: string;
  columns: string[];
  data: ReportRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  createdAt: string;
  updatedAt: string;
}

const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

export default function PreviewReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  // ============================================================
  // ✅ دالة مساعدة لعرض أي قيمة كنص آمن (تمت إضافتها)
  // ============================================================
  const renderCellValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return "—";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const fetchReport = useCallback(
    async (page: number) => {
      if (!id) {
        setError(isRtl ? "معرف التقرير غير موجود" : "Report ID not found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reports/preview/${id}?page=${page}&limit=${limit}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || (isRtl ? "فشل تحميل التقرير" : "Failed to load report"));
        }
        const data = await res.json();
        setReport(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : isRtl
            ? "حدث خطأ غير متوقع"
            : "Unexpected error";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [id, limit, isRtl]
  );

  useEffect(() => {
    let cancelled = false;
    const loadReport = async () => {
      if (cancelled) return;
      await fetchReport(currentPage);
    };
    loadReport();
    return () => {
      cancelled = true;
    };
  }, [fetchReport, currentPage]);

  const goToPage = (page: number) => {
    router.push(`/${locale}/reports/preview/${id}?page=${page}`);
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  if (error || !report) {
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
                {isRtl ? "التقرير غير موجود" : "Report not found"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {error ||
                  (isRtl
                    ? "لم نتمكن من العثور على التقرير المطلوب"
                    : "Could not find the requested report")}
              </p>
              <Button
                onClick={() => router.push(`/${locale}/reports`)}
                className="mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                {isRtl ? "العودة إلى التقارير" : "Back to Reports"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columns = report.columns;
  const rows = report.data;
  const { page, total, totalPages } = report.pagination;

  return (
    <div className="relative space-y-8 px-4 sm:px-6 py-6 max-w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {report.name}
            </h1>
            {report.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {report.description}
              </p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isRtl ? "تاريخ الإنشاء:" : "Created:"}{" "}
              {new Date(report.createdAt).toLocaleDateString(
                isRtl ? "ar-SA" : "en-US"
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/reports`)}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>
      </div>

      <div className={glassCard}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "بيانات التقرير" : "Report Data"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRtl
                  ? `النموذج: ${report.modelType} | إجمالي السجلات: ${total}`
                  : `Model: ${report.modelType} | Total records: ${total}`}
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
                    className="text-center font-semibold text-sm text-slate-600 dark:text-slate-300 px-4 py-3 whitespace-nowrap"
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-8 text-slate-400 dark:text-slate-500"
                  >
                    {isRtl ? "لا توجد بيانات في هذه الصفحة" : "No data on this page"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        className="text-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        {renderCellValue(row[col])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? `صفحة ${page} من ${totalPages} (إجمالي ${total} سجل)`
                : `Page ${page} of ${totalPages} (Total ${total} records)`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              >
                {isRtl ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              >
                {isRtl ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}