// src/app/api/reports/export/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import * as XLSX from 'xlsx';

// ========== دالة لتنسيق التاريخ ==========
function formatDate(date?: Date | string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ar-SA');
}

type ExportRow = Record<string, string | number>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session;

    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بهذا الحساب' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { columns, modelType } = body;

    const savedReport = await prisma.savedReport.findFirst({
      where: {
        id,
        userId: session.userId,
        companyId: companyId,
      },
    });

    if (!savedReport) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    let data: ExportRow[] = [];
    switch (modelType) {
      case 'assets': {
        const assetFields: Record<string, boolean> = {};
        columns.forEach((col: string) => {
          if (col === 'type') assetFields.type = true;
          else if (col === 'status') assetFields.status = true;
          else if (col.includes('location') || col.includes('room') || col.includes('site')) {
            assetFields.room = true;
          } else assetFields[col] = true;
        });

        const assets = await prisma.asset.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          select: {
            code: true,
            name: true,
            nameEn: true,
            description: true,
            purchaseDate: true,
            warrantyEnd: true,
            lastMaintenanceDate: true,
            type: {
              select: {
                name: true,
                nameEn: true,
              },
            },
            status: {
              select: {
                name: true,
                nameEn: true,
              },
            },
            room: {
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
            },
          },
        });

        data = assets.map((asset) => {
          let locationAr = '';
          let locationEn = '';
          if (asset.room) {
            const buildingAr = asset.room.floor?.building?.name || '';
            const buildingEn = asset.room.floor?.building?.nameEn || '';
            const floorAr = asset.room.floor?.name || '';
            const floorEn = asset.room.floor?.nameEn || '';
            const roomAr = asset.room.name || '';
            const roomEn = asset.room.nameEn || '';
            locationAr = [buildingAr, floorAr, roomAr].filter(Boolean).join(' - ');
            locationEn = [buildingEn, floorEn, roomEn].filter(Boolean).join(' - ');
          }

          const row: ExportRow = {};

          if (assetFields.code) row['الكود'] = asset.code ?? '';
          if (assetFields.name) {
            row['الاسم (عربي)'] = asset.name ?? '';
            row['الاسم (إنجليزي)'] = asset.nameEn ?? '';
          }
          if (assetFields.description) {
            row['الوصف (عربي)'] = asset.description ?? '';
          }
          if (assetFields.type) {
            row['النوع (عربي)'] = asset.type?.name ?? '';
            row['النوع (إنجليزي)'] = asset.type?.nameEn ?? '';
          }
          if (assetFields.status) {
            row['الحالة (عربي)'] = asset.status?.name ?? '';
            row['الحالة (إنجليزي)'] = asset.status?.nameEn ?? '';
          }
          if (assetFields.room) {
            row['الموقع (عربي)'] = locationAr || 'لا يوجد موقع';
            row['الموقع (إنجليزي)'] = locationEn || 'No location';
          }
          if (assetFields.purchaseDate) row['تاريخ الشراء'] = formatDate(asset.purchaseDate);
          if (assetFields.warrantyEnd) row['نهاية الضمان'] = formatDate(asset.warrantyEnd);
          if (assetFields.lastMaintenanceDate) row['آخر صيانة'] = formatDate(asset.lastMaintenanceDate);

          return row;
        });
        break;
      }

      case 'workOrders': {
        const woFields: Record<string, boolean> = {};
        columns.forEach((col: string) => {
          if (col === 'priority') woFields.priority = true;
          else if (col === 'assetType') woFields.assetType = true;
          else woFields[col] = true;
        });

        const workOrders = await prisma.workOrder.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          select: {
            code: true,
            title: true,
            createdAt: true,
            priority: {
              select: {
                name: true,
                nameEn: true,
              },
            },
            status: {
              select: {
                name: true,
                nameEn: true,
              },
            },
            assetType: {
              select: {
                name: true,
                nameEn: true,
              },
            },
          },
        });

        data = workOrders.map((wo) => {
          const row: ExportRow = {};
          if (woFields.code) row['الكود'] = wo.code ?? '';
          if (woFields.title) row['العنوان'] = wo.title ?? '';
          if (woFields.priority) {
            row['الأولوية (عربي)'] = wo.priority?.name ?? '';
            row['الأولوية (إنجليزي)'] = wo.priority?.nameEn ?? '';
          }
          if (woFields.status) {
            row['الحالة (عربي)'] = wo.status?.name ?? '';
            row['الحالة (إنجليزي)'] = wo.status?.nameEn ?? '';
          }
          if (woFields.assetType) {
            row['نوع الأصل (عربي)'] = wo.assetType?.name ?? '';
            row['نوع الأصل (إنجليزي)'] = wo.assetType?.nameEn ?? '';
          }
          if (woFields.createdAt) row['تاريخ الإنشاء'] = formatDate(wo.createdAt);
          return row;
        });
        break;
      }

      case 'tickets': {
        const ticketFields: Record<string, boolean> = {};
        columns.forEach((col: string) => {
          if (col === 'type') ticketFields.type = true;
          else ticketFields[col] = true;
        });

        // التصحيح: إزالة الكتلة الزائدة واستخدام status كـ enum مباشرة
        const tickets = await prisma.ticket.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          select: {
            code: true,
            title: true,
            type: true,
            reporterName: true,
            createdAt: true,
            status: true, // status هو enum وليس علاقة
          },
        });

        data = tickets.map((ticket) => {
          const row: ExportRow = {};

          if (ticketFields.code) row['الكود'] = ticket.code ?? '';
          if (ticketFields.title) row['العنوان'] = ticket.title ?? '';
          if (ticketFields.status) row['الحالة'] = ticket.status ?? ''; // قيمة النص من الـ enum
          if (ticketFields.type) row['النوع'] = ticket.type ?? '';
          if (ticketFields.reporterName) row['اسم المبلغ'] = ticket.reporterName ?? '';
          if (ticketFields.createdAt) row['تاريخ الإنشاء'] = formatDate(ticket.createdAt);

          return row;
        });
        break;
      }

      case 'inventory': {
        const invFields: Record<string, boolean> = {};
        columns.forEach((col: string) => {
          invFields[col] = true;
        });

        const inventoryItems = await prisma.inventoryItem.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          select: {
            sku: true,
            name: true,
            nameEn: true,
            quantity: true,
            unit: true,
            room: {
              select: {
                name: true,
                nameEn: true,
              },
            },
          },
        });

        data = inventoryItems.map((item) => {
          const row: ExportRow = {};
          if (invFields.sku) row['SKU'] = item.sku ?? '';
          if (invFields.name) {
            row['الاسم (عربي)'] = item.name ?? '';
            row['الاسم (إنجليزي)'] = item.nameEn ?? '';
          }
          if (invFields.quantity) row['الكمية'] = item.quantity ?? 0;
          if (invFields.unit) row['الوحدة'] = item.unit ?? '';
          if (invFields.location) {
            row['الموقع (عربي)'] = item.room?.name ?? 'لا يوجد موقع';
            row['الموقع (إنجليزي)'] = item.room?.nameEn ?? 'No location';
          }
          return row;
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'نموذج غير مدعوم' }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات لتصديرها' },
        { status: 404 }
      );
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير');

    const cols = Object.keys(data[0] || {});
    worksheet['!cols'] = cols.map(() => ({ wch: 25 }));

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(savedReport.name)}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error('POST /api/reports/export/[id] error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'حدث خطأ أثناء تصدير التقرير';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}