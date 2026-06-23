// hooks/useReportsData.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

interface ReportsResponse {
  data: any[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  summary: { total: number; completed: number; pending: number };
}

/**
 * جلب بيانات التقارير بناءً على الفلاتر الحالية في الرابط
 */
async function fetchReports(params: URLSearchParams): Promise<ReportsResponse> {
  const queryString = params.toString();
  const res = await fetch(`/api/reports?${queryString}`);
  if (!res.ok) throw new Error("فشل في جلب التقارير");
  return res.json();
}

export function useReportsData() {
  const searchParams = useSearchParams();

  return useQuery<ReportsResponse>({
    queryKey: ["reports", searchParams.toString()],
    queryFn: () => fetchReports(searchParams),
    // الاحتفاظ بالبيانات القديمة أثناء جلب البيانات الجديدة
    placeholderData: (previousData) => previousData,
    // إعادة الجلب عندما يفقد المستخدم التركيز على الصفحة (تحديث لحظي)
    refetchOnWindowFocus: true,
    // فترة إعادة الجلب التلقائي (دقيقتين)
    refetchInterval: 120000,
  });
}