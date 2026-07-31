import { prisma } from '@/lib/prisma';

export async function generateAssetPreviewCode(
  branchId: string,
  typeId: string
): Promise<string> {
  const assetType = await prisma.assetType.findUnique({
    where: { id: typeId },
    select: { code: true },
  });

  if (!assetType?.code) {
    throw new Error('نوع الأصل غير موجود');
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });

  if (!branch?.code) {
    throw new Error('الفرع غير موجود');
  }

  const counter = await prisma.assetCounter.findUnique({
    where: {
      typeId_branchId: {
        typeId,
        branchId,
      },
    },
  });

  const nextNumber = (counter?.lastValue ?? 0) + 1;

  return `${branch.code}-${assetType.code}-${String(nextNumber).padStart(4, '0')}`;
}