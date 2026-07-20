// src/lib/assets/delete.ts
import { prisma } from '@/lib/prisma';
import { createAssetAudit } from '@/lib/audit/asset';
import { AuditAction } from '@/lib/audit/types';
import { ensureCanDeleteAsset, ensureAssetAccess, type AuthSession } from './permissions';
import { AssetValidationError, handlePrismaError } from './errors';

// ============================================================
// حذف أصل واحد (soft delete)
// ============================================================

export async function deleteAsset(
  session: AuthSession,
  assetId: string,
  options: { hard?: boolean } = { hard: false }
): Promise<{ success: boolean; message: string }> {
  try {
    ensureCanDeleteAsset(session);
    await ensureAssetAccess(session, assetId);

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        type: true,
        status: true,
        room: { include: { floor: { include: { building: true } } } },
        supplier: true,
      },
    });

    if (!asset) {
      throw new AssetValidationError('الأصل غير موجود');
    }

    await createAssetAudit(
      AuditAction.DELETE,
      assetId,
      session.userId,
      session.email,
      asset,
      null,
      { hard: options.hard }
    );

    if (options.hard) {
      await prisma.asset.delete({ where: { id: assetId } });
      return { success: true, message: 'تم حذف الأصل نهائياً' };
    } else {
      await prisma.asset.update({
        where: { id: assetId },
        data: { deletedAt: new Date() },
      });
      return { success: true, message: 'تم حذف الأصل' };
    }
  } catch (error) {
    throw handlePrismaError(error);
  }
}

// ============================================================
// حذف عدة أصول دفعة واحدة (bulk delete)
// ============================================================

export async function bulkDeleteAssets(
  session: AuthSession,
  assetIds: string[],
  options: { hard?: boolean } = { hard: false }
): Promise<{ success: boolean; count: number; message: string }> {
  try {
    ensureCanDeleteAsset(session);

    if (!assetIds || assetIds.length === 0) {
      throw new AssetValidationError('لم يتم تحديد أصول للحذف');
    }

    // جلب الأصول الصالحة للحذف
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        companyId: session.companyId!,
        deletedAt: null,
      },
      include: {
        type: true,
        status: true,
        room: { include: { floor: { include: { building: true } } } },
        supplier: true,
      },
    });

    if (assets.length === 0) {
      throw new AssetValidationError('لا توجد أصول صالحة للحذف');
    }

    // تسجيل التدقيق لكل أصل
    for (const asset of assets) {
      await createAssetAudit(
        AuditAction.DELETE,
        asset.id,
        session.userId,
        session.email,
        asset,
        null,
        { hard: options.hard, bulk: true }
      );
    }

    const idsToDelete = assets.map((a) => a.id);

    if (options.hard) {
      await prisma.asset.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    } else {
      await prisma.asset.updateMany({
        where: { id: { in: idsToDelete } },
        data: { deletedAt: new Date() },
      });
    }

    return {
      success: true,
      count: assets.length,
      message: `تم حذف ${assets.length} أصل بنجاح`,
    };
  } catch (error) {
    // إلقاء الخطأ بدلاً من إرجاعه لضمان توافق النوع
    throw handlePrismaError(error);
  }
}