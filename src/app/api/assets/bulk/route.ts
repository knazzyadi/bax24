import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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

    const branchCode =
      roomData.building.branch?.code?.trim().toUpperCase() || 'BR';

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
      async (tx: Prisma.TransactionClient) => {

        const createdAssets = [];
        const errors: {
          index: number;
          assetName?: string;
          message: string;
        }[] = [];

        // ==============================
        // جلب جميع أنواع الأصول مرة واحدة (Performance Optimization)
        // ==============================
        const assetTypes = await tx.assetType.findMany({
          select: {
            id: true,
            code: true,
          },
        });

        // تحويلها إلى Map للبحث السريع
        const assetTypeMap = new Map(
          assetTypes.map((type) => [
            type.id,
            type.code?.trim().toUpperCase() || 'AST',
          ])
        );

        // ==============================
        // Loop على الأصول
        // ==============================
        for (let i = 0; i < assets.length; i++) {

          const asset = assets[i];

          try {

            // ==============================
            // Validation داخلي
            // ==============================
            if (!asset.name?.trim()) {
              throw new Error('Asset name is required');
            }

            if (!asset.typeId) {
              throw new Error('Asset type is required');
            }

            // ==============================
            // Prefix النوع
            // ==============================
            const typePrefix =
              assetTypeMap.get(asset.typeId) || 'AST';

            // ==============================
            // Atomic Counter (مضاد للتكرار)
            // ==============================
            const counter = await tx.assetCounter.upsert({
              where: {
                typeId_branchId: {
                  typeId: asset.typeId,
                  branchId: branchId,
                },
              },

              update: {
                lastValue: {
                  increment: 1,
                },
              },

              create: {
                typeId: asset.typeId,
                branchId: branchId,
                lastValue: 1,
              },
            });

            // ==============================
            // الرقم التسلسلي الصحيح
            // ==============================
            const seqNumber = counter.lastValue;

            // ==============================
            // تنسيق الرقم
            // ==============================
            const paddedNumber = seqNumber
              .toString()
              .padStart(6, '0');

            // ==============================
            // الكود النهائي
            // مثال:
            // RUH-IT-000001
            // ==============================
            const code = `${branchCode}-${typePrefix}-${paddedNumber}`;

            // ==============================
            // إنشاء الأصل
            // ==============================
            const newAsset = await tx.asset.create({
              data: {
                name: asset.name.trim(),

                nameEn:
                  asset.nameEn?.trim() || null,

                code,

                typeId: asset.typeId,

                statusId:
                  asset.statusId || null,

                purchaseDate:
                  asset.purchaseDate
                    ? new Date(asset.purchaseDate)
                    : null,

                warrantyEnd:
                  asset.warrantyEnd
                    ? new Date(asset.warrantyEnd)
                    : null,

                lastMaintenanceDate:
                  asset.lastMaintenanceDate
                    ? new Date(asset.lastMaintenanceDate)
                    : null,

                roomId,
                buildingId,
                companyId,
                branchId,

                notes:
                  asset.notes?.trim() || null,
              },
            });

            createdAssets.push(newAsset);

          } catch (err: any) {

            console.error(
              `Asset import error at index ${i}:`,
              err
            );

            errors.push({
              index: i,
              assetName: asset?.name || 'Unknown',
              message:
                err?.message || 'Unknown error',
            });
          }
        }

        // ==============================
        // Return result
        // ==============================
        return {
          createdAssets,
          errors,
        };
      },

      // ==============================
      // Transaction timeout
      // ==============================
      {
        timeout: 60000,
      }
    );

    // ==============================
    // Final response
    // ==============================
    return NextResponse.json({
      success: true,

      successCount: result.createdAssets.length,

      failCount: result.errors.length,

      errors: result.errors,
    });

  } catch (error: any) {

    console.error(
      'Bulk asset create fatal error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}