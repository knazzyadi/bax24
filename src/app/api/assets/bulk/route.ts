


import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { roomId, assets } = await request.json();

    // ==============================
    // Validation
    // ==============================
    if (!roomId || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    // ==============================
    // جلب بيانات الغرفة + المبنى + الفرع + الشركة
    // ==============================
    const roomData = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        building: {
          include: {
            branch: {
              select: {
                id: true,
                code: true,
              },
            },
            company: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!roomData) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const buildingId = roomData.buildingId;
    const companyId = roomData.building.company.id;
    const branchId = roomData.building.branchId;
    const branchCode = roomData.building.branch?.code?.trim().toUpperCase() || 'BR';

    if (!branchId) {
      return NextResponse.json(
        { error: 'Building has no branch associated' },
        { status: 400 }
      );
    }

    // ==============================
    // Transaction
    // ==============================
    const result = await prisma.$transaction(
      async (tx: TxClient) => {
        const createdAssets = [];
        const errors: { index: number; assetName?: string; message: string }[] = [];

        // ==============================
        // جلب جميع أنواع الأصول مرة واحدة
        // ==============================
        const assetTypes = await tx.assetType.findMany({
          select: { id: true, code: true },
        });
        const assetTypeMap = new Map(
          assetTypes.map((type) => [
            type.id,
            type.code?.trim().toUpperCase() || 'AST',
          ])
        );

        // ==============================
        // جلب الحالة الافتراضية للشركة (للحالات المفقودة أو غير الصالحة)
        // ==============================
        const defaultStatus = await tx.assetStatus.findFirst({
          where: { companyId, isDefault: true },
        });
        let fallbackStatusId = defaultStatus?.id;
        if (!fallbackStatusId) {
          const anyStatus = await tx.assetStatus.findFirst({ where: { companyId } });
          if (!anyStatus) {
            throw new Error('لا توجد حالات أصول مسجلة للشركة. يرجى إضافة حالة أولاً.');
          }
          fallbackStatusId = anyStatus.id;
        }

        // ==============================
        // Loop على الأصول
        // ==============================
        for (let i = 0; i < assets.length; i++) {
          const asset = assets[i];
          try {
            if (!asset.name?.trim()) throw new Error('Asset name is required');
            if (!asset.typeId) throw new Error('Asset type is required');

            const typePrefix = assetTypeMap.get(asset.typeId) || 'AST';

            // ==============================
            // التحقق من صحة statusId وتعيين الحالة الافتراضية إذا لزم الأمر
            // ==============================
            let validStatusId: string | null = null;
            if (asset.statusId) {
              const statusExists = await tx.assetStatus.findFirst({
                where: { id: asset.statusId, companyId },
              });
              if (statusExists) validStatusId = asset.statusId;
            }
            const finalStatusId = validStatusId || fallbackStatusId;

            // Atomic Counter
            const counter = await tx.assetCounter.upsert({
              where: {
                typeId_branchId: {
                  typeId: asset.typeId,
                  branchId: branchId,
                },
              },
              update: { lastValue: { increment: 1 } },
              create: { typeId: asset.typeId, branchId: branchId, lastValue: 1 },
            });

            const seqNumber = counter.lastValue;
            const paddedNumber = seqNumber.toString().padStart(4, '0');
            const code = `${branchCode}-${typePrefix}-${paddedNumber}`;

            const newAsset = await tx.asset.create({
              data: {
                name: asset.name.trim(),
                nameEn: asset.nameEn?.trim() || null,
                code,
                typeId: asset.typeId,
                statusId: finalStatusId,
                purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
                warrantyEnd: asset.warrantyEnd ? new Date(asset.warrantyEnd) : null,
                lastMaintenanceDate: asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : null,
                roomId,
                buildingId,
                companyId,
                branchId,
                notes: asset.notes?.trim() || null,
              },
            });

            createdAssets.push(newAsset);
          } catch (err: any) {
            console.error(`Asset import error at index ${i}:`, err);
            errors.push({
              index: i,
              assetName: asset?.name || 'Unknown',
              message: err?.message || 'Unknown error',
            });
          }
        }

        return { createdAssets, errors };
      },
      { timeout: 60000 } // Transaction timeout
    );

    return NextResponse.json({
      success: true,
      successCount: result.createdAssets.length,
      failCount: result.errors.length,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Bulk asset create fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
