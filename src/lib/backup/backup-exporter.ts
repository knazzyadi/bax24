// src/lib/backup/backup-exporter.ts
import { prisma } from "@/lib/prisma";
import type {
  BackupData,
  BackupPayload,
  BackupType,
  InspectionWithItems,
} from "./types";
import type { BackupRepository } from "./backup-repository";
const PAGE_SIZE = 5000;
const CONFIG_TABLES = new Set<keyof BackupData>([
  "assetTypes",
  "assetStatuses",
  "workOrderTypes",
  "workOrderStatuses",
  "workOrderPriorities",
  "inspections",
]);
async function fetchWithCursor<T extends { id: string }>(
  query: (cursor?: string) => Promise<T[]>
): Promise<T[]> {
  const result: T[] = [];

  let cursor: string | undefined;
  while (true) {
    const rows = await query(cursor);
    if (rows.length === 0) {
      break;
    }
    result.push(...rows);
    cursor = rows[rows.length - 1].id;
    if (rows.length < PAGE_SIZE) {
      break;
    }
  }
  return result;
}
export class BackupExporter {
  constructor(private readonly repository: BackupRepository) {}
  async exportToBuffer(
    companyId: string,
    type: BackupType
  ): Promise<Buffer> {
    const data = await this.fetchAllData(companyId, type);
    const payload: BackupPayload = {
      version: 1,
      createdAt: new Date().toISOString(),
      companyId,
      type,
      data,
    };
    return Buffer.from(
      JSON.stringify(payload, null, 2),
      "utf8"
    );
  }
  private async fetchAllData(
    companyId: string,
    type: BackupType
  ): Promise<Partial<BackupData>> {
    const result: Partial<BackupData> = {};

    if (type === "full") {
      result.company = await this.repository.getCompany(companyId);
      result.branches = await this.fetchBranches(companyId);
      result.buildings = await this.fetchBuildings(companyId);
      result.floors = await this.fetchFloors(companyId);
      result.rooms = await this.fetchRooms(companyId);
      result.assets = await this.fetchAssets(companyId);
      result.workOrders = await this.fetchWorkOrders(companyId);
    }
    result.assetTypes = await this.fetchAssetTypes(companyId);
    result.assetStatuses = await this.fetchAssetStatuses(companyId);
    result.workOrderTypes = await this.fetchWorkOrderTypes(companyId);
    result.workOrderStatuses = await this.fetchWorkOrderStatuses(companyId);
    result.workOrderPriorities = await this.fetchWorkOrderPriorities(companyId);
    result.inspections = await this.fetchInspections(companyId);

    return result;
  }
  private async fetchBranches(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.branch.findMany({
        where: {
          companyId,
          deletedAt: null,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchBuildings(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.building.findMany({
        where: {
          companyId,
          deletedAt: null,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchFloors(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.floor.findMany({
        where: {
          building: {
            companyId,
          },
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchRooms(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.room.findMany({
        where: {
          building: {
            companyId,
          },
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchAssets(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.asset.findMany({
        where: {
          companyId,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchAssetTypes(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.assetType.findMany({
        where: {
          companyId,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchAssetStatuses(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.assetStatus.findMany({
        where: {
          companyId,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchWorkOrderTypes(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.workOrderType.findMany({
        where: {
          companyId,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchWorkOrderStatuses(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.workOrderStatus.findMany({
        where: {
          companyId,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchWorkOrderPriorities(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.workOrderPriority.findMany({
        where: {
          companyId,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchWorkOrders(companyId: string) {
    return fetchWithCursor((cursor) =>
      prisma.workOrder.findMany({
        where: {
          companyId,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private async fetchInspections(
    companyId: string
  ): Promise<InspectionWithItems[]> {
    return fetchWithCursor((cursor) =>
      prisma.inspectionCategory.findMany({
        where: {
          companyId,
          deletedAt: null,
        },
        include: {
          items: true,
        },
        take: PAGE_SIZE,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: {
          id: "asc",
        },
      })
    );
  }
  private isConfigTable(key: keyof BackupData): boolean {
    return CONFIG_TABLES.has(key);
  }
}