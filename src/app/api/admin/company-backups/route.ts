// src/app/api/admin/company-backups/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";

// ============================================================
// GET: جلب سجل النسخ الاحتياطية
// ============================================================
export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const backups = await prisma.companyBackup.findMany({
      include: {
        company: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = backups.map((b) => ({
      id: b.id,
      companyId: b.companyId,
      companyName: b.company.name,
      fileName: b.fileName,
      fileUrl: b.fileUrl,
      fileSize: b.fileSize,
      status: b.status,
      createdById: b.createdById,
      createdBy: b.createdBy?.name,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {

    console.error("Error fetching backups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: إنشاء نسخة احتياطية جديدة
// ============================================================
export async function POST(req: NextRequest) {
  try {

    const session = await getAuthenticatedSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      companyId,
      type
    } = body;

    if (!companyId) {
      return NextResponse.json(
        {
          error: "companyId is required"
        },
        {
          status:400
        }
      );
    }

    // ============================================================
    // التحقق من الشركة
    // ============================================================

    const company = await prisma.company.findUnique({
      where:{
        id:companyId
      }
    });

    if(!company){

      return NextResponse.json(
        {
          error:"Company not found"
        },
        {
          status:404
        }
      );

    }

    // ============================================================
    // تجهيز بيانات النسخة
    // ============================================================

    const backupData:any = {

      company,
      branches:
        await prisma.branch.findMany({
          where:{
            companyId,
            deletedAt:null
          }
        }),

      buildings:
        await prisma.building.findMany({
          where:{
            companyId,
            deletedAt:null
          }
        }),

      floors:
        await prisma.floor.findMany({
          where:{
            building:{
              companyId
            }
          }
        }),

      rooms:
        await prisma.room.findMany({
          where:{
            building:{
              companyId
            }
          }
        }),

      assets:
        await prisma.asset.findMany({
          where:{
            companyId
          }
        }),

      assetTypes:
        await prisma.assetType.findMany({
          where:{
            companyId
          }
        }),

      assetStatuses:
        await prisma.assetStatus.findMany({
          where:{
            companyId
          }
        }),

      workOrderTypes:
        await prisma.workOrderType.findMany({
          where:{
            companyId
          }
        }),

      workOrderStatuses:
        await prisma.workOrderStatus.findMany({
          where:{
            companyId
          }
        }),

      workOrderPriorities:
        await prisma.workOrderPriority.findMany({
          where:{
            companyId
          }
        }),

      workOrders:
        await prisma.workOrder.findMany({
          where:{
            companyId
          }
        }),

      inspections:
        await prisma.inspectionCategory.findMany({

          where:{
            companyId,
            deletedAt:null
          },
          include:{
            items:true
          }
        })
    };

    // ============================================================
    // نسخة إعدادات فقط
    // ============================================================

    if(type==="config"){

      const configTables=[
        "assetTypes",
        "assetStatuses",
        "workOrderTypes",
        "workOrderStatuses",
        "workOrderPriorities",
        "inspections"
      ];

      Object.keys(backupData).forEach(key=>{
        if(!configTables.includes(key)){
          delete backupData[key];
        }
      });
    }

    const jsonString =
      JSON.stringify(
        backupData,
        null,
        2
      );

    const fileName =
      `backup-${companyId}-${Date.now()}.json`;

    const fileSize =
      Buffer.byteLength(
        jsonString,
        "utf8"
      );

    // ============================================================
    // حفظ سجل النسخة
    // ============================================================

    const backup =
      await prisma.companyBackup.create({
        data:{
          companyId,
          fileName,
          fileUrl:null,
          fileSize,
          status:"COMPLETED",
          createdById:session.userId
        }
      });

    return NextResponse.json(
      {
        ...backup,
        message:
          "Backup created successfully"
      },
      {
        status:201
      }
    );

  }catch(error){

    console.error(
      "Error creating backup:",
      error
    );

    return NextResponse.json(
      {
        error:"Internal Server Error"
      },
      {
        status:500
      }
    );
  }
}