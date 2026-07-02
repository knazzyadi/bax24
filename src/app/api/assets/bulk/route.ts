import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { roomId, assets } = await request.json();

    if (!roomId || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const roomData = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        building: {
          include: {
            branch: {
              select: { id: true, code: true },
            },
            company: { select: { id: true } },
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

    const result = await prisma.$transaction(
      async (tx: any) => {
        const createdAssets = [];
        const errors: { index: number; assetName?: string; message: string }[] = [];

        // جلب أنواع الأصول ورموزها
        const assetTypes = await tx.assetType.findMany({
          select: { id: true, code: true },
        });
        const assetTypeMap = new Map<string, string>(
          assetTypes.map((type: any) => [
            type.id,
            type.code?.trim().toUpperCase() || 'AST',
          ])
        );

        // الحالة الافتراضية
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

        // التحقق من الأكواد الموجودة للحصول على أعلى قيمة رقمية لكل نوع+فرع
        const existingAssets = await tx.asset.findMany({
          where: {
            branchId,
            companyId,
            code: { startsWith: `${branchCode}-` },
          },
          select: { code: true, typeId: true },
        });

        // حساب أعلى قيمة رقمية لكل نوع
        const maxSeqByType = new Map<string, number>();
        for (const asset of existingAssets) {
          const parts = asset.code.split('-');
          if (parts.length === 3) {
            const typePrefix = parts[1];
            const seqNum = parseInt(parts[2], 10);
            if (!isNaN(seqNum)) {
              for (const [typeId, prefix] of assetTypeMap) {
                if (prefix === typePrefix) {
                  const currentMax = maxSeqByType.get(typeId) || 0;
                  if (seqNum > currentMax) {
                    maxSeqByType.set(typeId, seqNum);
                  }
                  break;
                }
              }
            }
          }
        }

        // loop assets
        for (let i = 0; i < assets.length; i++) {
          const asset = assets[i];
          try {
            if (!asset.name?.trim()) throw new Error('Asset name is required');
            if (!asset.typeId) throw new Error('Asset type is required');

            const typePrefix = assetTypeMap.get(asset.typeId) || 'AST';

            // التحقق من صحة statusId
            let validStatusId: string | null = null;
            if (asset.statusId) {
              const statusExists = await tx.assetStatus.findFirst({
                where: { id: asset.statusId, companyId },
              });
              if (statusExists) validStatusId = asset.statusId;
            }
            const finalStatusId = validStatusId || fallbackStatusId;

            // استخدام القيمة القصوى من الأكواد الموجودة أو من counter
            let currentMax = maxSeqByType.get(asset.typeId) || 0;
            currentMax += 1;
            maxSeqByType.set(asset.typeId, currentMax);

            // تحديث الـ counter للحفاظ على المزامنة مستقبلاً
            await tx.assetCounter.upsert({
              where: {
                typeId_branchId: {
                  typeId: asset.typeId,
                  branchId: branchId,
                },
              },
              update: { lastValue: currentMax },
              create: { typeId: asset.typeId, branchId: branchId, lastValue: currentMax },
            });

            const paddedNumber = currentMax.toString().padStart(4, '0');
            const code = `${branchCode}-${typePrefix}-${paddedNumber}`;

            const newAsset = await tx.asset.create({
              data: {
                name: asset.name.trim(),
                nameEn: asset.nameEn?.trim() || null,
                description: asset.description?.trim() || null,        // ✅ وصف عربي
                descriptionEn: asset.descriptionEn?.trim() || null,    // ✅ وصف إنجليزي
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
      { timeout: 60000 }
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