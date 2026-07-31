// src/app/api/admin/company-backups/[id]/restore/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import type {
  Building,
  Floor,
  Room,
  Asset,
  WorkOrder,
  Inspection,
  AssetType,
  AssetStatus,
  WorkOrderType,
  WorkOrderStatus,
} from "@prisma/client";
// ============================================================
// تعريف الأنواع المستبعدة للحقول الزمنية
// ============================================================
type BackupBuilding = Omit<Building, "createdAt" | "updatedAt">;
type BackupFloor = Omit<Floor, "createdAt" | "updatedAt">;
type BackupRoom = Omit<Room, "createdAt" | "updatedAt">;
type BackupAsset = Omit<
  Asset,
  "createdAt" | "updatedAt" | "deletedAt"
>;
type BackupWorkOrder = Omit<
  WorkOrder,
  "createdAt" | "updatedAt" | "deletedAt"
>;
type BackupInspection = Omit<
  Inspection,
  "createdAt" | "updatedAt"
>;
// مهم: إزالة مشكلة code nullable
type BackupAssetType =
  Omit<AssetType, "createdAt" | "updatedAt"> & {
    code: string | null;
  };
type BackupAssetStatus =
  Omit<AssetStatus, "createdAt" | "updatedAt"> & {
    code: string | null;
  };
type BackupWorkOrderType =
  Omit<WorkOrderType, "createdAt" | "updatedAt"> & {
    code: string | null;
  };
type BackupWorkOrderStatus =
  Omit<WorkOrderStatus, "createdAt" | "updatedAt"> & {
    code: string | null;
  };
