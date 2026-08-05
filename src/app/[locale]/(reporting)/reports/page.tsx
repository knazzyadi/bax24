// src/app/[locale]/(reporting)/reports/page.tsx
"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Sparkles,
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

const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

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
      return "text-slate-500 bg-slate-50 dark:bg-slate-800/30";
  }
}

export default function ReportsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const { status } = useSession();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ✅ دالة مساعدة لإعادة تحميل البيانات – تستخدم في handleDelete فقط
  const reloadReports = async (): Promise<void> => {
    try {
      const res = await fetch("/api/reports/saved");
      if (res.ok) {
        const data: SavedReport[] = await res.json();
        setReports(data);
      } else {
        toast.error("فشل تحميل التقارير");
      }
    } catch {
      toast.error("حدث خطأ");
    }
  };

  // جلب البيانات عند المصادقة
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/reports/saved");
        if (res.ok) {
          const data: SavedReport[] = await res.json();
          setReports(data);
        } else {
          toast.error("فشل تحميل التقارير");
        }
      } catch {
        toast.error("حدث خطأ");
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  const openDeleteDialog = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteDialogOpen(true);
  };

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
        // إعادة تحميل البيانات لاستعادة الحالة الصحيحة
        await reloadReports();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "حدث خطأ";
      toast.error(message);
      await reloadReports();
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const handleView = useCallback(
    (report: SavedReport) => {
      router.push(`/${locale}/reports/view/${report.id}`);
    },
    [locale, router]
  );

  const reportsWithColumnCount = useMemo(() => {
    return reports.map((report) => ({
      ...report,
      columnsCount: JSON.parse(report.columns).length,
    }));
  }, [reports]);

  if (status === "loading" || loading) {
    return (
      <div className="relative space-y-8 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
          </div>
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              التقارير
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              إدارة وعرض التقارير المخصصة التي قمت بإنشائها
            </p>
          </div>
        </div>
        <Link href={`/${locale}/reports/builder`}>
          <Button className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 gap-2">
            <PlusCircle className="h-4 w-4" />
            إنشاء تقرير جديد
          </Button>
        </Link>
      </div>

      {reportsWithColumnCount.length === 0 ? (
        <div className={glassCard}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              لا توجد تقارير محفوظة
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              قم بإنشاء تقرير جديد باستخدام منشئ التقارير المخصص.
            </p>
            <Link href={`/${locale}/reports/builder`} className="mt-6">
              <Button className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200">
                إنشاء تقرير جديد
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportsWithColumnCount.map((report) => {
            const Icon = getModelIcon(report.modelType);
            const colorClass = getModelColor(report.modelType);

            return (
              <div
                key={report.id}
                className={cn(
                  glassCard,
                  "group hover:scale-[1.02] hover:shadow-xl cursor-pointer flex flex-col"
                )}
                onClick={() => handleView(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {report.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {report.description || "لا يوجد وصف"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    {report.modelType}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {report.columnsCount} عمود
                  </span>
                  <span className="inline-flex items-center gap-1.5 ml-auto">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(report.updatedAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>

                <div className="flex justify-end gap-1 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(report);
                    }}
                    title="عرض التقرير"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteDialog(report.id, report.name);
                    }}
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
              </div>
            );
          })}
        </div>
      )}

      {reports.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-indigo-400 dark:text-indigo-500" />
            <span>إجمالي التقارير: {reports.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["assets", "workOrders", "tickets", "inventory"].map((type) => {
              const count = reports.filter((r) => r.modelType === type).length;
              if (count === 0) return null;
              const Icon = getModelIcon(type);
              return (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30 text-slate-600 dark:text-slate-400"
                >
                  <Icon className="h-3 w-3" />
                  {type} {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

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
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}