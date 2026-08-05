// src/app/api/work-orders/from-findings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { FindingStatus, WorkOrderSource } from "@prisma/client";

// ============================================================
// Helper: توليد كود أمر العمل
// ============================================================
async function generateWorkOrderCode(): Promise<string> {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `WO-${timestamp}-${random}`;
}

// ============================================================
// POST: إنشاء أمر عمل من Findings محددة
// ============================================================
export async function POST(req: NextRequest) {
  try {
    // 1. المصادقة
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة" },
        { status: 400 }
      );
    }

    // 2. قراءة البيانات
    const body = await req.json();

    const {
      findingIds,
      title,
      description,
      assignedTo,
    } = body;

    if (
      !findingIds ||
      !Array.isArray(findingIds) ||
      findingIds.length === 0
    ) {
      return NextResponse.json(
        { error: "يجب اختيار ملاحظة واحدة على الأقل" },
        { status: 400 }
      );
    }

    // 3. جلب الـ Findings المختارة والتحقق منها
    const findings = await prisma.inspectionFinding.findMany({
      where: {
        id: {
          in: findingIds,
        },
        status: FindingStatus.Open,
        inspectionResult: {
          inspection: {
            companyId,
          },
        },
      },
      include: {
        inspectionResult: {
          include: {
            inspectionFormItem: {
              include: {
                inspection: true,
              },
            },
          },
        },
      },
    });

    if (findings.length === 0) {
      return NextResponse.json(
        {
          error:
            "لا توجد ملاحظات متاحة لإنشاء أمر عمل. قد تكون تم إنشاء أوامر عمل لها مسبقاً أو لم تعد بحالة مفتوحة",
        },
        { status: 400 }
      );
    }

    // 4. استخراج معلومات الموقع
    const firstFinding = findings[0];

    const inspection =
      firstFinding.inspectionResult?.inspectionFormItem?.inspection;

    const branchId = inspection?.branchId || null;
    const buildingId = inspection?.buildingId || null;
    const floorId = inspection?.floorId || null;
    const roomId = inspection?.roomId || null;

    // 5. الحالة الافتراضية
    const defaultStatus =
      await prisma.workOrderStatus.findFirst({
        where: {
          companyId,
          isDefault: true,
        },
        select: {
          id: true,
        },
      });

    if (!defaultStatus) {
      return NextResponse.json(
        {
          error: "لا توجد حالة افتراضية لأوامر العمل",
        },
        { status: 400 }
      );
    }

    // 6. الأولوية الافتراضية
    const defaultPriority =
      await prisma.workOrderPriority.findFirst({
        where: {
          companyId,
          isDefault: true,
        },
        select: {
          id: true,
        },
      });

    // 7. توليد كود أمر العمل
    const code = await generateWorkOrderCode();

    // 8. الرقم التسلسلي للفرع
    const lastSeqNum =
      await prisma.workOrder.aggregate({
        where: {
          branchId: branchId || undefined,
        },
        _max: {
          branchSeqNum: true,
        },
      });

    const branchSeqNum =
      (lastSeqNum._max.branchSeqNum || 0) + 1;

    // 9. Transaction
    const result = await prisma.$transaction(async (tx) => {
      const workOrder =
        await tx.workOrder.create({
          data: {
            code,
            branchSeqNum,

            title:
              title ||
              inspection?.title ||
              `أمر عمل لـ ${findings.length} ملاحظة`,

            description:
              description ||
              `تم إنشاء أمر العمل تلقائياً من نتائج الفحص "${inspection?.title ?? ""}"`,

            type: "CORRECTIVE",

            companyId,
            createdBy: userId,

            assignedTo: assignedTo || null,

            branchId,
            buildingId,
            floorId,
            roomId,

            statusId: defaultStatus.id,

            priorityId:
              defaultPriority?.id || null,

            source: WorkOrderSource.checklist,

            sourceId: findings
              .map((f) => f.id)
              .join(","),

            sourceType: "INSPECTION_FINDING",
          },
        });


      await tx.workOrderFinding.createMany({
        data: findings.map((finding) => ({
          workOrderId: workOrder.id,
          findingId: finding.id,
        })),
      });


      await tx.inspectionFinding.updateMany({
        where: {
          id: {
            in: findingIds,
          },
        },
        data: {
          status: FindingStatus.InProgress,
        },
      });


      return workOrder;
    });


    // 10. الرد
    return NextResponse.json(
      result,
      { status: 201 }
    );


  } catch (error: unknown) {

    console.error(
      "POST /api/work-orders/from-findings error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "خطأ غير معروف";


    return NextResponse.json(
      {
        error: "حدث خطأ في الخادم",
        details: message,
      },
      {
        status: 500,
      }
    );
  }
}