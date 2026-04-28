// src/lib/prisma-to-client.ts
/**
 * تحويل كائن الأصل من صيغة Prisma إلى صيغة مناسبة للعميل (Client)
 * - يحول التواريخ إلى سلاسل نصية (ISO string)
 * - يبسط الحقول المتداخلة (مثل room.floor.building)
 */
export function transformAsset(asset: any) {
  if (!asset) return null;

  return {
    id: asset.id,
    name: asset.name,
    nameEn: asset.nameEn,
    code: asset.code,
    type: asset.type
      ? {
          name: asset.type.name,
          nameEn: asset.type.nameEn,
        }
      : null,
    status: asset.status
      ? {
          name: asset.status.name,
          nameEn: asset.status.nameEn,
          color: asset.status.color,
        }
      : null,
    room: asset.room
      ? {
          name: asset.room.name,
          nameEn: asset.room.nameEn,
          floor: asset.room.floor
            ? {
                name: asset.room.floor.name,
                nameEn: asset.room.floor.nameEn,
                building: asset.room.floor.building
                  ? {
                      name: asset.room.floor.building.name,
                      nameEn: asset.room.floor.building.nameEn,
                    }
                  : null,
              }
            : null,
        }
      : null,
    purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString() : null,
    warrantyEnd: asset.warrantyEnd ? new Date(asset.warrantyEnd).toISOString() : null,
    createdAt: asset.createdAt ? new Date(asset.createdAt).toISOString() : null,
    updatedAt: asset.updatedAt ? new Date(asset.updatedAt).toISOString() : null,
  };
}

/**
 * تحويل قائمة الأصول (تُستخدم في صفحة القائمة)
 */
export function transformAssets(assets: any[]) {
  return assets.map(transformAsset);
}