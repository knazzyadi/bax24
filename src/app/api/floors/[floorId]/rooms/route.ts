// src/app/api/floors/[floorId]/rooms/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    // ✅ الحصول على الجلسة (بدون التحقق من صلاحية محددة)
    const session = await getAuthenticatedSession();
    const companyId = session.companyId;
    if (!companyId) {
      // إذا لم توجد شركة، نعيد مصفوفة فارغة
      return NextResponse.json([]);
    }

    const { floorId } = await params;

    // جلب الدور مع المبنى والفرع للتحقق من الملكية
    const floor = await prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        building: {
          include: { branch: true },
        },
      },
    });

    // إذا لم يكن الدور موجوداً أو لا ينتمي للشركة، نعيد مصفوفة فارغة
    if (!floor || !floor.building || !floor.building.branch || floor.building.branch.companyId !== companyId) {
      return NextResponse.json([]);
    }

    // التحقق من صلاحية الفرع (للمستخدمين غير الأدمن)
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      if (!floor.building.branchId || !userBranchIds.includes(floor.building.branchId)) {
        return NextResponse.json([]);
      }
    }

    // جلب الغرف مرتبة حسب الكود
    const rooms = await prisma.room.findMany({
      where: { floorId: floor.id },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        floorId: true,
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('GET /api/floors/[floorId]/rooms error:', error);
    // ✅ في حالة أي خطأ، نعيد مصفوفة فارغة (لا نكسر التطبيق)
    return NextResponse.json([]);
  }
}