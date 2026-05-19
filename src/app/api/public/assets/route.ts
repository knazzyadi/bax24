import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const token = searchParams.get("token");
    const roomId = searchParams.get("roomId");
    const typeId = searchParams.get("typeId");

    // التحقق من المعاملات الأساسية
    if (!slug || !token || !roomId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // التحقق من صحة الفرع وتفعيل البلاغات العامة
    const branch = await prisma.branch.findFirst({
      where: { slug, publicToken: token },
      select: { companyId: true, allowPublicTickets: true },
    });

    if (!branch || !branch.allowPublicTickets) {
      return NextResponse.json({ error: "Invalid branch or public tickets disabled" }, { status: 403 });
    }

    // بناء شرط البحث
    const whereClause: any = {
      roomId,
      companyId: branch.companyId,
      deletedAt: null,
    };
    if (typeId && typeId !== "all" && typeId !== "") {
      whereClause.typeId = typeId;
    }

    // جلب الأصول مع الحقول المطلوبة للواجهة
    const assets = await prisma.asset.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        typeId: true,      // ✅ مهم للفلترة في الواجهة
        statusId: true,    // ✅ قد تحتاجه لعرض الحالة
      },
      orderBy: { name: "asc" },
    });

    // إعادة الأصول بصيغة موحدة (يمكنك إضافة مفتاح `assets` لتوحيد الاستجابة)
    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Public assets API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}