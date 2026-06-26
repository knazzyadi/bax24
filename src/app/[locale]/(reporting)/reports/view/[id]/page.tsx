// src/app/[locale]/(reporting)/reports/view/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Calendar, FileText, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReportData {
  id: string;
  name: string;
  description: string | null;
  modelType: string;
  columns: string[];
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ViewReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const locale = params?.locale as string || "ar";
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ قراءة الصفحة الحالية من الرابط
  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 10;

  // ✅ جلب التقرير مع الصفحة المحددة
  const fetchReport = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/view/${id}?page=${page}&limit=${limit}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل تحميل التقرير");
      }
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, limit]);

  useEffect(() => {
    if (!id) return;
    fetchReport(currentPage);
  }, [id, currentPage, fetchReport]);

  // ✅ التنقل بين الصفحات
  const goToPage = (page: number) => {
    router.push(`/${locale}/reports/view/${id}?page=${page}`);
  };

  // ✅ تصدير التقرير إلى Excel
  const exportToExcel = async () => {
    if (!report) return;
    try {
      toast.info("جاري تحميل التقرير...");
      const res = await fetch(`/api/reports/export/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: report.columns,
          modelType: report.modelType,
        }),
      });
      if (!res.ok) throw new Error("فشل التصدير");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("تم تصدير التقرير بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء التصدير");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <Card className="border-destructive max-w-2xl mx-auto mt-8">
        <CardContent className="p-6 text-center text-destructive">
          <p className="text-lg font-semibold">⚠️ {error || "التقرير غير موجود"}</p>
          <Button className="mt-4" onClick={() => router.push(`/${locale}/reports`)}>
            <ArrowLeft className="h-4 w-4 ml-2" /> العودة إلى التقارير
          </Button>
        </CardContent>
      </Card>
    );
  }

  const columns = report.columns;
  const rows = report.data;
  const { page, total, totalPages } = report.pagination;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{report.name}</h1>
          {report.description && (
            <p className="text-muted-foreground">{report.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            <Calendar className="inline h-4 w-4 ml-1" />
            تم الإنشاء: {new Date(report.createdAt).toLocaleDateString("ar-SA")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToExcel}>
                <FileText className="h-4 w-4 ml-2" />
                تصدير إلى Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => router.push(`/${locale}/reports`)}>
            <ArrowLeft className="h-4 w-4 ml-2" /> العودة
          </Button>
        </div>
      </div>

      {/* الجدول */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <FileText className="inline h-5 w-5 ml-2" />
            نموذج: {report.modelType}
            <span className="text-sm font-normal text-muted-foreground mr-4">
              إجمالي السجلات: {total}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className="text-center font-semibold text-base px-4 py-3">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                      لا توجد بيانات في هذه الصفحة
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col} className="text-center px-4 py-2">
                          {row[col] ?? "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ✅ شريط الترقيم */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                صفحة {page} من {totalPages} (إجمالي {total} سجل)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}