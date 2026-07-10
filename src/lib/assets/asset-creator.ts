// src/lib/assets/asset-creator.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateUniqueAssetCode } from '@/lib/selects/code-generator'; // ✅ المسار الصحيح
import { assetAuditSelect, CreatedAsset } from './asset-select'; // ✅ المسار الصحيح

const MAX_RETRIES = 3;

interface CreateAssetInput {
  name: string;
  nameEn?: string;
  description?: string;
  typeId: string;
  statusId?: string;
  roomId: string;
  buildingId: string;
  branchId: string;
  companyId: string;
  purchaseDate?: Date;
  operationDate?: Date;
  warrantyEnd?: Date;
  lastMaintenanceDate?: Date;
  notes?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  supplier?: string;
}

export async function createAssetWithRetry(
  data: CreateAssetInput
): Promise<CreatedAsset> {
  const { companyId, branchId, typeId, ...rest } = data;

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      let asset: CreatedAsset | null = null;
      await prisma.$transaction(async (tx) => {
        const code = await generateUniqueAssetCode(tx, companyId, branchId, typeId);
        asset = await tx.asset.create({
          data: {
            ...rest,
            code,
            companyId,
            branchId,
          },
          select: assetAuditSelect,
        });
      });
      if (asset) return asset;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        if (attempt === MAX_RETRIES) {
          throw new Error('تعذر إنشاء الأصل بسبب تعارض في الكود، حاول مرة أخرى');
        }
        console.warn(`تعارض في الكود، إعادة المحاولة ${attempt}/${MAX_RETRIES}`);
      } else {
        throw error;
      }
    }
  }
  throw new Error('فشل إنشاء الأصل بعد عدة محاولات');
}