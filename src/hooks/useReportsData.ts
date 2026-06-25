// src/hooks/useReportsData.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type { Report } from "@/types/report";

interface ReportsResponse {
  data: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    total: number;
    completed: number;
    pending: number;
  };
}

async function fetchReports(params: URLSearchParams): Promise<ReportsResponse> {
  const res = await fetch(`/api/reports?${params.toString()}`);
  if (!res.ok) throw new Error("فشل في جلب التقارير");
  return res.json();
}

export function useReportsData() {
  const searchParams = useSearchParams();

  return useQuery<ReportsResponse>({
    queryKey: ["reports", searchParams?.toString() || ""],
    queryFn: () => fetchReports(searchParams || new URLSearchParams()),
    // ✅ إزالة placeholderData غير الصحيح
    refetchOnWindowFocus: true,
    refetchInterval: 120000,
    // ✅ إضافة staleTime لتجنب إعادة الجلب غير الضرورية
    staleTime: 60000,
  });
}