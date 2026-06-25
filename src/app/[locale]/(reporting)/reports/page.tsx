// src/app/[locale]/(reporting)/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReportsData } from "@/hooks/useReportsData";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/shared/ClientOnly";
import {
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

// مكونات النظام الجديد
import { ReportsStats } from "@/components/reports/ReportsStats";
import { ReportsChartsAdvanced } from "@/components/reports/ReportsChartsAdvanced";
import { ReportsTableAdvanced } from "@/components/reports/ReportsTableAdvanced";
import { ReportsFiltersAdvanced } from "@/components/reports/ReportsFiltersAdvanced";
import { ReportsExport } from "@/components/reports/ReportsExport";

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, isError, error, refetch } = useReportsData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", String(newPage));
    router.push(`/reports?${params.toString()}`, { scroll: false });
  };

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
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
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

  return (
    <div className="space-y-8">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة التقارير والتحليلات</h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على أداء العمليات والصيانة وإدارة المرافق
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => refetch()}
          >
            <Calendar className="h-4 w-4" />
            تحديث البيانات
          </Button>
          <ReportsExport data={reports} />
        </div>
      </div>

      {/* الإحصائيات */}
      <ClientOnly>
        <ReportsStats summary={summary} />
      </ClientOnly>

      {/* الفلاتر المتقدمة */}
      <ClientOnly>
        <ReportsFiltersAdvanced />
      </ClientOnly>

      {/* الرسوم البيانية المتقدمة */}
      {reports.length > 0 && (
        <ClientOnly>
          <ReportsChartsAdvanced data={reports} />
        </ClientOnly>
      )}

      {/* الجدول المتقدم */}
      <ClientOnly>
        <ReportsTableAdvanced
          data={reports}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </ClientOnly>

      {/* ملخص */}
      <div className="flex justify-between items-center p-4 bg-muted/40 rounded-xl text-sm text-muted-foreground">
        <span>آخر تحديث: {new Date().toLocaleString("ar-SA")}</span>
        <span>إجمالي السجلات: {pagination.total}</span>
      </div>
    </div>
  );
}