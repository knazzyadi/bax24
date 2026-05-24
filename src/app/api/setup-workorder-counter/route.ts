import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "WorkOrderCounter" (
        "branchId" TEXT NOT NULL,
        "lastValue" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        CONSTRAINT "WorkOrderCounter_pkey" PRIMARY KEY ("branchId")
      );
    `;
    return NextResponse.json({ message: 'Table WorkOrderCounter created' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}