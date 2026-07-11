// src/app/api/work-order-types/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedSession,
  checkPermission,
} from "@/lib/auth/auth-helper";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// ============================================================
// GET – جلب نوع أمر عمل واحد
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح." },
        { status: 401 }
      );
    }

    await checkPermission("work_orders.read");

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة." },
        { status: 400 }
      );
    }

    const item = await prisma.workOrderType.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        color: true,
        icon: true,
        order: true,
        isDefault: true,
        isActive: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "نوع أمر العمل غير موجود." },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("GET /api/work-order-types/[id] error:", error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "لا تملك الصلاحية." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب البيانات." },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT – تحديث نوع أمر عمل
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح." },
        { status: 401 }
      );
    }

    await checkPermission("work_orders.update");

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      nameEn,
      code,
      description,
      color,
      icon,
      order,
      isDefault,
      isActive,
      companyId,
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "الاسم مطلوب." },
        { status: 400 }
      );
    }

    let targetCompanyId = companyId;
    if (session.role !== "SUPER_ADMIN") {
      targetCompanyId = session.companyId;
    }
    if (!targetCompanyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة." },
        { status: 400 }
      );
    }

    const existing = await prisma.workOrderType.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "نوع أمر العمل غير موجود." },
        { status: 404 }
      );
    }

    // التحقق من عدم تكرار الاسم أو الكود (باستثناء نفس العنصر)
    const duplicate = await prisma.workOrderType.findFirst({
      where: {
        companyId: targetCompanyId,
        deletedAt: null,
        NOT: { id },
        OR: [
          { name: name.trim() },
          { code: code?.trim() || undefined },
        ],
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "يوجد نوع أمر عمل بنفس الاسم أو الكود بالفعل." },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.workOrderType.updateMany({
          where: {
            companyId: targetCompanyId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return tx.workOrderType.update({
        where: { id },
        data: {
          name: name.trim(),
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          color: color || existing.color,
          icon: icon?.trim() || null,
          order: typeof order === "number" ? order : existing.order,
          isDefault: isDefault === true,
          isActive: isActive ?? existing.isActive,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/work-order-types/[id] error:", error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "لا تملك الصلاحية." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث البيانات." },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE – حذف نوع أمر عمل (Soft Delete)
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح." },
        { status: 401 }
      );
    }

    await checkPermission("work_orders.delete");

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة." },
        { status: 400 }
      );
    }

    const existing = await prisma.workOrderType.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "نوع أمر العمل غير موجود." },
        { status: 404 }
      );
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { error: "لا يمكن حذف النوع الافتراضي." },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود أوامر عمل مرتبطة
    const usedCount = await prisma.workOrder.count({
      where: { workOrderTypeId: id, deletedAt: null },
    });
    if (usedCount > 0) {
      return NextResponse.json(
        { error: "لا يمكن الحذف لوجود أوامر عمل مرتبطة بهذا النوع." },
        { status: 400 }
      );
    }

    // Soft Delete
    await prisma.workOrderType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف نوع أمر العمل بنجاح.",
    });
  } catch (error: any) {
    console.error("DELETE /api/work-order-types/[id] error:", error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "لا تملك الصلاحية." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف البيانات." },
      { status: 500 }
    );
  }
}