type BackupSettings = {
  assetTypes: BackupAssetType[];
  assetStatuses: BackupAssetStatus[];
  workOrderTypes: BackupWorkOrderType[];
  workOrderStatuses: BackupWorkOrderStatus[];
};
type BackupData = {
  buildings: BackupBuilding[];
  floors: BackupFloor[];
  rooms: BackupRoom[];
  assets: BackupAsset[];
  workOrders: BackupWorkOrder[];
  inspections: BackupInspection[];
  settings: BackupSettings;
};
// ============================================================
// دالة التحقق من صحة بيانات النسخة الاحتياطية
// ============================================================
function isBackupData(data: unknown): data is BackupData {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  const requiredKeys = [
    "buildings",
    "floors",
    "rooms",
    "assets",
    "workOrders",
    "inspections",
    "settings",
  ];
  for (const key of requiredKeys) {
    if (!(key in obj)) {
      return false;
    }
    if (key !== "settings" && !Array.isArray(obj[key])) {
      return false;
    }
  }
  const settings = obj.settings;
  if (typeof settings !== "object" || settings === null) {
    return false;
  }
  const settingsObj = settings as Record<string, unknown>;
  const settingsKeys = [
    "assetTypes",
    "assetStatuses",
    "workOrderTypes",
    "workOrderStatuses",
  ];
  for (const key of settingsKeys) {
    if (!(key in settingsObj) || !Array.isArray(settingsObj[key])) {
      return false;
    }
  }
  return true;
}
// ============================================================
// الدالة الرئيسية
// ============================================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const body = await req.json();
    const {
      restoreType,
      modules,
    } = body;
    const backup = await prisma.companyBackup.findUnique({
      where: {
        id,
      },
      include: {
        company: true,
      },
    });
    if (!backup) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      );
    }
    if (!backup.fileUrl) {
      return NextResponse.json(
        {
          error: "Backup file not found in storage",
        },
        {
          status: 404,
        }
      );
    }
    console.log(
      "🛡️ Creating safety backup..."
    );
    const safetyBackup =
      await createSafetyBackup(
        backup.companyId,
        session.userId
      );
    const response =
      await fetch(
        backup.fileUrl
      );
    if (!response.ok) {
      throw new Error(
        "Failed to download backup file"
      );
    }
    const rawData =
      await response.json();
    if (!isBackupData(rawData)) {
      throw new Error(
        "Invalid backup format: missing required fields"
      );
    }
    const jsonData = rawData;
    console.log(
      `🔄 Restoring type: ${restoreType}`
    );
    switch (restoreType) {
      case "full":
        await restoreFull(
          backup.companyId,
          jsonData
        );
        break;
      case "config":
        await restoreConfig(
          backup.companyId,
          jsonData
        );
        break;
      case "custom":
        await restoreCustom(
          backup.companyId,
          jsonData,
          modules
        );
        break;
      default:
        throw new Error(
          "Invalid restore type"
        );
    }
    await prisma.companyBackup.update({
      where: {
        id,
      },
      data: {
        restoredAt: new Date(),
        restoredById:
          session.userId,
      },
    });
    return NextResponse.json({
      message:
        "Backup restored successfully",
      safetyBackupId:
        safetyBackup.id,
    });
  } catch (error: unknown) {
    console.error(
      "Error restoring backup:",
      error
    );
    const message =
      error instanceof Error
        ? error.message
        : "Internal Server Error";
    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
// ============================================================
// إنشاء نسخة أمان قبل الاسترجاع
// ============================================================
async function createSafetyBackup(
  companyId: string,
  userId: string
) {
  const data = {
    company:
      await prisma.company.findUnique({
        where: {
          id: companyId,
        },
      }),
    buildings:
      await prisma.building.findMany({
        where: {
          companyId,
        },
      }),
    floors:
      await prisma.floor.findMany({
        where: {
          building: {
            companyId,
          },
        },
      }),
    rooms:
      await prisma.room.findMany({
        where: {
          floor: {
            building: {
              companyId,
            },
          },
        },
      }),
    assets:
      await prisma.asset.findMany({
        where: {
          companyId,
        },
      }),
    workOrders:
      await prisma.workOrder.findMany({
        where: {
          companyId,
        },
      }),
    inspections:
      await prisma.inspection.findMany({
        where: {
          companyId,
        },
      }),
    settings: {
      assetTypes:
        await prisma.assetType.findMany({
          where: {
            companyId,
          },
        }),
      assetStatuses:
        await prisma.assetStatus.findMany({
          where: {
            companyId,
          },
        }),
      workOrderTypes:
        await prisma.workOrderType.findMany({
          where: {
            companyId,
          },
        }),
      workOrderStatuses:
        await prisma.workOrderStatus.findMany({
          where: {
            companyId,
          },
        }),
    },
  };
  const jsonString =
    JSON.stringify(
      data,
      null,
      2
    );
  const fileName =
    `safety-backup-${companyId}-${Date.now()}.json`;
  const fileSize =
    Buffer.byteLength(
      jsonString,
      "utf8"
    );
  return await prisma.companyBackup.create({
    data: {
      companyId,
      fileName,
      fileUrl: null,
      fileSize,
      status: "COMPLETED",
      type: "FULL",
      createdById: userId,
    },
  });
}
// ============================================================
// دوال الاسترجاع الرئيسية
// ============================================================
async function restoreFull(
  companyId: string,
  data: BackupData
) {
  await restoreBuildings(
    companyId,
    data.buildings
  );
  await restoreFloors(
    data.floors
  );
  await restoreRooms(
    data.rooms
  );
  await restoreAssets(
    data.assets
  );
  await restoreWorkOrders(
    data.workOrders
  );
  await restoreInspections(
    data.inspections
  );
  await restoreSettings(
    companyId,
    data.settings
  );
}
async function restoreConfig(
  companyId: string,
  data: BackupData
) {
  await restoreSettings(
    companyId,
    data.settings
  );
}
async function restoreCustom(
  companyId: string,
  data: BackupData,
  modules: string[]
) {
  if (modules.includes("buildings")) {
    await restoreBuildings(
      companyId,
      data.buildings
    );
  }
  if (modules.includes("floors")) {
    await restoreFloors(
      data.floors
    );
  }
  if (modules.includes("rooms")) {
    await restoreRooms(
      data.rooms
    );
  }
  if (modules.includes("assets")) {
    await restoreAssets(
      data.assets
    );
  }
  if (modules.includes("workOrders")) {
    await restoreWorkOrders(
      data.workOrders
    );
  }
  if (modules.includes("inspections")) {
    await restoreInspections(
      data.inspections
    );
  }
  if (modules.includes("settings")) {
    await restoreSettings(
      companyId,
      data.settings
    );
  }
}
// ============================================================
// استرجاع الجداول
// ============================================================
async function restoreBuildings(
  companyId: string,
  buildings: BackupBuilding[]
) {
  for (const building of buildings) {
    await prisma.building.upsert({
      where: {
        id: building.id,
      },
      update: building,
      create: {
        ...building,
        companyId,
      },
    });
  }
}
async function restoreFloors(
  floors: BackupFloor[]
) {
  for (const floor of floors) {
    await prisma.floor.upsert({
      where: {
        id: floor.id,
      },
      update: floor,
      create: {
        ...floor,
      },
    });
  }
}
async function restoreRooms(
  rooms: BackupRoom[]
) {
  for (const room of rooms) {
    await prisma.room.upsert({
      where: {
        id: room.id,
      },
      update: room,
      create: {
        ...room,
      },
    });
  }
}
async function restoreAssets(
  assets: BackupAsset[]
) {
  for (const asset of assets) {
    await prisma.asset.upsert({
      where: {
        id: asset.id,
      },
      update: asset,
      create: {
        ...asset,
      },
    });
  }
}
async function restoreWorkOrders(
  workOrders: BackupWorkOrder[]
) {
  for (const wo of workOrders) {
    await prisma.workOrder.upsert({
      where: {
        id: wo.id,
      },
      update: wo,
      create: {
        ...wo,
      },
    });
  }
}
async function restoreInspections(
  inspections: BackupInspection[]
) {
  for (const inspection of inspections) {
    await prisma.inspection.upsert({
      where: {
        id: inspection.id,
      },
      update: inspection,
      create: {
        ...inspection,
      },
    });
  }
}
// ============================================================
// استرجاع الإعدادات
// ============================================================
async function restoreSettings(
  companyId: string,
  settings: BackupSettings
) {
  // Asset Types
  for (const type of settings.assetTypes) {
    if (!type.code) {
      continue;
    }
    await prisma.assetType.upsert({
      where: {
        companyId_code: {
          companyId,
          code: type.code,
        },
      },
      update: type,
      create: {
        ...type,
        companyId,
      },
    });
  }
  // Asset Statuses
  for (const status of settings.assetStatuses) {
    if (!status.code) {
      continue;
    }
    await prisma.assetStatus.upsert({
      where: {
        companyId_code: {
          companyId,
          code: status.code,
        },
      },
      update: status,
      create: {
        ...status,
        companyId,
      },
    });
  }
  // Work Order Types
  for (const type of settings.workOrderTypes) {
    if (!type.code) {
      continue;
    }
    await prisma.workOrderType.upsert({
      where: {
        companyId_code: {
          companyId,
          code: type.code,
        },
      },
      update: type,
      create: {
        ...type,
        companyId,
      },
    });
  }
  // Work Order Statuses
  for (const status of settings.workOrderStatuses) {
    if (!status.code) {
      continue;
    }
    await prisma.workOrderStatus.upsert({
      where: {
        companyId_code: {
          companyId,
          code: status.code,
        },
      },
      update: status,
      create: {
        ...status,
        companyId,
      },
    });
  }
}