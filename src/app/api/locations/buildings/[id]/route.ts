// src/app/api/locations/buildings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';


// ============================================================
// GET: جلب مبنى واحد
// ============================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }


    const permissionError =
      requirePermission(
        session,
        'locations.read'
      );

    if (permissionError) {
      return permissionError;
    }


    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }


    const { id } = await params;


    const building =
      await prisma.building.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null,
        },

        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
          order: true,
          branchId: true,
        },
      });


    if (!building) {
      return NextResponse.json(
        { error: 'المبنى غير موجود' },
        { status: 404 }
      );
    }


    return NextResponse.json(
      building
    );


  } catch (error: unknown) {

    console.error(
      'GET /api/locations/buildings/[id] error:',
      error
    );


    if (
      error instanceof Error &&
      error.message === 'FORBIDDEN'
    ) {
      return NextResponse.json(
        { error: 'لا تملك الصلاحية' },
        { status: 403 }
      );
    }


    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
// ============================================================
// PUT: تحديث مبنى
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          error: 'غير مصرح: يرجى تسجيل الدخول',
        },
        {
          status: 401,
        }
      );
    }


    const permissionError =
      requirePermission(
        session,
        'locations.update'
      );

    if (permissionError) {
      return permissionError;
    }


    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        {
          error: 'لا توجد شركة مرتبطة',
        },
        {
          status: 400,
        }
      );
    }


    const { id } = await params;


    const body = await request.json() as {
      name?: string;
      nameEn?: string;
      code?: string;
      order?: number;
      branchId?: string | null;
    };


    const {
      name,
      nameEn,
      code,
      order,
      branchId,
    } = body;



    if (!name?.trim()) {
      return NextResponse.json(
        {
          error: 'الاسم مطلوب',
        },
        {
          status: 400,
        }
      );
    }


    if (!code?.trim()) {
      return NextResponse.json(
        {
          error: 'الكود مطلوب',
        },
        {
          status: 400,
        }
      );
    }



    const existing =
      await prisma.building.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null,
        },
      });


    if (!existing) {
      return NextResponse.json(
        {
          error:
            'المبنى غير موجود أو لا ينتمي لشركتك',
        },
        {
          status: 404,
        }
      );
    }



    const duplicate =
      await prisma.building.findFirst({
        where: {
          code: code.trim(),
          companyId,
          deletedAt: null,

          NOT: {
            id,
          },
        },
      });



    if (duplicate) {
      return NextResponse.json(
        {
          error:
            'الكود موجود مسبقاً في شركتك',
        },
        {
          status: 409,
        }
      );
    }



    if (branchId) {

      const branch =
        await prisma.branch.findFirst({
          where: {
            id: branchId,
            companyId,
          },
        });


      if (!branch) {
        return NextResponse.json(
          {
            error:
              'الفرع المحدد غير صالح أو لا ينتمي لشركتك',
          },
          {
            status: 400,
          }
        );
      }
    }



    const updated =
      await prisma.building.update({

        where: {
          id,
        },


        data: {

          name:
            name.trim(),

          nameEn:
            nameEn?.trim() || null,

          code:
            code.trim(),

          order:
            typeof order === 'number'
              ? order
              : 0,


          branchId:
            branchId || null,
        },
      });



    return NextResponse.json(
      updated
    );



  } catch (error: unknown) {


    console.error(
      'PUT /api/locations/buildings/[id] error:',
      error
    );


    if (
      error instanceof Error &&
      error.message === 'FORBIDDEN'
    ) {
      return NextResponse.json(
        {
          error:
            'لا تملك الصلاحية',
        },
        {
          status: 403,
        }
      );
    }


    return NextResponse.json(
      {
        error:
          'حدث خطأ في الخادم',
      },
      {
        status: 500,
      }
    );
  }
}
// ============================================================
// DELETE: حذف مبنى (Soft Delete)
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          error: 'غير مصرح: يرجى تسجيل الدخول',
        },
        {
          status: 401,
        }
      );
    }



    const permissionError =
      requirePermission(
        session,
        'locations.delete'
      );


    if (permissionError) {
      return permissionError;
    }



    const companyId =
      session.companyId;


    if (!companyId) {
      return NextResponse.json(
        {
          error:
            'لا توجد شركة مرتبطة',
        },
        {
          status: 400,
        }
      );
    }



    const { id } = await params;



    const building =
      await prisma.building.findFirst({

        where: {
          id,
          companyId,
          deletedAt: null,
        },


        include: {

          _count: {

            select: {

              floors: true,
              assets: true,
              rooms: true,

            },
          },
        },
      });



    if (!building) {

      return NextResponse.json(
        {
          error:
            'المبنى غير موجود',
        },
        {
          status: 404,
        }
      );
    }




    const hasRelatedData =
      building._count.floors > 0 ||
      building._count.assets > 0 ||
      building._count.rooms > 0;



    if (hasRelatedData) {

      const counts: string[] = [];


      if (building._count.floors > 0) {
        counts.push(
          `${building._count.floors} دور`
        );
      }


      if (building._count.rooms > 0) {
        counts.push(
          `${building._count.rooms} غرفة`
        );
      }


      if (building._count.assets > 0) {
        counts.push(
          `${building._count.assets} أصل`
        );
      }



      return NextResponse.json(
        {
          error:
            `لا يمكن حذف المبنى لأنه مرتبط بـ ${counts.join('، ')}. قم بحذفها أولاً.`,
        },
        {
          status: 409,
        }
      );
    }




    await prisma.building.update({

      where: {
        id,
      },


      data: {

        deletedAt:
          new Date(),

      },

    });




    return NextResponse.json(
      {
        success: true,
      }
    );



  } catch (error: unknown) {


    console.error(
      'DELETE /api/locations/buildings/[id] error:',
      error
    );



    if (
      error instanceof Error &&
      error.message === 'FORBIDDEN'
    ) {

      return NextResponse.json(
        {
          error:
            'لا تملك الصلاحية',
        },
        {
          status:403,
        }
      );
    }




    return NextResponse.json(
      {
        error:
          'حدث خطأ في الخادم',
      },
      {
        status:500,
      }
    );

  }
}