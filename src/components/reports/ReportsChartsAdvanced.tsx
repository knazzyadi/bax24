// src/components/reports/ReportsChartsAdvanced.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Report } from "@/types/report";

interface Props {
  data: Report[];
}

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#ec4899"];

export function ReportsChartsAdvanced({ data }: Props) {
  // تحليل البيانات
  const categoryCount: Record<string, number> = {};
  const statusCount: Record<string, number> = {};
  const monthlyCount: Record<string, number> = {};

  for (const item of data) {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    statusCount[item.status] = (statusCount[item.status] || 0) + 1;

    const month = new Date(item.createdAt).toLocaleString("ar", { month: "short" });
    monthlyCount[month] = (monthlyCount[month] || 0) + 1;
  }

  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  const monthlyData = Object.entries(monthlyCount)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(`2024 ${a.month}`).getTime() - new Date(`2024 ${b.month}`).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* الرسم البياني الخطي (الاتجاهات) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">اتجاهات التقارير الشهرية</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* الرسم البياني الشريطي (التصنيفات) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">توزيع التقارير حسب التصنيف</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* الرسم البياني الدائري (الحالات) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">نسبة الحالات</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* الرسم البياني الشريطي الأفقي */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">أكثر التصنيفات نشاطاً</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryData.slice(0, 5)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}