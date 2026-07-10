// src/lib/assets/code-generator.ts
import { Prisma } from '@prisma/client';

const CODE_DIGITS = 4;

export async function generateUniqueAssetCode(
  tx: Prisma.TransactionClient,
  companyId: string,
  branchId: string,
  typeId: string
): Promise<string> {
  const branch = await tx.branch.findUniqueOrThrow({
    where: { id: branchId },
    select: { code: true },
  });

  const assetType = await tx.assetType.findUniqueOrThrow({
    where: { id: typeId },
    select: { code: true },
  });

  const lastAsset = await tx.asset.findFirst({
    where: {
      companyId,
      branchId,
      typeId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastAsset?.code) {
    const match = lastAsset.code.match(/-(\d{4})$/);
    if (match) {
      nextNumber = Number.parseInt(match[1], 10) + 1;
    }
  }

  const padded = nextNumber.toString().padStart(CODE_DIGITS, '0');
  return `${branch.code}-${assetType.code}-${padded}`;
}