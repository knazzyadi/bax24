// src/components/reports/ReportsStats.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ReportsStatsProps {
  summary: {
    total: number;
    completed: number;
    pending: number;
  };
}

export function ReportsStats({ summary }: ReportsStatsProps) {
  const completedRate = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
  const pendingRate = summary.total > 0 ? Math.round((summary.pending / summary.total) * 100) : 0;

  const stats = [
    {
      title: "إجمالي التقارير",
      value: summary.total,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      sub: "جميع التقارير المسجلة",
    },
    {
      title: "مكتملة",
      value: summary.completed,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30",
      sub: `${completedRate}% من الإجمالي`,
    },
    {
      title: "معلقة",
      value: summary.pending,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      sub: `${pendingRate}% من الإجمالي`,
    },
    {
      title: "نسبة الإنجاز",
      value: `${completedRate}%`,
      icon: AlertCircle,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      sub: completedRate >= 80 ? "ممتاز 🎉" : completedRate >= 50 ? "جيد 👍" : "بحاجة إلى تحسين ⚠️",
    },
  ];

  return (
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
  );
}