// src/app/[locale]/(dashboard)/inspections/[id]/InspectionStats.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

interface InspectionStatsProps {
  stats: {
    total: number;
    pass: number;
    fail: number;
    na: number;
  };
  isRtl: boolean;
}

export function InspectionStats({ stats, isRtl }: InspectionStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-white/50 dark:bg-slate-900/50 border-slate-200/50">
        <CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-slate-500">{isRtl ? "الإجمالي" : "Total"}</span>
          <span className="text-2xl font-bold">{stats.total}</span>
        </CardContent>
      </Card>
      <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50">
        <CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-emerald-600">✅ {isRtl ? "مطابق" : "Pass"}</span>
          <span className="text-2xl font-bold text-emerald-600">{stats.pass}</span>
        </CardContent>
      </Card>
      <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50">
        <CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-rose-600">❌ {isRtl ? "غير مطابق" : "Fail"}</span>
          <span className="text-2xl font-bold text-rose-600">{stats.fail}</span>
        </CardContent>
      </Card>
      <Card className="bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/50">
        <CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-slate-500">➖ N/A</span>
          <span className="text-2xl font-bold text-slate-500">{stats.na}</span>
        </CardContent>
      </Card>
    </div>
  );
}