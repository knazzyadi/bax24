import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission("work_orders.update", session);

  const { id, assetId } = await params;
  const body = await req.json();
  const { completedAt, notes } = body;

  const existing = await prisma.workOrderAsset.findUnique({
    where: { workOrderId_assetId: { workOrderId: id, assetId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.workOrderAsset.update({
    where: { workOrderId_assetId: { workOrderId: id, assetId } },
    data: { completedAt: completedAt ? new Date(completedAt) : null, notes },
  });
  return NextResponse.json(updated);
}