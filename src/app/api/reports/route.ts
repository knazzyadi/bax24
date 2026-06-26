// app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedSession, checkPermission } from '@/lib/auth-helper';
import { getServerSession } from "next-auth"; // استيراد مباشر من next-auth


// نموذج بيانات وهمية (سنستبدلها بقاعدة البيانات لاحقاً)
const mockReports = [
  { id: 1, title: "تقرير الصيانة لشهر يناير", status: "completed", createdAt: "2025-01-15", category: "maintenance" },
  { id: 2, title: "تقرير المخزون للربع الأول", status: "pending", createdAt: "2025-02-01", category: "inventory" },
  { id: 3, title: "تقرير الحوادث", status: "completed", createdAt: "2025-02-10", category: "incidents" },
  { id: 4, title: "تقرير أداء المركبات", status: "in-progress", createdAt: "2025-02-20", category: "vehicles" },
  { id: 5, title: "تقرير المبيعات الشهري", status: "completed", createdAt: "2025-03-01", category: "sales" },
];

export async function GET(req: NextRequest) {
  // 1. التحقق من الصلاحيات (اختياري)
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // 2. قراءة معاملات التصفية من الرابط
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search")?.toLowerCase();
  const limit = parseInt(searchParams.get("limit") || "10");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;

  // 3. تطبيق الفلاتر على البيانات الوهمية
  let filteredData = [...mockReports];

  if (status) {
    filteredData = filteredData.filter((item) => item.status === status);
  }
  if (category) {
    filteredData = filteredData.filter((item) => item.category === category);
  }
  if (from && to) {
    filteredData = filteredData.filter(
      (item) => item.createdAt >= from && item.createdAt <= to
    );
  }
  if (search) {
    filteredData = filteredData.filter((item) =>
      item.title.toLowerCase().includes(search)
    );
  }

  // 4. ترتيب تنازلي حسب التاريخ
  filteredData.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // 5. حساب الإجماليات للـ KPI
  const totalCount = filteredData.length;
  const completedCount = filteredData.filter((item) => item.status === "completed").length;
  const pendingCount = filteredData.filter((item) => item.status === "pending").length;

  // 6. تطبيق الترقيم (Pagination)
  const paginatedData = filteredData.slice(skip, skip + limit);

  // 7. إرجاع البيانات مع معلومات الترقيم والإجماليات
  return NextResponse.json({
    data: paginatedData,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
    summary: {
      total: totalCount,
      completed: completedCount,
      pending: pendingCount,
    },
  });
}