import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AssetCounter" (
        "typeId" TEXT NOT NULL,
        "lastValue" INTEGER NOT NULL DEFAULT 1000,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        CONSTRAINT "AssetCounter_pkey" PRIMARY KEY ("typeId")
      );
    `;
    return NextResponse.json({ message: 'Table AssetCounter created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}