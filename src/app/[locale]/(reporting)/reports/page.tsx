"use client";

import { useReportsData } from "@/hooks/useReportsData";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportsCharts } from "@/components/reports/ReportsCharts";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-xl"
          >
            إعادة المحاولة
          </button>
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

      <ReportsFilters />

      {reports.length > 0 && <ReportsCharts data={reports} />}

      <ReportsTable
        data={reports}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}