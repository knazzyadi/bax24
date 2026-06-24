import { NextResponse } from "next/server";


import { prisma } from '@/lib/prisma';
import { getSession, requirePermission } from '@/lib/auth-helper';



export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission("work_orders.update");

  const { id } = await params;
  const body = await req.json();
  const { completedAt, notes } = body;

  await prisma.workOrderAsset.updateMany({
    where: { workOrderId: id, completedAt: null },
    data: { completedAt: completedAt ? new Date(completedAt) : null, notes },
  });
  return NextResponse.json({ success: true });
}