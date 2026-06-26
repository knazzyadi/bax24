// src/app/[locale]/(reporting)/reports/view/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

interface ReportData {
  id: string;
  name: string;
  description: string | null;
  modelType: string;
  columns: string[];
  data: any[];
  createdAt: string;
  updatedAt: string;
}

export default function ViewReportPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const locale = params?.locale as string || "ar";
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/view/${id}`);
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
    };

    fetchReport();
  }, [id]);

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

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
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
        <Button variant="outline" onClick={() => router.push(`/${locale}/reports`)}>
          <ArrowLeft className="h-4 w-4 ml-2" /> العودة إلى التقارير
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <FileText className="inline h-5 w-5 ml-2" />
            نموذج: {report.modelType}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map((col) => (
                      <TableCell key={col}>{row[col] ?? "—"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            إجمالي السجلات: {rows.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}