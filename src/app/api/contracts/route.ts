// src/app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('contracts.read', session);

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const branchIds = session.user.branchIds || [];
    const companyId = session.user.companyId!;

    const where: any = { companyId, deletedAt: null };

    if (!isAdmin) {
      if (branchIds.length > 0) where.branchId = { in: branchIds };
      else return NextResponse.json({ contracts: [], total: 0, currentPage: page, totalPages: 0, limit });
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { supplier: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (status && status !== 'all') where.status = status;

    const contracts = await prisma.contract.findMany({
      where,
      include: { branch: true }, // ✅ جلب بيانات الفرع مع العقد
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    const total = await prisma.contract.count({ where });

    return NextResponse.json({ contracts, total, currentPage: page, totalPages: Math.ceil(total / limit), limit });
  } catch (error: any) {
    console.error('GET /api/contracts error:', error);
    return NextResponse.json({ error: 'خطأ في جلب العقود' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('contracts.create', session);

    const body = await request.json();
    const { code, title, supplier, value, startDate, endDate, description, branchId, attachments, notes } = body;

    if (!title || !supplier || !startDate || !endDate) {
      return NextResponse.json({ error: 'العنوان، المورد، وتاريخي البداية والنهاية مطلوبة' }, { status: 400 });
    }

    if (!branchId) {
      return NextResponse.json({ error: 'يرجى تحديد الفرع' }, { status: 400 });
    }

    const companyId = session.user.companyId!;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    // التحقق من صلاحية الفرع للمستخدمين غير الأدمن
    if (!isAdmin) {
      const userBranchIds = session.user.branchIds || [];
      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية إضافة عقد لهذا الفرع' }, { status: 403 });
      }
    }

    const contract = await prisma.contract.create({
      data: {
        code: code || null,
        title,
        supplier,
        value: value || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
        status: 'PENDING_REVIEW',
        attachments: attachments || [],
        notes: notes || null,
        companyId,
        branchId,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/contracts error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء العقد' }, { status: 500 });
  }
}