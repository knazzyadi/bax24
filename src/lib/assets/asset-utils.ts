// src/lib/assets/asset-utils.ts
import { prisma } from '@/lib/prisma';
import { ValidationError, NotFoundError } from '@/lib/assets/asset-errors';

export function validateDates(
  purchaseDate?: Date,
  operationDate?: Date,
  warrantyEnd?: Date
): void {
  if (purchaseDate && operationDate && operationDate < purchaseDate) {
    throw new ValidationError('تاريخ التشغيل لا يمكن أن يكون قبل تاريخ الشراء');
  }
  if (purchaseDate && warrantyEnd && warrantyEnd < purchaseDate) {
    throw new ValidationError('تاريخ انتهاء الضمان لا يمكن أن يكون قبل تاريخ الشراء');
  }
}

export function parseAssetDates(body: {
  purchaseDate?: string;
  operationDate?: string;
  warrantyEnd?: string;
  lastMaintenanceDate?: string;
}) {
  return {
    purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
    operationDate: body.operationDate ? new Date(body.operationDate) : undefined,
    warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : undefined,
    lastMaintenanceDate: body.lastMaintenanceDate
      ? new Date(body.lastMaintenanceDate)
      : undefined,
  };
}

export async function getRoomHierarchy(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      buildingId: true,
      building: { select: { branchId: true } },
    },
  });

  if (!room) {
    throw new NotFoundError('الغرفة غير موجودة');
  }

  if (!room.building?.branchId) {
    throw new ValidationError('الغرفة غير مرتبطة بفرع صالح');
  }

  return {
    room,
    buildingId: room.buildingId,
    branchId: room.building.branchId,
  };
}