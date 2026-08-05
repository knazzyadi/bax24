// src/app/api/reports/preview/route.ts

import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// Types
// ============================================================

type ReportRow = Record<string, string | number | null>;

type Filter = {
  field: string;
  operator: 'contains' | 'eq' | 'gt' | 'lt';
  value: string;
};

// ============================================================
// GET: معاينة التقرير
// ============================================================

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const modelType = searchParams.get('modelType');
    const columnsParam = searchParams.get('columns');
    const filtersParam = searchParams.get('filters');

    if (!modelType || !columnsParam) {
      return NextResponse.json(
        {
          error: 'نوع النموذج والأعمدة مطلوبة',
        },
        {
          status: 400,
        }
      );
    }

    const columns = columnsParam.split(',');

    const filters: Filter[] = filtersParam
      ? JSON.parse(filtersParam)
      : [];

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        {
          error: 'لا توجد شركة مرتبطة',
        },
        {
          status: 400,
        }
      );
    }

    let data: ReportRow[] = [];
    switch (modelType) {
      case 'assets': {
        const assets = await prisma.asset.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            type: true,
            status: true,
            room: {
              include: {
                floor: {
                  include: {
                    building: true,
                  },
                },
              },
            },
          },
          take: 100,
        });

        data = assets.map((asset) => ({
          code: asset.code,
          name: asset.name,

          type:
            asset.type?.name ||
            '—',

          status:
            asset.status?.name ||
            '—',

          location: asset.room
            ? `${asset.room.floor?.building?.name || ''} - ${asset.room.floor?.name || ''} - ${asset.room.name}`
            : '—',

          purchaseDate:
            asset.purchaseDate
              ? asset.purchaseDate.toLocaleDateString('ar-SA')
              : '—',

          warrantyEnd:
            asset.warrantyEnd
              ? asset.warrantyEnd.toLocaleDateString('ar-SA')
              : '—',

          notes:
            asset.notes ||
            '—',
        }));

        break;
      }
      case 'workOrders': {
        const workOrders = await prisma.workOrder.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            priority: true,
            status: true,
            room: {
              include: {
                floor: {
                  include: {
                    building: true,
                  },
                },
              },
            },
          },
          take: 100,
        });

        data = workOrders.map((wo) => ({
          code:
            wo.code ||
            '—',

          title:
            wo.title,

          type:
            wo.type ||
            '—',

          priority:
            wo.priority?.name ||
            '—',

          status:
            wo.status?.name ||
            '—',

          asset:
            '—',

          location: wo.room
            ? `${wo.room.floor?.building?.name || ''} - ${wo.room.floor?.name || ''} - ${wo.room.name}`
            : '—',

          createdAt:
            wo.createdAt
              ? wo.createdAt.toLocaleDateString('ar-SA')
              : '—',
        }));

        break;
      }
      case 'tickets': {
        const tickets = await prisma.ticket.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            asset: true,
            branch: true,
          },
          take: 100,
        });

        data = tickets.map((ticket) => ({
          code:
            ticket.code ||
            '—',

          title:
            ticket.title,

          type:
            ticket.type ||
            '—',

          status:
            ticket.status ||
            '—',

          asset:
            ticket.asset?.name ||
            '—',

          reporter:
            ticket.reporterName ||
            '—',

          createdAt:
            ticket.createdAt
              ? ticket.createdAt.toLocaleDateString('ar-SA')
              : '—',
        }));

        break;
      }
      case 'inventory': {
        const inventory = await prisma.inventoryItem.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            room: {
              include: {
                floor: {
                  include: {
                    building: true,
                  },
                },
              },
            },
          },
          take: 100,
        });

        data = inventory.map((item) => ({
          sku:
            item.sku ||
            '—',

          name:
            item.name,

          quantity:
            item.quantity,

          minQuantity:
            item.minQuantity,

          unit:
            item.unit ||
            '—',

          location: item.room
            ? `${item.room.floor?.building?.name || ''} - ${item.room.floor?.name || ''} - ${item.room.name}`
            : '—',

          notes:
            item.notes ||
            '—',
        }));

        break;
      }
      case 'contracts': {
        const contracts = await prisma.contract.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            branch: true,
          },
          take: 100,
        });

        data = contracts.map((contract) => ({
          code:
            contract.code ||
            '—',

          title:
            contract.title,

          supplier:
            contract.supplier,

          value:
            contract.value,

          status:
            contract.status ||
            '—',

          startDate:
            contract.startDate
              ? contract.startDate.toLocaleDateString('ar-SA')
              : '—',

          endDate:
            contract.endDate
              ? contract.endDate.toLocaleDateString('ar-SA')
              : '—',
        }));

        break;
      }
      default:
        return NextResponse.json(
          {
            error: 'نموذج غير معروف',
          },
          {
            status: 400,
          }
        );
    }

    // ============================================================
    // تطبيق الفلاتر
    // ============================================================

    let filteredData = data;

    for (const filter of filters) {
      if (
        filter.value &&
        filter.value.trim() !== ''
      ) {
        filteredData = filteredData.filter(
          (row) => {
            const fieldValue = String(
              row[filter.field] ?? ''
            ).toLowerCase();

            const filterValue =
              filter.value.toLowerCase();

            switch (filter.operator) {
              case 'contains':
                return fieldValue.includes(
                  filterValue
                );

              case 'eq':
                return fieldValue === filterValue;

              case 'gt':
                return (
                  Number(fieldValue) >
                  Number(filterValue)
                );

              case 'lt':
                return (
                  Number(fieldValue) <
                  Number(filterValue)
                );

              default:
                return true;
            }
          }
        );
      }
    }


    // ============================================================
    // ترتيب حسب أول عمود
    // ============================================================

    if (columns.length > 0) {
      const firstColumn = columns[0];

      filteredData.sort(
        (a, b) => {
          const valueA =
            a[firstColumn] ?? '';

          const valueB =
            b[firstColumn] ?? '';

          return String(valueA).localeCompare(
            String(valueB)
          );
        }
      );
    }


    return NextResponse.json({
      data: filteredData,
      total: filteredData.length,
    });

  } catch (error: unknown) {
    console.error(
      'Preview error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'حدث خطأ';

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