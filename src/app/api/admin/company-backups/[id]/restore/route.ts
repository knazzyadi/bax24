// src/app/api/admin/company-backups/[id]/restore/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { BackupType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { restoreType, modules } = body;

    // 1️⃣ جلب سجل النسخة
    const backup = await prisma.companyBackup.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    if (!backup.fileUrl) {
      return NextResponse.json(
        { error: "Backup file not found in storage" },
        { status: 404 }
      );
    }

    // 2️⃣ إنشاء نسخة احتياطية تلقائية قبل الاسترجاع (Safety Backup)
    console.log("🛡️ Creating safety backup...");
    const safetyBackup = await createSafetyBackup(backup.companyId, session.userId);

    // 3️⃣ تحميل ملف النسخة
    const response = await fetch(backup.fileUrl);
    if (!response.ok) {
      throw new Error("Failed to download backup file");
    }
    const jsonData = await response.json();

    // 4️⃣ استرجاع البيانات حسب النوع
    console.log(`🔄 Restoring type: ${restoreType}`);
    switch (restoreType) {
      case "full":
        await restoreFull(backup.companyId, jsonData);
        break;
      case "config":
        await restoreConfig(backup.companyId, jsonData);
        break;
      case "custom":
        await restoreCustom(backup.companyId, jsonData, modules);
        break;
      default:
        throw new Error("Invalid restore type");
    }

    // 5️⃣ تسجيل عملية الاسترجاع
    await prisma.companyBackup.update({
      where: { id },
      data: {
        restoredAt: new Date(),
        restoredById: session.userId,
      },
    });

    return NextResponse.json({
      message: "Backup restored successfully",
      safetyBackupId: safetyBackup.id,
    });
  } catch (error: any) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ============================================================
// دوال مساعدة للاسترجاع
// ============================================================

async function createSafetyBackup(companyId: string, userId: string) {
  // جلب البيانات الحالية للشركة
  const data = {
    company: await prisma.company.findUnique({ where: { id: companyId } }),
    // ✅ تعديل استعلام الأدوار لاستخدام العلاقة مع building
    buildings: await prisma.building.findMany({ where: { companyId } }),
    floors: await prisma.floor.findMany({
      where: {
        building: {
          companyId,
        },
      },
    }),
    rooms: await prisma.room.findMany({
      where: {
        floor: {
          building: {
            companyId,
          },
        },
      },
    }),
    assets: await prisma.asset.findMany({ where: { companyId } }),
    workOrders: await prisma.workOrder.findMany({ where: { companyId } }),
    inspections: await prisma.inspection.findMany({ where: { companyId } }),
    settings: {
      assetTypes: await prisma.assetType.findMany({ where: { companyId } }),
      assetStatuses: await prisma.assetStatus.findMany({ where: { companyId } }),
      workOrderTypes: await prisma.workOrderType.findMany({ where: { companyId } }),
      workOrderStatuses: await prisma.workOrderStatus.findMany({ where: { companyId } }),
    },
  };

  const jsonString = JSON.stringify(data, null, 2);
  const fileName = `safety-backup-${companyId}-${Date.now()}.json`;
  const fileSize = Buffer.byteLength(jsonString, "utf8");

  // حفظ النسخة في قاعدة البيانات (بدون تخزين ملف فعلي للمساحة)
  return await prisma.companyBackup.create({
    data: {
      companyId,
      fileName,
      fileUrl: null, // سيتم رفع الملف لاحقاً
      fileSize,
      status: "COMPLETED",
      type: "FULL",
      createdById: userId,
    },
  });
}

async function restoreFull(companyId: string, data: any) {
  // استرجاع جميع الجداول
  await restoreBuildings(companyId, data.buildings || []);
  await restoreFloors(companyId, data.floors || []);
  await restoreRooms(companyId, data.rooms || []);
  await restoreAssets(companyId, data.assets || []);
  await restoreWorkOrders(companyId, data.workOrders || []);
  await restoreInspections(companyId, data.inspections || []);
  await restoreSettings(companyId, data.settings || {});
}

async function restoreConfig(companyId: string, data: any) {
  // استرجاع الإعدادات فقط
  await restoreSettings(companyId, data.settings || {});
}

async function restoreCustom(companyId: string, data: any, modules: string[]) {
  if (modules.includes("buildings")) await restoreBuildings(companyId, data.buildings || []);
  if (modules.includes("floors")) await restoreFloors(companyId, data.floors || []);
  if (modules.includes("rooms")) await restoreRooms(companyId, data.rooms || []);
  if (modules.includes("assets")) await restoreAssets(companyId, data.assets || []);
  if (modules.includes("workOrders")) await restoreWorkOrders(companyId, data.workOrders || []);
  if (modules.includes("inspections")) await restoreInspections(companyId, data.inspections || []);
  if (modules.includes("settings")) await restoreSettings(companyId, data.settings || {});
}

// ============================================================
// دوال استرجاع الجداول (مبسطة)
// ============================================================

async function restoreBuildings(companyId: string, buildings: any[]) {
  for (const building of buildings) {
    await prisma.building.upsert({
      where: { id: building.id },
      update: building,
      create: { ...building, companyId },
    });
  }
}

async function restoreFloors(companyId: string, floors: any[]) {
  for (const floor of floors) {
    await prisma.floor.upsert({
      where: { id: floor.id },
      update: floor,
      create: { ...floor },
    });
  }
}

async function restoreRooms(companyId: string, rooms: any[]) {
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: room,
      create: { ...room },
    });
  }
}

async function restoreAssets(companyId: string, assets: any[]) {
  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: asset,
      create: { ...asset },
    });
  }
}

async function restoreWorkOrders(companyId: string, workOrders: any[]) {
  for (const wo of workOrders) {
    await prisma.workOrder.upsert({
      where: { id: wo.id },
      update: wo,
      create: { ...wo },
    });
  }
}

async function restoreInspections(companyId: string, inspections: any[]) {
  for (const inspection of inspections) {
    await prisma.inspection.upsert({
      where: { id: inspection.id },
      update: inspection,
      create: { ...inspection },
    });
  }
}

async function restoreSettings(companyId: string, settings: any) {
  // استرجاع أنواع الأصول
  for (const type of settings.assetTypes || []) {
    await prisma.assetType.upsert({
      where: { companyId_code: { companyId, code: type.code } },
      update: type,
      create: { ...type, companyId },
    });
  }

  // استرجاع حالات الأصول
  for (const status of settings.assetStatuses || []) {
    await prisma.assetStatus.upsert({
      where: { companyId_code: { companyId, code: status.code } },
      update: status,
      create: { ...status, companyId },
    });
  }

  // استرجاع أنواع أوامر العمل
  for (const type of settings.workOrderTypes || []) {
    await prisma.workOrderType.upsert({
      where: { companyId_code: { companyId, code: type.code } },
      update: type,
      create: { ...type, companyId },
    });
  }

  // استرجاع حالات أوامر العمل
  for (const status of settings.workOrderStatuses || []) {
    await prisma.workOrderStatus.upsert({
      where: { companyId_code: { companyId, code: status.code } },
      update: status,
      create: { ...status, companyId },
    });
  }
}