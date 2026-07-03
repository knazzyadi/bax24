// src/app/api/reports/export/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import * as XLSX from 'xlsx';

// ========== دالة لتنسيق التاريخ ==========
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA');
  } catch {
    return dateStr;
  }
}

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

    let data: any[] = [];

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

        const select: any = {};
        if (assetFields.code) select.code = true;
        if (assetFields.name) { select.name = true; select.nameEn = true; }
        if (assetFields.description) { select.description = true; select.descriptionEn = true; }
        if (assetFields.type) select.type = { select: { name: true, nameEn: true } };
        if (assetFields.status) select.status = { select: { name: true, nameEn: true } };
        if (assetFields.purchaseDate) select.purchaseDate = true;
        if (assetFields.warrantyEnd) select.warrantyEnd = true;
        if (assetFields.lastMaintenanceDate) select.lastMaintenanceDate = true;

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
          select.nameEn = true;
        }

        const assets = await prisma.asset.findMany({
          where: { companyId: companyId },
          select,
        });

        data = assets.map((asset: any) => {
          // بناء الموقع باللغتين
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

          const row: any = {};
          
          // ✅ الكود (منفرد)
          if (assetFields.code) row['الكود'] = asset.code || '';

          // ✅ الاسم: عمودين منفصلين
          if (assetFields.name) {
            row['الاسم (عربي)'] = asset.name || '';
            row['الاسم (إنجليزي)'] = asset.nameEn || '';
          }

          // ✅ الوصف: عمودين منفصلين
          if (assetFields.description) {
            row['الوصف (عربي)'] = asset.description || '';
            row['الوصف (إنجليزي)'] = asset.descriptionEn || '';
          }

          // ✅ النوع: عمودين منفصلين
          if (assetFields.type) {
            row['النوع (عربي)'] = asset.type?.name || '';
            row['النوع (إنجليزي)'] = asset.type?.nameEn || '';
          }

          // ✅ الحالة: عمودين منفصلين
          if (assetFields.status) {
            row['الحالة (عربي)'] = asset.status?.name || '';
            row['الحالة (إنجليزي)'] = asset.status?.nameEn || '';
          }

          // ✅ الموقع: عمودين منفصلين
          if (assetFields.room) {
            row['الموقع (عربي)'] = locationAr || 'لا يوجد موقع';
            row['الموقع (إنجليزي)'] = locationEn || 'No location';
          }

          // ✅ التواريخ (تنسيق عربي)
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

        const select: any = {};
        if (woFields.code) select.code = true;
        if (woFields.title) select.title = true;
        if (woFields.createdAt) select.createdAt = true;
        if (woFields.priority) select.priority = { select: { name: true, nameEn: true } };
        if (woFields.status) select.status = { select: { name: true, nameEn: true } };
        if (woFields.assetType) select.assetType = { select: { name: true, nameEn: true } };

        if (Object.keys(select).length === 0) {
          select.code = true;
          select.title = true;
        }

        const workOrders = await prisma.workOrder.findMany({
          where: { companyId: companyId },
          select,
        });

        data = workOrders.map((wo: any) => {
          const row: any = {};
          if (woFields.code) row['الكود'] = wo.code || '';
          if (woFields.title) row['العنوان'] = wo.title || '';
          if (woFields.priority) {
            row['الأولوية (عربي)'] = wo.priority?.name || '';
            row['الأولوية (إنجليزي)'] = wo.priority?.nameEn || '';
          }
          if (woFields.status) {
            row['الحالة (عربي)'] = wo.status?.name || '';
            row['الحالة (إنجليزي)'] = wo.status?.nameEn || '';
          }
          if (woFields.assetType) {
            row['نوع الأصل (عربي)'] = wo.assetType?.name || '';
            row['نوع الأصل (إنجليزي)'] = wo.assetType?.nameEn || '';
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

        const select: any = {};
        if (ticketFields.code) select.code = true;
        if (ticketFields.title) select.title = true;
        if (ticketFields.type) select.type = true;
        if (ticketFields.reporterName) select.reporterName = true;
        if (ticketFields.createdAt) select.createdAt = true;
        if (ticketFields.status) select.status = { select: { name: true, nameEn: true } };

        if (Object.keys(select).length === 0) {
          select.code = true;
          select.title = true;
        }

        const tickets = await prisma.ticket.findMany({
          where: { companyId: companyId },
          select,
        });

        data = tickets.map((ticket: any) => {
          const row: any = {};
          if (ticketFields.code) row['الكود'] = ticket.code || '';
          if (ticketFields.title) row['العنوان'] = ticket.title || '';
          if (ticketFields.status) {
            row['الحالة (عربي)'] = ticket.status?.name || '';
            row['الحالة (إنجليزي)'] = ticket.status?.nameEn || '';
          }
          if (ticketFields.type) row['النوع'] = ticket.type || '';
          if (ticketFields.reporterName) row['اسم المبلغ'] = ticket.reporterName || '';
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

        const select: any = {};
        if (invFields.sku) select.sku = true;
        if (invFields.name) { select.name = true; select.nameEn = true; }
        if (invFields.quantity) select.quantity = true;
        if (invFields.unit) select.unit = true;
        if (invFields.location) select.room = { select: { name: true, nameEn: true } };

        if (Object.keys(select).length === 0) {
          select.sku = true;
          select.name = true;
          select.nameEn = true;
        }

        const inventoryItems = await prisma.inventoryItem.findMany({
          where: { companyId: companyId },
          select,
        });

        data = inventoryItems.map((item: any) => {
          const row: any = {};
          if (invFields.sku) row['SKU'] = item.sku || '';
          if (invFields.name) {
            row['الاسم (عربي)'] = item.name || '';
            row['الاسم (إنجليزي)'] = item.nameEn || '';
          }
          if (invFields.quantity) row['الكمية'] = item.quantity || 0;
          if (invFields.unit) row['الوحدة'] = item.unit || '';
          if (invFields.location) {
            row['الموقع (عربي)'] = item.room?.name || 'لا يوجد موقع';
            row['الموقع (إنجليزي)'] = item.room?.nameEn || 'No location';
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

    // تنسيق الأعمدة
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
  } catch (error: any) {
    console.error('POST /api/reports/export/[id] error:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء تصدير التقرير' },
      { status: 500 }
    );
  }
}