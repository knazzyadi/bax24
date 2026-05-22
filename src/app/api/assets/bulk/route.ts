import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { roomId, assets } = await request.json();

    if (!roomId || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // التحقق من وجود الغرفة وجلب المبنى والشركة
    const roomData = await prisma.room.findUnique({
      where: { id: roomId },
      include: { building: { include: { company: true } } }
    });
    if (!roomData) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    const buildingId = roomData.buildingId;
    const companyId = roomData.building.companyId;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdAssets = [];
      const errors: { index: number; message: string }[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        try {
          // 1. الحصول على البادئة الخاصة بنوع الأصل
          const assetType = await tx.assetType.findUnique({
            where: { id: asset.typeId },
            select: { code: true },
          });
          const prefix = assetType?.code || 'AST';

          // 2. زيادة العداد لهذا النوع والحصول على القيمة الجديدة
          const counter = await tx.assetCounter.upsert({
            where: { typeId: asset.typeId },
            update: { lastValue: { increment: 1 } },
            create: { typeId: asset.typeId, lastValue: 1000 },
          });

          // 3. توليد الكود المتسلسل (مثال: AST-1001)
          const code = `${prefix}-${counter.lastValue}`;

          // 4. إنشاء الأصل
          const newAsset = await tx.asset.create({
            data: {
              name: asset.name,
              nameEn: asset.nameEn || null,
              code,
              typeId: asset.typeId,
              statusId: asset.statusId || null,
              purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
              warrantyEnd: asset.warrantyEnd ? new Date(asset.warrantyEnd) : null,
              lastMaintenanceDate: asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : null,
              roomId: roomId,
              buildingId: buildingId,
              companyId: companyId,
              notes: asset.notes || null,
            },
          });
          createdAssets.push(newAsset);
        } catch (err: any) {
          errors.push({ index: i, message: err.message });
        }
      }
      return { createdAssets, errors };
    });

    return NextResponse.json({
      successCount: result.createdAssets.length,
      failCount: result.errors.length,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Bulk create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}