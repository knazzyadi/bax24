// src/app/api/reports/saved/route.ts

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// Types
// ============================================================

type SavedReportError = {
  message?: string;
};

// ============================================================
// GET: جلب جميع التقارير المحفوظة للمستخدم الحالي
// ============================================================

export async function GET() {
  try {
    const session = await requirePermission('reports.view');

    if (!session.companyId) {
      return NextResponse.json(
        {
          error: 'معرف الشركة غير متوفر',
        },
        {
          status: 400,
        }
      );
    }

    const reports = await prisma.savedReport.findMany({
      where: {
        userId: session.userId,
        companyId: session.companyId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(reports);

  } catch (error: unknown) {
    const err = error as SavedReportError;

    console.error(
      'GET /api/reports/saved error:',
      error
    );

    if (
      err.message ===
      'غير مصرح به - يرجى تسجيل الدخول'
    ) {
      return NextResponse.json(
        {
          error: 'غير مصرح',
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        error: 'حدث خطأ',
      },
      {
        status: 500,
      }
    );
  }
}
// ============================================================
// POST: حفظ تقرير جديد
// ============================================================

export async function POST(request: Request) {
  try {
    const session = await requirePermission('reports.create');

    if (!session.companyId) {
      return NextResponse.json(
        {
          error: 'معرف الشركة غير متوفر',
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const {
      name,
      description,
      modelType,
      columns,
      filters,
      sortBy,
    } = body as {
      name?: string;
      description?: string;
      modelType?: string;
      columns?: string[];
      filters?: unknown;
      sortBy?: unknown;
    };


    if (
      !name ||
      !modelType ||
      !columns ||
      columns.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'الاسم ونوع النموذج والأعمدة مطلوبة',
        },
        {
          status: 400,
        }
      );
    }


    const report =
      await prisma.savedReport.create({
        data: {
          name,

          description:
            description ||
            null,

          modelType,

          columns:
            JSON.stringify(columns),

          filters:
            filters
              ? JSON.stringify(filters)
              : null,

          sortBy:
            sortBy
              ? JSON.stringify(sortBy)
              : null,

          userId:
            session.userId,

          companyId:
            session.companyId,
        },
      });


    return NextResponse.json(
      report,
      {
        status: 201,
      }
    );


  } catch (error: unknown) {
    const err = error as SavedReportError;

    console.error(
      'POST /api/reports/saved error:',
      error
    );


    if (
      err.message ===
      'غير مصرح به - يرجى تسجيل الدخول'
    ) {
      return NextResponse.json(
        {
          error: 'غير مصرح',
        },
        {
          status: 401,
        }
      );
    }


    if (
      err.message?.includes('permission')
    ) {
      return NextResponse.json(
        {
          error: 'غير مسموح',
        },
        {
          status: 403,
        }
      );
    }


    return NextResponse.json(
      {
        error: 'حدث خطأ في الخادم',
      },
      {
        status: 500,
      }
    );
  }
}