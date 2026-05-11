// src/app/api/tickets/[id]/images/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("tickets.read", session);

    const { id: ticketId } = await params;
    const companyId = session.user.companyId;

    // التأكد من أن التذكرة موجودة وتنتمي للشركة (ولم تحذف)
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, companyId, deletedAt: null },
      select: { id: true }, // نحتاج فقط للتأكد من الوجود
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    // جلب الصور المرتبطة بالتذكرة
    const images = await prisma.ticketImage.findMany({
      where: { ticketId },
      select: { id: true, url: true, createdAt: true }, // إضافة createdAt إن أردت الترتيب
      orderBy: { createdAt: "asc" }, // اختياري: ترتيب تصاعدي
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("GET /api/tickets/[id]/images error:", error);
    return NextResponse.json({ error: "خطأ في جلب الصور" }, { status: 500 });
  }
}