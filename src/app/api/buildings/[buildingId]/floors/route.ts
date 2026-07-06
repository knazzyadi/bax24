// src/app/api/buildings/[buildingId]/floors/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  try {
    // ✅ الحصول على الجلسة (بدون التحقق من صلاحية محددة)
    const session = await getAuthenticatedSession();
    const companyId = session.companyId;
    if (!companyId) {
      // إذا لم توجد شركة، نعيد مصفوفة فارغة
      return NextResponse.json([]);
    }

    const { buildingId } = await params;

    // جلب المبنى مع الفرع للتحقق من الملكية
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: { branch: true },
    });

    // إذا لم يكن المبنى موجوداً أو لا ينتمي للشركة، نعيد مصفوفة فارغة
    if (!building || !building.branch || building.branch.companyId !== companyId) {
      return NextResponse.json([]);
    }

    // التحقق من صلاحية الفرع (للمستخدمين غير الأدمن)
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      if (!building.branchId || !userBranchIds.includes(building.branchId)) {
        return NextResponse.json([]);
      }
    }

    // جلب الأدوار مرتبة حسب order
    const floors = await prisma.floor.findMany({
      where: { buildingId: building.id },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        order: true,
        buildingId: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(floors);
  } catch (error) {
    console.error('GET /api/buildings/[buildingId]/floors error:', error);
    // ✅ في حالة أي خطأ، نعيد مصفوفة فارغة (لا نكسر التطبيق)
    return NextResponse.json([]);
  }
}