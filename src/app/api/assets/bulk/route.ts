// src/app/api/assets/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { getErrorResponse } from "@/lib/assets/errors";
import { generateUniqueAssetCode } from "@/lib/selects/code-generator";

// ============================================================
// POST - إنشاء جماعي (استيراد CSV/Excel)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "معرف الشركة غير متوفر" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { buildingId, assets } = body;

    // ─── التحقق الأساسي من البيانات ──────────────────────────
    if (!buildingId || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        {
          error:
            "بيانات غير صالحة: يجب توفير buildingId وقائمة assets غير فارغة",
        },
        { status: 400 }
      );
    }

    // ─── التحقق من المبنى ────────────────────────────────────
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        branchId: true,
      },
    });

    if (!building) {
      return NextResponse.json(
        {
          error: "المبنى غير موجود أو غير مرتبط بالشركة الحالية",
        },
        { status: 404 }
      );
    }

    const branchId = building.branchId;
    if (!branchId) {
      return NextResponse.json(
        {
          error: "المبنى غير مرتبط بفرع",
        },
        { status: 400 }
      );
    }

    // ─── التحقق من بيانات الصفوف الأساسية ──────────────────
    const rowErrors: string[] = [];

    assets.forEach((asset, index) => {
      const rowNumber = index + 2;

      if (!asset?.name?.trim()) {
        rowErrors.push(`الصف ${rowNumber}: اسم الأصل مطلوب`);
      }
      if (!asset?.typeId) {
        rowErrors.push(`الصف ${rowNumber}: نوع الأصل مطلوب`);
      }
      if (!asset?.floorCode?.trim()) {
        rowErrors.push(`الصف ${rowNumber}: كود الدور مطلوب`);
      }
      if (!asset?.roomCode?.trim()) {
        rowErrors.push(`الصف ${rowNumber}: كود الغرفة مطلوب`);
      }
    });

    if (rowErrors.length > 0) {
      return NextResponse.json(
        {
          error: "يوجد أخطاء في بيانات الاستيراد",
          errors: rowErrors.map((message) => ({ message })),
        },
        { status: 400 }
      );
    }

    // ─── استخراج أكواد الأدوار والغرف المطلوبة ──────────────
    const floorCodes = [
      ...new Set(
        assets
          .map((asset) => asset.floorCode?.trim())
          .filter((code): code is string => typeof code === "string" && code.length > 0)
      ),
    ];

    const roomCodes = [
      ...new Set(
        assets
          .map((asset) => asset.roomCode?.trim())
          .filter((code): code is string => typeof code === "string" && code.length > 0)
      ),
    ];

    // ─── جلب جميع الأدوار المطلوبة دفعة واحدة ──────────────
    const floors = await prisma.floor.findMany({
      where: {
        buildingId,
        OR: [
          { code: { in: floorCodes } },
          { id: { in: floorCodes } },
        ],
      },
      select: {
        id: true,
        code: true,
      },
    });

    // ─── بناء floorMap يدعم البحث بالـ code أو id ──────────
    const floorMap = new Map<string, (typeof floors)[number]>();
    for (const floor of floors) {
      if (floor.code) {
        floorMap.set(floor.code.trim(), floor);
      }
      floorMap.set(floor.id, floor);
    }

    // ─── التحقق من وجود الأدوار ────────────────────────────
    const locationErrors: string[] = [];

    assets.forEach((asset, index) => {
      const rowNumber = index + 2;
      const floorCode = asset.floorCode?.trim();
      if (!floorCode) return;

      if (!floorMap.has(floorCode)) {
        locationErrors.push(
          `الصف ${rowNumber}: الدور "${floorCode}" غير موجود في المبنى المحدد`
        );
      }
    });

    if (locationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "بعض الأدوار غير موجودة",
          errors: locationErrors.map((message) => ({ message })),
        },
        { status: 400 }
      );
    }

    // ─── جلب جميع الغرف المطلوبة دفعة واحدة ────────────────
    const rooms = await prisma.room.findMany({
      where: {
        buildingId,
        deletedAt: null,
        OR: [
          { code: { in: roomCodes } },
          { id: { in: roomCodes } },
        ],
      },
      select: {
        id: true,
        code: true,
        floorId: true,
      },
    });

    // ─── بناء roomMap يدعم البحث بالـ code أو id ──────────
    const roomMap = new Map<string, (typeof rooms)[number]>();
    for (const room of rooms) {
      if (room.code) {
        roomMap.set(`${room.floorId}::${room.code.trim()}`, room);
      }
      roomMap.set(`${room.floorId}::${room.id}`, room);
    }

    // ─── التحقق من وجود الغرف في الأدوار الصحيحة ──────────
    assets.forEach((asset, index) => {
      const rowNumber = index + 2;
      const floorCode = asset.floorCode?.trim();
      const roomCode = asset.roomCode?.trim();

      if (!floorCode || !roomCode) return;

      const floor = floorMap.get(floorCode);
      if (!floor) return;

      const roomKey = `${floor.id}::${roomCode}`;
      const room = roomMap.get(roomKey);

      if (!room) {
        locationErrors.push(
          `الصف ${rowNumber}: الغرفة "${roomCode}" غير موجودة في الدور "${floorCode}"`
        );
      }
    });

    if (locationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "بعض الغرف غير موجودة أو غير مرتبطة بالأدوار المحددة",
          errors: locationErrors.map((message) => ({ message })),
        },
        { status: 400 }
      );
    }

    // ─── التحقق من أنواع الأصول (تدعم المعرف أو الكود) ────
    const typeValues = [
      ...new Set(
        assets
          .map((asset) => asset.typeId?.trim())
          .filter((val): val is string => typeof val === "string" && val.length > 0)
      ),
    ];

    if (typeValues.length === 0) {
      return NextResponse.json(
        {
          error: "يجب تحديد نوع الأصل لجميع الأصول",
        },
        { status: 400 }
      );
    }

    const types = await prisma.assetType.findMany({
      where: {
        companyId,
        OR: [{ id: { in: typeValues } }, { code: { in: typeValues } }],
      },
      select: {
        id: true,
        code: true,
      },
    });

    const typeMap = new Map<string, string>();

      for (const type of types) {
        typeMap.set(type.id, type.id);

        if (type.code) {
          typeMap.set(type.code, type.id);
        }
      }

    const missingTypes = typeValues.filter((val) => !typeMap.has(val));
    if (missingTypes.length > 0) {
      return NextResponse.json(
        {
          error: "بعض أنواع الأصول غير موجودة",
          errors: missingTypes.map((val) => ({
            message: `نوع الأصل غير موجود: "${val}"`,
          })),
        },
        { status: 400 }
      );
    }

    // ─── التحقق من حالات الأصول (تدعم المعرف أو الكود) ────
    const statusValues = [
      ...new Set(
        assets
          .map((asset) => asset.statusId?.trim())
          .filter((val): val is string => typeof val === "string" && val.length > 0)
      ),
    ];

    let statusMap = new Map<string, string>();

    if (statusValues.length > 0) {
      const statuses = await prisma.assetStatus.findMany({
        where: {
          companyId,
          OR: [{ id: { in: statusValues } }, { code: { in: statusValues } }],
        },
        select: {
          id: true,
          code: true,
        },
      });

      statusMap = new Map<string, string>();

        for (const status of statuses) {
          statusMap.set(status.id, status.id);

          if (status.code) {
            statusMap.set(status.code, status.id);
          }
        }

      const missingStatuses = statusValues.filter((val) => !statusMap.has(val));
      if (missingStatuses.length > 0) {
        return NextResponse.json(
          {
            error: "بعض حالات الأصول غير موجودة",
            errors: missingStatuses.map((val) => ({
              message: `حالة الأصل غير موجودة: "${val}"`,
            })),
          },
          { status: 400 }
        );
      }
    }

    // ─── إنشاء الأصول داخل Transaction ──────────────────────
    const result = await prisma.$transaction(
      async (tx) => {
        const createdAssets = [];

        for (let i = 0; i < assets.length; i++) {
          const assetData = assets[i];
          const rowNumber = i + 2;

          const floorCode = assetData.floorCode.trim();
          const roomCode = assetData.roomCode.trim();

          const floor = floorMap.get(floorCode);
          if (!floor) {
            throw new Error(`الصف ${rowNumber}: الدور "${floorCode}" غير موجود`);
          }

          const roomKey = `${floor.id}::${roomCode}`;
          const room = roomMap.get(roomKey);
          if (!room) {
            throw new Error(
              `الصف ${rowNumber}: الغرفة "${roomCode}" غير موجودة في الدور "${floorCode}"`
            );
          }

          const typeInput = assetData.typeId.trim();
          const actualTypeId = typeMap.get(typeInput);
          if (!actualTypeId) {
            throw new Error(`الصف ${rowNumber}: نوع الأصل "${typeInput}" غير موجود`);
          }

          let actualStatusId: string | null = null;
          const statusInput = assetData.statusId?.trim();
          if (statusInput) {
            const found = statusMap.get(statusInput);
            if (!found) {
              throw new Error(`الصف ${rowNumber}: حالة الأصل "${statusInput}" غير موجودة`);
            }
            actualStatusId = found;
          }

          const code = await generateUniqueAssetCode(tx, branchId, actualTypeId);

          const created = await tx.asset.create({
            data: {
              name: assetData.name?.trim() || "أصل بدون اسم",
              nameEn: assetData.nameEn?.trim() || null,
              description: assetData.description?.trim() || null,
              code,
              typeId: actualTypeId,
              statusId: actualStatusId,
              roomId: room.id,
              buildingId,
              branchId,
              companyId,
              serialNumber: assetData.serialNumber?.trim() || null,
              manufacturer: assetData.manufacturer?.trim() || null,
              model: assetData.model?.trim() || null,
              supplierId: assetData.supplierId || null,
              notes: assetData.notes?.trim() || null,
              purchaseDate: assetData.purchaseDate ? new Date(assetData.purchaseDate) : null,
              operationDate: assetData.operationDate ? new Date(assetData.operationDate) : null,
              warrantyEnd: assetData.warrantyEnd ? new Date(assetData.warrantyEnd) : null,
              lastMaintenanceDate: assetData.lastMaintenanceDate
                ? new Date(assetData.lastMaintenanceDate)
                : null,
            },
          });

          createdAssets.push(created);
        }

        return { createdAssets };
      },
      {
        timeout: 60000,
      }
    );

    return NextResponse.json({
      success: true,
      successCount: result.createdAssets.length,
      failCount: 0,
      assets: result.createdAssets,
    });
  } catch (error) {
    console.error("❌ خطأ في الاستيراد الجماعي:", error);
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

// ============================================================
// DELETE - حذف جماعي
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "معرف الشركة غير متوفر" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { assetIds, hard } = body;

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        {
          error: "يجب توفير قائمة معرفات الأصول",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const deletedIds: string[] = [];

        for (const id of assetIds) {
          try {
            const asset = await tx.asset.findUnique({
              where: { id },
              select: {
                id: true,
                deletedAt: true,
                companyId: true,
              },
            });

            if (
              !asset ||
              asset.deletedAt ||
              asset.companyId !== companyId
            ) {
              continue;
            }

            if (hard) {
              await tx.asset.delete({
                where: { id },
              });
            } else {
              await tx.asset.update({
                where: { id },
                data: {
                  deletedAt: new Date(),
                },
              });
            }

            deletedIds.push(id);
          } catch (err) {
            console.error(`فشل حذف الأصل ${id}:`, err);
          }
        }

        return {
          deletedCount: deletedIds.length,
          deletedIds,
        };
      }
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      deletedIds: result.deletedIds,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

// ============================================================
// PUT - تحديث جماعي
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "معرف الشركة غير متوفر" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { assetIds, data } = body;

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        {
          error: "يجب توفير قائمة معرفات الأصول",
        },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        {
          error: "يجب توفير بيانات التحديث",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        let updatedCount = 0;

        for (const id of assetIds) {
          try {
            const asset = await tx.asset.findUnique({
              where: { id },
              select: {
                id: true,
                deletedAt: true,
                companyId: true,
              },
            });

            if (
              !asset ||
              asset.deletedAt ||
              asset.companyId !== companyId
            ) {
              continue;
            }

            const updateData = { ...data };
            delete updateData.id;
            delete updateData.createdAt;
            delete updateData.updatedAt;

            if (updateData.purchaseDate) {
              updateData.purchaseDate = new Date(updateData.purchaseDate);
            }
            if (updateData.operationDate) {
              updateData.operationDate = new Date(updateData.operationDate);
            }
            if (updateData.warrantyEnd) {
              updateData.warrantyEnd = new Date(updateData.warrantyEnd);
            }
            if (updateData.lastMaintenanceDate) {
              updateData.lastMaintenanceDate = new Date(updateData.lastMaintenanceDate);
            }

            await tx.asset.update({
              where: { id },
              data: updateData,
            });

            updatedCount++;
          } catch (err) {
            console.error(`فشل تحديث الأصل ${id}:`, err);
          }
        }

        return {
          updatedCount,
        };
      }
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}