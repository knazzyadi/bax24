// src/app/api/assets/bulk/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog, AuditAction, buildAuditDTO } from '@/lib/audit-log';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { roomId, assets } = await request.json();

    if (!roomId || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة' },
        { status: 400 }
      );
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بالمستخدم' }, { status: 400 });
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
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    const buildingId = roomData.buildingId;
    const branchId = roomData.building.branchId;
    const branchCode = roomData.building.branch?.code?.trim().toUpperCase() || 'BR';

    if (!branchId) {
      return NextResponse.json(
        { error: 'المبنى غير مرتبط بفرع' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx: any) => {
        const createdAssets = [];
        const errors: { index: number; assetName?: string; message: string }[] = [];

        // ============================================================
        // 1. جلب أنواع الأصول والحالات للشركة (لتحويل الأسماء إلى معرفات)
        // ============================================================
        const assetTypes = await tx.assetType.findMany({
          where: { companyId },
          select: { id: true, name: true, nameEn: true, code: true },
        });

        // خرائط للتحويل: name → id, nameEn → id, code → id
        const typeNameToId = new Map<string, string>();
        const typeNameEnToId = new Map<string, string>();
        const typeCodeToId = new Map<string, string>();
        const typeIdToCode = new Map<string, string>();

        for (const t of assetTypes) {
          typeNameToId.set(t.name, t.id);
          if (t.nameEn) typeNameEnToId.set(t.nameEn, t.id);
          if (t.code) typeCodeToId.set(t.code.trim().toUpperCase(), t.id);
          typeIdToCode.set(t.id, t.code?.trim().toUpperCase() || 'AST');
        }

        const assetStatuses = await tx.assetStatus.findMany({
          where: { companyId },
          select: { id: true, name: true, nameEn: true },
        });

        const statusNameToId = new Map<string, string>();
        const statusNameEnToId = new Map<string, string>();
        for (const s of assetStatuses) {
          statusNameToId.set(s.name, s.id);
          if (s.nameEn) statusNameEnToId.set(s.nameEn, s.id);
        }

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

        // ============================================================
        // 2. حساب أعلى قيمة رقمية لكل نوع+فرع لتوليد الأكواد
        // ============================================================
        const existingAssets = await tx.asset.findMany({
          where: {
            branchId,
            companyId,
            code: { startsWith: `${branchCode}-` },
          },
          select: { code: true, typeId: true },
        });

        const maxSeqByType = new Map<string, number>();
        for (const asset of existingAssets) {
          const parts = asset.code.split('-');
          if (parts.length === 3) {
            const typePrefix = parts[1];
            const seqNum = parseInt(parts[2], 10);
            if (!isNaN(seqNum)) {
              for (const [typeId, prefix] of typeIdToCode) {
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

        // ============================================================
        // 3. معالجة كل أصل
        // ============================================================
        for (let i = 0; i < assets.length; i++) {
          const asset = assets[i];
          try {
            if (!asset.name?.trim()) throw new Error('اسم الأصل مطلوب');

            // ----- تحويل type إلى معرف -----
            let resolvedTypeId = asset.typeId;
            if (!resolvedTypeId && asset.type) {
              // حاول البحث بالاسم العربي، الإنجليزي، أو الكود
              resolvedTypeId =
                typeNameToId.get(asset.type) ||
                typeNameEnToId.get(asset.type) ||
                typeCodeToId.get(asset.type.trim().toUpperCase());
            }
            if (!resolvedTypeId) {
              errors.push({
                index: i,
                assetName: asset.name || 'غير معروف',
                message: `نوع الأصل غير موجود أو غير معروف: ${asset.type || asset.typeId || 'غير محدد'}`,
              });
              continue;
            }

            const typePrefix = typeIdToCode.get(resolvedTypeId) || 'AST';

            // ----- تحويل status إلى معرف (اختياري) -----
            let resolvedStatusId = asset.statusId;
            if (!resolvedStatusId && asset.status) {
              resolvedStatusId =
                statusNameToId.get(asset.status) ||
                statusNameEnToId.get(asset.status);
            }
            // إذا لم يتم العثور على حالة، نستخدم الحالة الافتراضية
            const finalStatusId = resolvedStatusId || fallbackStatusId;

            // ----- حساب الرقم التسلسلي التالي -----
            let currentMax = maxSeqByType.get(resolvedTypeId) || 0;
            currentMax += 1;
            maxSeqByType.set(resolvedTypeId, currentMax);

            // تحديث الـ counter
            await tx.assetCounter.upsert({
              where: {
                typeId_branchId: {
                  typeId: resolvedTypeId,
                  branchId: branchId,
                },
              },
              update: { lastValue: currentMax },
              create: { typeId: resolvedTypeId, branchId: branchId, lastValue: currentMax },
            });

            const paddedNumber = currentMax.toString().padStart(4, '0');
            const code = `${branchCode}-${typePrefix}-${paddedNumber}`;

            // ----- إنشاء الأصل -----
            const newAsset = await tx.asset.create({
              data: {
                name: asset.name.trim(),
                nameEn: asset.nameEn?.trim() || null,
                description: asset.description?.trim() || null,
                code,
                typeId: resolvedTypeId,
                statusId: finalStatusId,
                purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
                operationDate: asset.operationDate ? new Date(asset.operationDate) : null,
                warrantyEnd: asset.warrantyEnd ? new Date(asset.warrantyEnd) : null,
                lastMaintenanceDate: asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : null,
                serialNumber: asset.serialNumber?.trim() || null,
                manufacturer: asset.manufacturer?.trim() || null,
                model: asset.model?.trim() || null,
                supplier: asset.supplier?.trim() || null,
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
              assetName: asset?.name || 'غير معروف',
              message: err?.message || 'خطأ غير معروف',
            });
          }
        }

        // ============================================================
        // 4. تسجيل التدقيق (حدث واحد للمجموعة)
        // ============================================================
        try {
          await createAuditLog({
            action: AuditAction.CREATE,
            oldData: null,
            newData: {
              id: `bulk-${Date.now()}`,
              code: `BULK-${roomId}`,
              name: `استيراد جماعي لـ ${createdAssets.length} أصول`,
            },
            userId: session.userId,
            userEmail: session.email,
            metadata: { count: createdAssets.length, roomId, companyId },
          });
        } catch (auditError) {
          console.error('Audit log failed:', auditError);
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