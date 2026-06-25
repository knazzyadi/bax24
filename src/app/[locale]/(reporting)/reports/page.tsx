// src/app/[locale]/(reporting)/reports/page.tsx
"use client";

import { useReportsData } from "@/hooks/useReportsData";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportsCharts } from "@/components/reports/ReportsCharts";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CheckCircle, Clock, AlertCircle, Download, Calendar, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/shared/ClientOnly";

// ✅ دالة مساعدة لتنسيق الأرقام
function formatNumber(num: number): string {
  return new Intl.NumberFormat("ar-SA").format(num);
}

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, isError, error } = useReportsData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", String(newPage));
    router.push(`/reports?${params.toString()}`, { scroll: false });
  };

  // ✅ حالة التحميل الأولي
  if (!mounted || isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center text-destructive">
          <p>حدث خطأ أثناء تحميل البيانات: {error?.message || "حاول مرة أخرى"}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  const reports = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };
  const summary = data?.summary || { total: 0, completed: 0, pending: 0 };

  // ✅ حساب الإحصائيات المتقدمة
  const completedRate = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
  const pendingRate = summary.total > 0 ? Math.round((summary.pending / summary.total) * 100) : 0;

  // ✅ بطاقات الإحصائيات المحسّنة
  const stats = [
    {
      title: "إجمالي التقارير",
      value: formatNumber(summary.total),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      sub: "جميع التقارير المسجلة",
    },
    {
      title: "مكتملة",
      value: formatNumber(summary.completed),
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
      sub: `${completedRate}% من الإجمالي`,
    },
    {
      title: "معلقة",
      value: formatNumber(summary.pending),
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      sub: `${pendingRate}% من الإجمالي`,
    },
    {
      title: "نسبة الإنجاز",
      value: `${completedRate}%`,
      icon: AlertCircle,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      sub: completedRate >= 80 ? "ممتاز 🎉" : completedRate >= 50 ? "جيد 👍" : "بحاجة إلى تحسين ⚠️",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ✅ رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التقارير والتحليلات</h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على أداء العمليات والصيانة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            هذا الشهر
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* ✅ بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-l-4 border-l-primary/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ✅ الفلاتر */}
      <ReportsFilters />

      {/* ✅ الرسوم البيانية */}
      {reports.length > 0 && (
        <ClientOnly>
          <ReportsCharts data={reports} />
        </ClientOnly>
      )}

      {/* ✅ الجدول */}
      <ClientOnly>
        <ReportsTable
          data={reports}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </ClientOnly>

      {/* ✅ ملخص سريع في الأسفل */}
      <div className="flex justify-between items-center p-4 bg-muted/40 rounded-xl text-sm text-muted-foreground">
        <span>آخر تحديث: {new Date().toLocaleString("ar-SA")}</span>
        <span>إجمالي السجلات: {formatNumber(pagination.total)}</span>
      </div>
    </div>
  );
}