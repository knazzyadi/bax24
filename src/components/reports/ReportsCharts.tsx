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
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Report } from "@/types/report";

interface Props {
  data: Report[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function ReportsCharts({ data }: Props) {
  const categoryCount: Record<string, number> = {};
  const statusCount: Record<string, number> = {};

  for (const item of data) {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    statusCount[item.status] = (statusCount[item.status] || 0) + 1;
  }

  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
  }));

  const statusData = Object.entries(statusCount).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <Card>
        <CardHeader>
          <CardTitle>التصنيفات</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الحالات</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}