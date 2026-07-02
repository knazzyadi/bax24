// src/app/[locale]/(reporting)/reports/page.tsx
"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  FileText,
  Trash2,
  Eye,
  Calendar,
  Loader2,
  Database,
  Package,
  ClipboardList,
  Ticket,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// ✅ دالة للحصول على أيقونة النموذج
function getModelIcon(modelType: string) {
  switch (modelType) {
    case "assets":
      return Package;
    case "workOrders":
      return ClipboardList;
    case "tickets":
      return Ticket;
    case "inventory":
      return Box;
    default:
      return Database;
  }
}

// ✅ دالة للحصول على لون النموذج
function getModelColor(modelType: string) {
  switch (modelType) {
    case "assets":
      return "text-blue-500 bg-blue-50 dark:bg-blue-950/30";
    case "workOrders":
      return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
    case "tickets":
      return "text-amber-500 bg-amber-50 dark:bg-amber-950/30";
    case "inventory":
      return "text-purple-500 bg-purple-50 dark:bg-purple-950/30";
    default:
      return "text-muted-foreground bg-muted/50";
  }
}

export default function ReportsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ✅ حالة الحوار (بديل لـ confirm)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // جلب التقارير المحفوظة
  const fetchReports = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReports();
    }
  }, [status, fetchReports]);

  // ✅ فتح حوار التأكيد
  const openDeleteDialog = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteDialogOpen(true);
  };

  // ✅ تنفيذ الحذف (بدون confirm)
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;

    startTransition(() => {
      setReports((prev) => prev.filter((r) => r.id !== id));
      setDeleting(id);
    });

    try {
      const res = await fetch(`/api/reports/saved/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`✅ تم حذف التقرير "${name}"`);
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل الحذف");
        await fetchReports(); // إعادة التزامن
      }
    } catch (error) {
      toast.error("حدث خطأ");
      await fetchReports(); // إعادة التزامن
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, fetchReports, startTransition]);

  // عرض التقرير
  const handleView = useCallback(
    (report: SavedReport) => {
      router.push(`/${locale}/reports/view/${report.id}`);
    },
    [locale, router]
  );

  // ✅ حساب عدد الأعمدة (مع memoization)
  const reportsWithColumnCount = useMemo(() => {
    return reports.map((report) => ({
      ...report,
      columnsCount: JSON.parse(report.columns).length,
    }));
  }, [reports]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ رأس الصفحة - العنوان والوصف المطلوب فقط */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">التقارير</h1>
          <p className="text-muted-foreground mt-1">
            إدارة وعرض التقارير المخصصة التي قمت بإنشائها
          </p>
        </div>
        <Link href={`/${locale}/reports/builder`}>
          <Button className="gap-2 shadow-sm">
            <PlusCircle className="h-4 w-4" />
            إنشاء تقرير جديد
          </Button>
        </Link>
      </div>

      {/* قائمة التقارير */}
      {reportsWithColumnCount.length === 0 ? (
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
          {reportsWithColumnCount.map((report) => {
            const Icon = getModelIcon(report.modelType);
            const colorClass = getModelColor(report.modelType);

            return (
              <Card
                key={report.id}
                className="group hover:shadow-md transition-all duration-300 border-border overflow-hidden"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-2 rounded-lg", colorClass)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-bold line-clamp-1">
                        {report.name}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 text-sm text-muted-foreground/80">
                    {report.description || "لا يوجد وصف"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                    <span className="inline-flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {report.modelType}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {report.columnsCount} عمود
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t pt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.updatedAt).toLocaleDateString("ar-SA")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      onClick={() => handleView(report)}
                      title="عرض التقرير"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      onClick={() => openDeleteDialog(report.id, report.name)}
                      disabled={deleting === report.id}
                      title="حذف التقرير"
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
            );
          })}
        </div>
      )}

      {/* ✅ حوار تأكيد الحذف (بديل لـ confirm) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `أنت على وشك حذف التقرير "${deleteTarget.name}". هذا الإجراء لا يمكن التراجع عنه.`
                : "هل أنت متأكد من حذف هذا التقرير؟"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}