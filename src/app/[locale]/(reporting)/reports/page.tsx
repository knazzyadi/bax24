// src/app/[locale]/(reporting)/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, FileText, Trash2, Eye, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  modelType: string;
  columns: string;
  filters: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // جلب التقارير المحفوظة
  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports/saved");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        toast.error("فشل تحميل التقارير");
      }
    } catch (error) {
      toast.error("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchReports();
    }
  }, [status]);

  // حذف تقرير
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف التقرير "${name}"؟`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/reports/saved/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("تم حذف التقرير");
        setReports(reports.filter((r) => r.id !== id));
      } else {
        toast.error("فشل الحذف");
      }
    } catch (error) {
      toast.error("حدث خطأ");
    } finally {
      setDeleting(null);
    }
  };

  // عرض التقرير (سيتم تنفيذها لاحقاً)
  const handleView = (report: SavedReport) => {
    // TODO: فتح التقرير في صفحة منفصلة
    toast.info(`سيتم عرض التقرير: ${report.name}`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التقارير</h1>
          <p className="text-muted-foreground mt-1">
            إدارة وعرض التقارير المخصصة التي قمت بإنشائها
          </p>
        </div>
        <Link href={`/${locale}/reports/builder`}>
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            إنشاء تقرير جديد
          </Button>
        </Link>
      </div>

      {/* قائمة التقارير */}
      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">لا توجد تقارير محفوظة</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              قم بإنشاء تقرير جديد باستخدام منشئ التقارير المخصص. اختر البيانات والأعمدة والفلاتر لعرض ما تريد.
            </p>
            <Link href={`/${locale}/reports/builder`} className="mt-4">
              <Button>إنشاء تقرير جديد</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{report.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {report.description || "لا يوجد وصف"}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(report.updatedAt).toLocaleDateString("ar-SA")}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleView(report)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(report.id, report.name)}
                    disabled={deleting === report.id}
                  >
                    {deleting === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}