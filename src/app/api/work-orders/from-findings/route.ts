// src/app/api/work-orders/from-findings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { FindingStatus, WorkOrderSource } from "@prisma/client";

// ============================================================
// Helper: توليد كود أمر العمل
// ============================================================
async function generateWorkOrderCode(
  companyId: string,
  branchId?: string | null
): Promise<string> {
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
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
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
    const { findingIds, title, description, priority, assignedTo } = body;

    if (!findingIds || !Array.isArray(findingIds) || findingIds.length === 0) {
      return NextResponse.json(
        { error: "يجب اختيار ملاحظة واحدة على الأقل" },
        { status: 400 }
      );
    }

    // 3. جلب الـ Findings المختارة والتحقق منها
    const findings = await prisma.inspectionFinding.findMany({
      where: {
        id: { in: findingIds },
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
        { error: "لا توجد ملاحظات متاحة لإنشاء أمر عمل. قد تكون تم إنشاء أوامر عمل لها مسبقاً أو لم تعد بحالة مفتوحة)" },
        { status: 400 }
      );
    }

    // 4. استخراج معلومات الموقع من أول Finding
    const firstFinding = findings[0];
    const inspection = firstFinding.inspectionResult?.inspectionFormItem?.inspection;
    const branchId = inspection?.branchId || null;
    const buildingId = inspection?.buildingId || null;
    const floorId = inspection?.floorId || null;
    const roomId = inspection?.roomId || null;

    // 5. الحصول على الحالة الافتراضية لأوامر العمل
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

    // 6. الحصول على الأولوية الافتراضية (اختياري)
    const defaultPriority = await prisma.workOrderPriority.findFirst({
      where: { companyId, isDefault: true },
      select: { id: true },
    });

    // 7. توليد كود فريد لأمر العمل
    const code = await generateWorkOrderCode(companyId, branchId);

    // 8. الحصول على أعلى رقم تسلسلي للفرع
    const lastSeqNum = await prisma.workOrder.aggregate({
      where: { branchId: branchId || undefined },
      _max: { branchSeqNum: true },
    });
    const branchSeqNum = (lastSeqNum._max.branchSeqNum || 0) + 1;

    // 9. استخدام transaction لضمان الذرية
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء أمر العمل
      const workOrder = await tx.workOrder.create({
        data: {
          code,
          branchSeqNum,
          // ✅ استخدام عنوان الفحص إن وجد، وإلا استخدام العنوان الافتراضي
          title:
            title ||
            inspection?.title ||
            `أمر عمل لـ ${findings.length} ملاحظة`,
          // ✅ وصف أكثر فائدة باستخدام عنوان الفحص
          description:
            description ||
            `تم إنشاء أمر العمل تلقائياً من نتائج الفحص "${inspection?.title ?? ""}"` ||
            `تم إنشاء هذا الأمر تلقائياً من ${findings.length} ملاحظة فحص.`,
          type: "CORRECTIVE",
          companyId,
          createdBy: userId,
          assignedTo: assignedTo || null,
          branchId,
          buildingId,
          floorId,
          roomId,
          statusId: defaultStatus.id,
          priorityId: defaultPriority?.id || null,
          // ✅ استخدام القيمة المتاحة في الـ Enum (checklist) لأن inspection_finding غير موجودة حالياً
          source: WorkOrderSource.checklist,
          sourceId: findings.map((f) => f.id).join(","),
          sourceType: "INSPECTION_FINDING",
        },
      });

      // إنشاء علاقات WorkOrderFinding بشكل منفصل
      await tx.workOrderFinding.createMany({
        data: findings.map((f) => ({
          workOrderId: workOrder.id,
          findingId: f.id,
        })),
      });

      // تحديث حالة Findings إلى "InProgress"
      await tx.inspectionFinding.updateMany({
        where: { id: { in: findingIds } },
        data: { status: FindingStatus.InProgress },
      });

      return workOrder;
    });

    // 10. الرد مع تفاصيل أمر العمل
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/work-orders/from-findings error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في الخادم", details: error.message },
      { status: 500 }
    );
  }
}