// src/app/api/reports/saved/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';


// GET: جلب جميع التقارير المحفوظة للمستخدم الحالي
export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const reports = await prisma.savedReport.findMany({
      where: {
        userId: session.id,
        companyId: session.companyId!,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('GET /api/reports/saved error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST: حفظ تقرير جديد
export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, modelType, columns, filters, sortBy } = body;

    if (!name || !modelType || !columns || columns.length === 0) {
      return NextResponse.json(
        { error: 'الاسم ونوع النموذج والأعمدة مطلوبة' },
        { status: 400 }
      );
    }

    const report = await prisma.savedReport.create({
      data: {
        name,
        description: description || null,
        modelType,
        columns: JSON.stringify(columns),
        filters: filters ? JSON.stringify(filters) : null,
        sortBy: sortBy ? JSON.stringify(sortBy) : null,
        userId: session.id,
        companyId: session.companyId!,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('POST /api/reports/saved error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}