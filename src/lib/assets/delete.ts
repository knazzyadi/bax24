// src/lib/assets/delete.ts

import { prisma } from '@/lib/prisma';
import { createAuditLog } from './audit';
import { ensureCanDeleteAsset, ensureAssetAccess, type AuthSession } from './permissions';
import { AssetValidationError, AssetBusinessError, handlePrismaError } from './errors';

// ============================================================
// حذف أصل واحد
// ============================================================

export async function deleteAsset(
  session: AuthSession,
  assetId: string,
  options?: { hard?: boolean }
): Promise<{ success: boolean; message: string }> {
  try {
    ensureCanDeleteAsset(session);
    await ensureAssetAccess(session, assetId);

    const asset = await prisma.asset.findUnique({
      where: { id: assetId, deletedAt: null },
      select: { id: true, name: true, code: true },
    });
    if (!asset) {
      throw new AssetValidationError('الأصل غير موجود');
    }

    // التحقق من الارتباطات
    const [workOrderAsset, ticket, scheduleAsset] = await Promise.all([
      prisma.workOrderAsset.findFirst({ where: { assetId }, select: { workOrderId: true } }),
      prisma.ticket.findFirst({ where: { assetId, deletedAt: null }, select: { id: true } }),
      prisma.scheduleAsset.findFirst({ where: { assetId }, select: { scheduleId: true } }),
    ]);

    const relations: string[] = [];
    if (workOrderAsset) relations.push('أمر عمل');
    if (ticket) relations.push('تذكرة');
    if (scheduleAsset) relations.push('جدول صيانة');

    if (relations.length > 0) {
      throw new AssetBusinessError(
        `لا يمكن حذف الأصل لأنه مرتبط بـ: ${relations.join('، ')}`
      );
    }

    if (options?.hard) {
      await prisma.asset.delete({ where: { id: assetId } });
      await createAuditLog(
        session.userId,
        assetId,
        'DELETE',
        null,
        { permanent: true, asset: { name: asset.name, code: asset.code } }
      );
      return { success: true, message: 'تم حذف الأصل نهائياً' };
    }

    await prisma.asset.update({
      where: { id: assetId },
      data: { deletedAt: new Date() },
    });
    await createAuditLog(
      session.userId,
      assetId,
      'DELETE',
      null,
      { permanent: false, asset: { name: asset.name, code: asset.code } }
    );
    return { success: true, message: 'تم حذف الأصل بشكل منطقي' };
  } catch (error) {
    throw handlePrismaError(error);
  }
}

// ============================================================
// حذف متعدد
// ============================================================

export async function bulkDeleteAssets(
  session: AuthSession,
  assetIds: string[],
  options?: { hard?: boolean }
): Promise<{ success: boolean; deletedCount: number; deletedIds: string[] }> {
  try {
    ensureCanDeleteAsset(session);

    const deletedIds: string[] = [];
    for (const id of assetIds) {
      try {
        const result = await deleteAsset(session, id, options);
        if (result.success) deletedIds.push(id);
      } catch (error) {
        console.error(`Failed to delete asset ${id}:`, error);
      }
    }

    return {
      success: true,
      deletedCount: deletedIds.length,
      deletedIds,
    };
  } catch (error) {
    throw handlePrismaError(error);
  }
}