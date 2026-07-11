// src/app/api/work-order-cancel-reasons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedSession,
  checkPermission,
} from "@/lib/auth/auth-helper";

// ============================================================
// GET – جلب قائمة أسباب الإلغاء
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح." },
        { status: 401 }
      );
    }

    await checkPermission("work_orders.read");

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get("companyId");

    let where: any = {
      deletedAt: null,
    };
    if (session.role !== "SUPER_ADMIN") {
      where.companyId = session.companyId;
    } else if (companyIdParam) {
      where.companyId = companyIdParam;
    }

    const items = await prisma.workOrderCancelReason.findMany({
      where,
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        order: true,
        isDefault: true,
        isActive: true,
      },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("GET /api/work-order-cancel-reasons error:", error);
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
// POST – إنشاء سبب إلغاء جديد
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح." },
        { status: 401 }
      );
    }

    await checkPermission("work_orders.create");

    const body = await request.json();
    const {
      name,
      nameEn,
      code,
      description,
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

    const existing = await prisma.workOrderCancelReason.findFirst({
      where: {
        companyId: targetCompanyId,
        deletedAt: null,
        OR: [
          { name: name.trim() },
          { code: code?.trim() || undefined },
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "يوجد سبب إلغاء بنفس الاسم أو الكود بالفعل." },
        { status: 409 }
      );
    }

    const newItem = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.workOrderCancelReason.updateMany({
          where: {
            companyId: targetCompanyId,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      return tx.workOrderCancelReason.create({
        data: {
          name: name.trim(),
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          order: typeof order === "number" ? order : 0,
          isDefault: isDefault === true,
          isActive: isActive ?? true,
          companyId: targetCompanyId,
        },
      });
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/work-order-cancel-reasons error:", error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "لا تملك الصلاحية." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء البيانات." },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT – تحديث سبب إلغاء
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح." },
        { status: 401 }
      );
    }

    await checkPermission("work_orders.update");

    const body = await request.json();
    const {
      id,
      name,
      nameEn,
      code,
      description,
      order,
      isDefault,
      isActive,
      companyId,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "المعرف مطلوب." },
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

    const existingItem = await prisma.workOrderCancelReason.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
    });
    if (!existingItem) {
      return NextResponse.json(
        { error: "سبب الإلغاء غير موجود." },
        { status: 404 }
      );
    }

    if (name || code) {
      const duplicate = await prisma.workOrderCancelReason.findFirst({
        where: {
          companyId: targetCompanyId,
          deletedAt: null,
          NOT: { id },
          OR: [
            { name: name?.trim() || undefined },
            { code: code?.trim() || undefined },
          ],
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "يوجد سبب إلغاء بنفس الاسم أو الكود بالفعل." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.workOrderCancelReason.updateMany({
          where: {
            companyId: targetCompanyId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return tx.workOrderCancelReason.update({
        where: { id },
        data: {
          name: name?.trim() ?? existingItem.name,
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          order: typeof order === "number" ? order : existingItem.order,
          isDefault: isDefault === true,
          isActive: isActive ?? existingItem.isActive,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/work-order-cancel-reasons error:", error);
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
// DELETE – حذف سبب إلغاء (Soft Delete)
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح." },
        { status: 401 }
      );
    }

    await checkPermission("work_orders.delete");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "المعرف مطلوب." },
        { status: 400 }
      );
    }

    let targetCompanyId = session.companyId;
    if (session.role === "SUPER_ADMIN") {
      targetCompanyId = searchParams.get("companyId") || session.companyId;
    }
    if (!targetCompanyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة." },
        { status: 400 }
      );
    }

    const existing = await prisma.workOrderCancelReason.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "سبب الإلغاء غير موجود." },
        { status: 404 }
      );
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { error: "لا يمكن حذف السبب الافتراضي." },
        { status: 400 }
      );
    }

    const usedCount = await prisma.workOrder.count({
      where: { cancelReasonId: id, deletedAt: null },
    });
    if (usedCount > 0) {
      return NextResponse.json(
        { error: "لا يمكن الحذف لوجود أوامر عمل مرتبطة بهذا السبب." },
        { status: 400 }
      );
    }

    await prisma.workOrderCancelReason.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف سبب الإلغاء بنجاح.",
    });
  } catch (error: any) {
    console.error("DELETE /api/work-order-cancel-reasons error:", error);
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