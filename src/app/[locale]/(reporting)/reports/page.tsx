// app/[locale]/reports/page.tsx
"use client";

import { useReportsData } from "@/hooks/useReportsData";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportsCharts } from "@/components/reports/ReportsCharts";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, isError, error } = useReportsData();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/reports?${params.toString()}`, { scroll: false });
  };

  if (isLoading) {
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
        </CardContent>
      </Card>
    );
  }

  const { data: reports, pagination, summary } = data || {
    data: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    summary: { total: 0, completed: 0, pending: 0 },
  };

  // بطاقات الإحصائيات
  const stats = [
    {
      title: "إجمالي التقارير",
      value: summary.total,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "مكتملة",
      value: summary.completed,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "معلقة",
      value: summary.pending,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "نسبة الإنجاز",
      value: summary.total > 0 ? `${Math.round((summary.completed / summary.total) * 100)}%` : "0%",
      icon: AlertCircle,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* بطاقات الـ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-70`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الفلاتر */}
      <ReportsFilters />

      {/* الرسوم البيانية */}
      {reports.length > 0 && <ReportsCharts data={reports} />}

      {/* الجدول */}
      <ReportsTable
        data={reports}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}