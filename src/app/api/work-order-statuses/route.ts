// src/app/api/work-order-statuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedSession,
  checkPermission,
} from "@/lib/auth/auth-helper";

// ============================================================
// GET – جلب قائمة الحالات
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
      deletedAt: null, // استبعاد المحذوفين
    };
    if (session.role !== "SUPER_ADMIN") {
      where.companyId = session.companyId;
    } else if (companyIdParam) {
      where.companyId = companyIdParam;
    }

    const items = await prisma.workOrderStatus.findMany({
      where,
      orderBy: { order: "asc" },
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

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("GET /api/work-order-statuses error:", error);
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
// POST – إنشاء حالة جديدة
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

    // التحقق من عدم تكرار الاسم أو الكود
    const existing = await prisma.workOrderStatus.findFirst({
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
        { error: "يوجد حالة بنفس الاسم أو الكود بالفعل." },
        { status: 409 }
      );
    }

    const newItem = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.workOrderStatus.updateMany({
          where: {
            companyId: targetCompanyId,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      return tx.workOrderStatus.create({
        data: {
          name: name.trim(),
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          color: color || "#64748b",
          icon: icon?.trim() || null,
          order: typeof order === "number" ? order : 0,
          isDefault: isDefault === true,
          isActive: isActive ?? true,
          companyId: targetCompanyId,
        },
      });
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/work-order-statuses error:", error);
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
// PUT – تحديث حالة موجودة
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
      color,
      icon,
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

    const existingItem = await prisma.workOrderStatus.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
    });
    if (!existingItem) {
      return NextResponse.json(
        { error: "العنصر غير موجود." },
        { status: 404 }
      );
    }

    // التحقق من عدم تكرار الاسم أو الكود (باستثناء نفس العنصر)
    if (name || code) {
      const duplicate = await prisma.workOrderStatus.findFirst({
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
          { error: "يوجد حالة بنفس الاسم أو الكود بالفعل." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.workOrderStatus.updateMany({
          where: {
            companyId: targetCompanyId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return tx.workOrderStatus.update({
        where: { id },
        data: {
          name: name?.trim() ?? existingItem.name,
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          color: color || existingItem.color,
          icon: icon?.trim() || null,
          order: typeof order === "number" ? order : existingItem.order,
          isDefault: isDefault === true,
          isActive: isActive ?? existingItem.isActive,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/work-order-statuses error:", error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "لا تملك الصلاحية." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "حدث خطأ أثناء التحديث." },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE – حذف حالة (Soft Delete)
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

    const item = await prisma.workOrderStatus.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
    });
    if (!item) {
      return NextResponse.json(
        { error: "العنصر غير موجود." },
        { status: 404 }
      );
    }

    if (item.isDefault) {
      return NextResponse.json(
        { error: "لا يمكن حذف الحالة الافتراضية." },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود أوامر عمل مرتبطة
    const usedCount = await prisma.workOrder.count({
      where: { statusId: id, deletedAt: null },
    });
    if (usedCount > 0) {
      return NextResponse.json(
        { error: "لا يمكن الحذف لوجود أوامر عمل مرتبطة بهذه الحالة." },
        { status: 400 }
      );
    }

    // Soft Delete
    await prisma.workOrderStatus.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(
      { message: "تم الحذف بنجاح." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/work-order-statuses error:", error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "لا تملك الصلاحية." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "حدث خطأ أثناء الحذف." },
      { status: 500 }
    );
  }
}