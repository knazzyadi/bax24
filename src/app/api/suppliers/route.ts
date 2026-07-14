// src/app/api/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب قائمة الموردين
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'ar';

    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        contactPerson: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error in GET /api/suppliers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الموردين' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - إنشاء مورد جديد
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const body = await request.json();
    const { name, nameEn, code, contactPerson, phone, email, isActive } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    const existing = await prisma.supplier.findFirst({
      where: {
        companyId,
        name: name.trim(),
        deletedAt: null,
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'هناك مورد بنفس الاسم بالفعل' }, { status: 409 });
    }

    const newSupplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        isActive: isActive ?? true,
        companyId,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        contactPerson: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/suppliers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المورد' },
      { status: 500 }
    );
  }
}