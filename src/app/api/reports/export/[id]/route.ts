// src/app/api/reports/export/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth-helper';
import * as XLSX from 'xlsx';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    const { id } = await params;
    const body = await request.json();
    const { columns, modelType } = body;

    // جلب التقرير المحفوظ للتحقق
    const savedReport = await prisma.savedReport.findFirst({
      where: {
        id,
        userId: session.user.id,
        companyId: session.user.companyId!,
      },
    });

    if (!savedReport) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    // جلب جميع البيانات (بدون ترقيم)
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

        // ✅ بناء كائن select ديناميكياً (بدون false)
        const select: any = {};
        if (assetFields.code) select.code = true;
        if (assetFields.name) select.name = true;
        if (assetFields.nameEn) select.nameEn = true;
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

        // ✅ إذا لم يتم تحديد أي حقل، نضيف الحقول الأساسية
        if (Object.keys(select).length === 0) {
          select.code = true;
          select.name = true;
        }

        const assets = await prisma.asset.findMany({
          where: { companyId: session.user.companyId! },
          select,
        });

        data = assets.map((asset: any) => {
          let location = '';
          if (asset.room) {
            const buildingName = asset.room.floor?.building?.name || asset.room.floor?.building?.nameEn || '';
            const floorName = asset.room.floor?.name || asset.room.floor?.nameEn || '';
            const roomName = asset.room.name || asset.room.nameEn || '';
            location = [buildingName, floorName, roomName].filter(Boolean).join(' - ');
          }
          if (!location) location = 'لا يوجد موقع';

          const row: any = {};
          if (assetFields.code) row['الكود'] = asset.code || '';
          if (assetFields.name) row['الاسم'] = asset.name || '';
          if (assetFields.type) row['النوع'] = asset.type?.name || asset.type?.nameEn || '';
          if (assetFields.status) row['الحالة'] = asset.status?.name || asset.status?.nameEn || '';
          if (assetFields.room) row['الموقع'] = location;
          if (assetFields.purchaseDate) row['تاريخ الشراء'] = asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('ar-SA') : '';
          if (assetFields.warrantyEnd) row['نهاية الضمان'] = asset.warrantyEnd ? new Date(asset.warrantyEnd).toLocaleDateString('ar-SA') : '';
          if (assetFields.lastMaintenanceDate) row['آخر صيانة'] = asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString('ar-SA') : '';
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
          where: { companyId: session.user.companyId! },
          select,
        });

        data = workOrders.map((wo: any) => {
          const row: any = {};
          if (woFields.code) row['الكود'] = wo.code || '';
          if (woFields.title) row['العنوان'] = wo.title || '';
          if (woFields.priority) row['الأولوية'] = wo.priority?.name || wo.priority?.nameEn || '';
          if (woFields.status) row['الحالة'] = wo.status?.name || wo.status?.nameEn || '';
          if (woFields.assetType) row['نوع الأصل'] = wo.assetType?.name || wo.assetType?.nameEn || '';
          if (woFields.createdAt) row['تاريخ الإنشاء'] = wo.createdAt ? new Date(wo.createdAt).toLocaleDateString('ar-SA') : '';
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
          where: { companyId: session.user.companyId! },
          select,
        });

        data = tickets.map((ticket: any) => {
          const row: any = {};
          if (ticketFields.code) row['الكود'] = ticket.code || '';
          if (ticketFields.title) row['العنوان'] = ticket.title || '';
          if (ticketFields.status) row['الحالة'] = ticket.status?.name || ticket.status?.nameEn || '';
          if (ticketFields.type) row['النوع'] = ticket.type || '';
          if (ticketFields.reporterName) row['اسم المبلغ'] = ticket.reporterName || '';
          if (ticketFields.createdAt) row['تاريخ الإنشاء'] = ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('ar-SA') : '';
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
        if (invFields.name) select.name = true;
        if (invFields.quantity) select.quantity = true;
        if (invFields.unit) select.unit = true;
        if (invFields.location) select.room = { select: { name: true, nameEn: true } };

        if (Object.keys(select).length === 0) {
          select.sku = true;
          select.name = true;
        }

        const inventoryItems = await prisma.inventoryItem.findMany({
          where: { companyId: session.user.companyId! },
          select,
        });

        data = inventoryItems.map((item: any) => {
          const row: any = {};
          if (invFields.sku) row['SKU'] = item.sku || '';
          if (invFields.name) row['الاسم'] = item.name || '';
          if (invFields.quantity) row['الكمية'] = item.quantity || 0;
          if (invFields.unit) row['الوحدة'] = item.unit || '';
          if (invFields.location) row['الموقع'] = item.room?.name || item.room?.nameEn || 'لا يوجد موقع';
          return row;
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'نموذج غير مدعوم' }, { status: 400 });
    }

    // ✅ التحقق من وجود بيانات
    if (data.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات لتصديرها' },
        { status: 404 }
      );
    }

    // إنشاء ملف Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير');

    // تنسيق الأعمدة للعربية
    const cols = Object.keys(data[0] || {});
    worksheet['!cols'] = cols.map(() => ({ wch: 20 }));

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