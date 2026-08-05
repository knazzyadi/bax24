// src/app/api/reports/view/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import type { Prisma } from '@prisma/client';

type ReportRow = Record<string, unknown>;

type AssetReport = {
  code?: string | null;
  name?: string | null;
  type?: {
    name?: string | null;
    nameEn?: string | null;
  } | null;
  status?: {
    name?: string | null;
    nameEn?: string | null;
  } | null;
  room?: {
    name?: string | null;
    nameEn?: string | null;
    floor?: {
      name?: string | null;
      nameEn?: string | null;
      building?: {
        name?: string | null;
        nameEn?: string | null;
      } | null;
    } | null;
  } | null;
  purchaseDate?: Date | null;
  warrantyEnd?: Date | null;
  lastMaintenanceDate?: Date | null;
};

type WorkOrderReport = {
  code?: string | null;
  title?: string | null;
  createdAt?: Date | null;
  priority?: {
    name?: string | null;
    nameEn?: string | null;
  } | null;
  status?: {
    name?: string | null;
    nameEn?: string | null;
  } | null;
  assetType?: {
    name?: string | null;
    nameEn?: string | null;
  } | null;
};

// ✅ تم حذف TicketReport لأنه غير مستخدم (status هو enum وليس علاقة)

type InventoryReport = {
  sku?: string | null;
  name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  room?: {
    name?: string | null;
    nameEn?: string | null;
  } | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session;

    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بهذا الحساب' },
        { status: 400 }
      );
    }

    const { id } = await params;

    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 10);
    const skip = (page - 1) * limit;

    const savedReport = await prisma.savedReport.findFirst({
      where: {
        id,
        userId: session.userId,
        companyId,
      },
    });

    if (!savedReport) {
      return NextResponse.json(
        { error: 'التقرير غير موجود' },
        { status: 404 }
      );
    }

    const columns = JSON.parse(savedReport.columns) as string[];
    const modelType = savedReport.modelType;

    let data: ReportRow[] = [];
    let total = 0;

    switch (modelType) {

      case 'assets': {
        const assetFields: Record<string, boolean> = {};

        columns.forEach((col: string) => {
          if (col === 'type') {
            assetFields.type = true;
          } else if (col === 'status') {
            assetFields.status = true;
          } else if (
            col.includes('location') ||
            col.includes('room') ||
            col.includes('site')
          ) {
            assetFields.room = true;
          } else {
            assetFields[col] = true;
          }
        });

        total = await prisma.asset.count({
          where: {
            companyId,
            deletedAt: null,
          },
        });

        const select: Prisma.AssetSelect = {};

        if (assetFields.code) select.code = true;
        if (assetFields.name) select.name = true;
        if (assetFields.nameEn) select.nameEn = true;
        if (assetFields.purchaseDate) select.purchaseDate = true;
        if (assetFields.warrantyEnd) select.warrantyEnd = true;
        if (assetFields.lastMaintenanceDate) {
          select.lastMaintenanceDate = true;
        }

        if (assetFields.type) {
          select.type = {
            select: {
              name: true,
              nameEn: true,
            },
          };
        }

        if (assetFields.status) {
          select.status = {
            select: {
              name: true,
              nameEn: true,
            },
          };
        }

        if (assetFields.room) {
          select.room = {
            select: {
              name: true,
              nameEn: true,
              floor: {
                select: {
                  name: true,
                  nameEn: true,
                  building: {
                    select: {
                      name: true,
                      nameEn: true,
                    },
                  },
                },
              },
            },
          };
        }

        if (Object.keys(select).length === 0) {
          select.code = true;
          select.name = true;
        }

        const assets = await prisma.asset.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          select,
          skip,
          take: limit,
        });

        data = assets.map((asset) => {
          const item = asset as AssetReport;

          let location = '';

          if (item.room) {
            const buildingName =
              item.room.floor?.building?.name ||
              item.room.floor?.building?.nameEn ||
              '';

            const floorName =
              item.room.floor?.name ||
              item.room.floor?.nameEn ||
              '';

            const roomName =
              item.room.name ||
              item.room.nameEn ||
              '';

            location = [
              buildingName,
              floorName,
              roomName,
            ]
              .filter(Boolean)
              .join(' - ');
          }

          if (!location) {
            location = 'لا يوجد موقع';
          }

          return {
            code: item.code || '',
            name: item.name || '',
            type:
              item.type?.name ||
              item.type?.nameEn ||
              '',

            status:
              item.status?.name ||
              item.status?.nameEn ||
              '',

            location,

            purchaseDate: item.purchaseDate
              ? item.purchaseDate.toLocaleDateString('ar-SA')
              : '',

            warrantyEnd: item.warrantyEnd
              ? item.warrantyEnd.toLocaleDateString('ar-SA')
              : '',

            lastMaintenanceDate:
              item.lastMaintenanceDate
                ? item.lastMaintenanceDate.toLocaleDateString('ar-SA')
                : '',
          };
        });

        break;
      }

      case 'workOrders': {
        const woFields: Record<string, boolean> = {};

        columns.forEach((col: string) => {
          if (col === 'priority') {
            woFields.priority = true;
          } else if (col === 'assetType') {
            woFields.assetType = true;
          } else {
            woFields[col] = true;
          }
        });

        total = await prisma.workOrder.count({
          where: {
            companyId,
            deletedAt: null,
          },
        });

        const select: Prisma.WorkOrderSelect = {};

        if (woFields.code) {
          select.code = true;
        }

        if (woFields.title) {
          select.title = true;
        }

        if (woFields.createdAt) {
          select.createdAt = true;
        }

        if (woFields.priority) {
          select.priority = {
            select: {
              name: true,
              nameEn: true,
            },
          };
        }

        if (woFields.status) {
          select.status = {
            select: {
              name: true,
              nameEn: true,
            },
          };
        }

        if (woFields.assetType) {
          select.assetType = {
            select: {
              name: true,
              nameEn: true,
            },
          };
        }

        if (Object.keys(select).length === 0) {
          select.code = true;
          select.title = true;
        }

        const workOrders = await prisma.workOrder.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          select,
          skip,
          take: limit,
        });

        data = workOrders.map((wo) => {
          const item = wo as WorkOrderReport;

          return {
            code: item.code || '',
            title: item.title || '',

            priority:
              item.priority?.name ||
              item.priority?.nameEn ||
              '',

            status:
              item.status?.name ||
              item.status?.nameEn ||
              '',

            assetType:
              item.assetType?.name ||
              item.assetType?.nameEn ||
              '',

            createdAt: item.createdAt
              ? item.createdAt.toLocaleDateString('ar-SA')
              : '',
          };
        });

        break;
      }

      case 'tickets': {
        const ticketFields: Record<string, boolean> = {};

        columns.forEach((col: string) => {
          if (col === 'type') {
            ticketFields.type = true;
          } else {
            ticketFields[col] = true;
          }
        });

        total = await prisma.ticket.count({
          where: {
            companyId,
            deletedAt: null,
          },
        });

        const select: Prisma.TicketSelect = {};

        if (ticketFields.code) {
          select.code = true;
        }

        if (ticketFields.title) {
          select.title = true;
        }

        if (ticketFields.type) {
          select.type = true;
        }

        if (ticketFields.reporterName) {
          select.reporterName = true;
        }

        if (ticketFields.createdAt) {
          select.createdAt = true;
        }

        // ✅ تعديل: status هو حقل مباشر (enum) وليس علاقة
        if (ticketFields.status) {
          select.status = true;
        }

        if (Object.keys(select).length === 0) {
          select.code = true;
          select.title = true;
        }

        const tickets = await prisma.ticket.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          select,
          skip,
          take: limit,
        });

        data = tickets.map((ticket) => {
          // ✅ مباشرة نستخدم ticket.status (نص)
          return {
            code: ticket.code || '',
            title: ticket.title || '',
            status: ticket.status || '',  // ✅ قيمة نصية مباشرة
            type: ticket.type || '',
            reporterName: ticket.reporterName || '',
            createdAt: ticket.createdAt
              ? ticket.createdAt.toLocaleDateString('ar-SA')
              : '',
          };
        });

        break;
      }

      case 'inventory': {
        const invFields: Record<string, boolean> = {};

        columns.forEach((col: string) => {
          invFields[col] = true;
        });

        total = await prisma.inventoryItem.count({
          where: {
            companyId,
            deletedAt: null,
          },
        });

        const select: Prisma.InventoryItemSelect = {};

        if (invFields.sku) {
          select.sku = true;
        }

        if (invFields.name) {
          select.name = true;
        }

        if (invFields.quantity) {
          select.quantity = true;
        }

        if (invFields.unit) {
          select.unit = true;
        }

        if (invFields.location) {
          select.room = {
            select: {
              name: true,
              nameEn: true,
            },
          };
        }

        if (Object.keys(select).length === 0) {
          select.sku = true;
          select.name = true;
        }

        const inventoryItems =
          await prisma.inventoryItem.findMany({
            where: {
              companyId,
              deletedAt: null,
            },
            select,
            skip,
            take: limit,
          });

        data = inventoryItems.map((item) => {
          const inventory =
            item as InventoryReport;

          return {
            sku:
              inventory.sku || '',

            name:
              inventory.name || '',

            quantity:
              inventory.quantity || 0,

            unit:
              inventory.unit || '',

            location:
              inventory.room?.name ||
              inventory.room?.nameEn ||
              'لا يوجد موقع',
          };
        });

        break;
      }

      default:
        return NextResponse.json(
          { error: 'نموذج غير مدعوم' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      id: savedReport.id,
      name: savedReport.name,
      description: savedReport.description,
      modelType,
      columns,
      data,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      createdAt: savedReport.createdAt,
      updatedAt: savedReport.updatedAt,
    });

  } catch (error: unknown) {
    console.error(
      'GET /api/reports/view/[id] error:',
      error
    );

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}