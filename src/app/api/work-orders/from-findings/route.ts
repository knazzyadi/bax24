// src/app/api/work-orders/from-findings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { FindingStatus, WorkOrderSource } from "@prisma/client";

// ✅ استيراد الدالة الموحدة من lib
import { generateWorkOrderCode } from "@/lib/generateCode";

// ============================================================
// POST: إنشاء أمر عمل من Findings محددة
// ============================================================
export async function POST(req: NextRequest) {
  try {
    // ========================================================
    // 1. المصادقة
    // ========================================================
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

    // ========================================================
    // 2. قراءة البيانات
    // ========================================================
    const body = await req.json();
    const { findingIds, title, description, assignedTo } = body;

    // ========================================================
    // التحقق من Finding IDs
    // ========================================================
    if (!findingIds || !Array.isArray(findingIds) || findingIds.length === 0) {
      return NextResponse.json(
        { error: "يجب اختيار ملاحظة واحدة على الأقل" },
        { status: 400 }
      );
    }

    const uniqueFindingIds = [
      ...new Set(
        findingIds.filter(
          (id: unknown): id is string => typeof id === "string" && id.trim().length > 0
        )
      ),
    ];

    if (uniqueFindingIds.length === 0) {
      return NextResponse.json(
        { error: "معرفات الملاحظات غير صالحة" },
        { status: 400 }
      );
    }

    // ========================================================
    // 3. جلب Findings والتحقق منها
    // ========================================================
    const findings = await prisma.inspectionFinding.findMany({
      where: {
        id: { in: uniqueFindingIds },
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

    if (findings.length !== uniqueFindingIds.length) {
      return NextResponse.json(
        {
          error:
            "بعض الملاحظات المحددة غير متاحة أو تم تحويلها مسبقاً إلى أمر عمل",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // 4. استخراج بيانات الفحص
    // ========================================================
    const firstFinding = findings[0];
    const inspection = firstFinding.inspectionResult?.inspectionFormItem?.inspection;

    if (!inspection) {
      return NextResponse.json(
        { error: "تعذر العثور على الفحص المرتبط بالملاحظة" },
        { status: 400 }
      );
    }

    const branchId = inspection.branchId;
    if (!branchId) {
      return NextResponse.json(
        { error: "لا يمكن إنشاء أمر العمل لأن الفحص غير مرتبط بفرع" },
        { status: 400 }
      );
    }

    const buildingId = inspection.buildingId || null;
    const floorId = inspection.floorId || null;
    const roomId = inspection.roomId || null;

    // ========================================================
    // 5. الحالة الافتراضية
    // ========================================================
    const defaultStatus = await prisma.workOrderStatus.findFirst({
      where: { companyId, isDefault: true },
      select: { id: true },
    });

    if (!defaultStatus) {
      return NextResponse.json(
        { error: "لا توجد حالة افتراضية لأوامر العمل" },
        { status: 400 }
      );
    }

    // ========================================================
    // 6. الأولوية الافتراضية
    // ========================================================
    const defaultPriority = await prisma.workOrderPriority.findFirst({
      where: { companyId, isDefault: true },
      select: { id: true },
    });

    // ========================================================
    // 7. Transaction
    // ========================================================
    const result = await prisma.$transaction(
      async (tx) => {
        // ✅ استخدام الدالة الموحدة (ترتيب الوسائط: branchId أولاً، ثم tx)
        const { code, branchSeqNum } = await generateWorkOrderCode(
          branchId,
          tx
        );

        const workOrder = await tx.workOrder.create({
          data: {
            code,
            branchSeqNum,
            title: title || inspection.title || `أمر عمل لـ ${findings.length} ملاحظة`,
            description:
              description ||
              `تم إنشاء الأمر تلقائياً من نتائج الفحص "${inspection.title}"`,
            type: "CORRECTIVE",
            companyId,
            createdBy: userId,
            assignedTo: assignedTo || null,
            branchId,
            buildingId,
            floorId,
            roomId,
            statusId: defaultStatus.id,
            priorityId: defaultPriority?.id ?? null,
            source: WorkOrderSource.checklist,
            sourceId: findings.map((finding) => finding.id).join(","),
            sourceType: "INSPECTION_FINDING",
          },
          select: {
            id: true,
            code: true,
            branchSeqNum: true,
            title: true,
          },
        });

        // ربط Findings بأمر العمل
        await tx.workOrderFinding.createMany({
          data: findings.map((finding) => ({
            workOrderId: workOrder.id,
            findingId: finding.id,
          })),
          skipDuplicates: true,
        });

        // تحديث حالة Findings: Open → InProgress
        await tx.inspectionFinding.updateMany({
          where: {
            id: { in: findings.map((finding) => finding.id) },
            status: FindingStatus.Open,
          },
          data: {
            status: FindingStatus.InProgress,
          },
        });

        return workOrder;
      },
      { timeout: 30000 }
    );

    // ========================================================
    // 8. التحقق من إنشاء أمر العمل
    // ========================================================
    if (!result?.id) {
      throw new Error("فشل إنشاء أمر العمل");
    }
    if (!result.code) {
      throw new Error("كود أمر العمل غير صالح");
    }

    // ========================================================
    // 9. الرد
    // ========================================================
    return NextResponse.json(
      {
        message: `تم إنشاء أمر العمل ${result.code} بنجاح`,
        workOrderId: result.id,
        code: result.code,
        branchSeqNum: result.branchSeqNum,
        findingsCount: findings.length,
        status: "SUCCESS",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/work-orders/from-findings error:", error);

    if (typeof error === "object" && error !== null && "code" in error) {
      const prismaError = error as { code?: string; meta?: unknown; message?: string };
      console.error("Prisma error code:", prismaError.code);
      console.error("Prisma error meta:", prismaError.meta);

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "حدث تعارض في الرقم التسلسلي لأمر العمل. حاول مرة أخرى." },
          { status: 409 }
        );
      }
    }

    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json(
      { error: "حدث خطأ في الخادم", details: message },
      { status: 500 }
    );
  }
}