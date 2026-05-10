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

    const { id } = await params;
    const companyId = session.user.companyId;

    const ticket = await prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    const images = await prisma.ticketImage.findMany({
      where: { ticketId: id },
      select: { id: true, url: true },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("GET /api/tickets/[id]/images error:", error);
    return NextResponse.json({ error: "خطأ في جلب الصور" }, { status: 500 });
  }
}