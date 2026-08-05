// src/app/api/maintenance/schedules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET: جلب بيانات جدول الصيانة
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status:401 }
      );
    }

    await requirePermission('maintenance.read');

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error:'لا توجد شركة مرتبطة بالمستخدم' },
        { status:400 }
      );
    }

    const schedule =
      await prisma.maintenanceSchedule.findFirst({
        where:{
          id,
          companyId,
        },
        include:{
          assetType:true,
          branch:true,
          building:true,
          floor:true,
          room:true,
          scheduleAssets:{
            include:{
              asset:true,
            },
          },
        },
      });


    if(!schedule){
      return NextResponse.json(
        {
          error:'جدول الصيانة غير موجود',
        },
        {
          status:404,
        }
      );
    }


    return NextResponse.json(schedule);


  } catch(error: unknown){

    console.error(
      'GET /api/maintenance/schedules/[id] error:',
      error
    );


    return NextResponse.json(
      {
        error:'حدث خطأ في الخادم',
        details:
          error instanceof Error
          ? error.message
          : undefined,
      },
      {
        status:500,
      }
    );
  }
}


// ============================================================
// PUT: تحديث بيانات جدول الصيانة
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id:string }> }
) {

  try {

    const session =
      await getAuthenticatedSession();


    if(!session){
      return NextResponse.json(
        {
          error:'غير مصرح',
        },
        {
          status:401,
        }
      );
    }


    await requirePermission('maintenance.update');


    const { id } = await params;
    const companyId = session.companyId;


    if(!companyId){
      return NextResponse.json(
        {
          error:'لا توجد شركة مرتبطة بالمستخدم',
        },
        {
          status:400,
        }
      );
    }


    const body = await req.json();


    const {
      name,
      frequency,
      frequencyDays,
      leadDays,
      startDate,
      notes,
      isActive,
      assetTypeId,
      branchId,
      buildingId,
      floorId,
      roomId,
      assetIds,
    } = body;



    const existing =
      await prisma.maintenanceSchedule.findFirst({
        where:{
          id,
          companyId,
        },
      });


    if(!existing){
      return NextResponse.json(
        {
          error:'جدول الصيانة غير موجود',
        },
        {
          status:404,
        }
      );
    }



    if(!branchId){
      return NextResponse.json(
        {
          error:'الفرع مطلوب',
        },
        {
          status:400,
        }
      );
    }


    if(!buildingId && !floorId && !roomId){
      return NextResponse.json(
        {
          error:'يجب تحديد موقع الصيانة',
        },
        {
          status:400,
        }
      );
    }



    if(Array.isArray(assetIds) && assetIds.length>0){

      const validAssetsCount =
        await prisma.asset.count({
          where:{
            id:{
              in:assetIds,
            },
            companyId,
          },
        });


      if(validAssetsCount !== assetIds.length){

        return NextResponse.json(
          {
            error:'بعض الأصول غير صالحة أو لا تنتمي للشركة',
          },
          {
            status:400,
          }
        );
      }
    }



    let finalLocationLevel = "building";

    if(roomId){
      finalLocationLevel="room";
    }
    else if(floorId){
      finalLocationLevel="floor";
    }



    const updated =
      await prisma.maintenanceSchedule.update({

        where:{
          id,
        },

        data:{
          name,
          frequency,
          frequencyDays:
            frequencyDays || 30,

          leadDays:
            leadDays || 30,

          startDate:
            startDate
            ? new Date(startDate)
            : null,

          notes:
            notes || null,

          isActive:
            isActive ?? true,

          assetTypeId:
            assetTypeId || null,

          branchId:
            branchId || null,

          buildingId:
            buildingId || null,

          floorId:
            floorId || null,

          roomId:
            roomId || null,

          locationLevel:
            finalLocationLevel,


          scheduleAssets:{
            deleteMany:{},

            create:
              Array.isArray(assetIds)
              ?
              assetIds
              .filter(Boolean)
              .map((assetId:string)=>({
                assetId,
              }))
              :
              [],
          },
        },


        include:{
          branch:true,
          building:true,
          floor:true,
          room:true,
          assetType:true,

          scheduleAssets:{
            include:{
              asset:true,
            },
          },
        },

      });


    return NextResponse.json(updated);



  } catch(error: unknown){

    console.error(
      'PUT /api/maintenance/schedules/[id] error:',
      error
    );


    return NextResponse.json(
      {
        error:'حدث خطأ في الخادم',
        details:
          error instanceof Error
          ? error.message
          : undefined,
      },
      {
        status:500,
      }
    );

  }
}