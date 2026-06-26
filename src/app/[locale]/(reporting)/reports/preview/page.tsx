// src/app/[locale]/(reporting)/reports/preview/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PreviewData {
  data: any[];
  columns: string[];
  modelType: string;
}

export default function ReportPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelType = searchParams.get("model") || "assets";
  const columnsParam = searchParams.get("columns") || "";
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!columnsParam) {
      setError("لا توجد أعمدة محددة للمعاينة");
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/reports/preview?model=${modelType}&columns=${columnsParam}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "فشل تحميل المعاينة");
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
  }, [modelType, columnsParam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive max-w-2xl mx-auto mt-8">
        <CardContent className="p-6 text-center text-destructive">
          <p className="text-lg font-semibold">⚠️ {error}</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 ml-2" /> العودة
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!previewData || previewData.data.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">لا توجد بيانات للمعاينة</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 ml-2" /> العودة
          </Button>
        </CardContent>
      </Card>
    );
  }

  const columns = previewData.columns;
  const rows = previewData.data;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">معاينة التقرير</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 ml-2" /> العودة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">نموذج: {previewData.modelType}</CardTitle>
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