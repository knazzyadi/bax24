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

        const assets = await prisma.asset.findMany({
          where: { companyId: session.user.companyId! },
          select: {
            code: assetFields.code || false,
            name: assetFields.name || false,
            nameEn: assetFields.nameEn || false,
            type: assetFields.type ? { select: { name: true, nameEn: true } } : false,
            status: assetFields.status ? { select: { name: true, nameEn: true } } : false,
            room: assetFields.room ? {
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
                      }
                    }
                  }
                }
              }
            } : false,
            purchaseDate: assetFields.purchaseDate || false,
            warrantyEnd: assetFields.warrantyEnd || false,
            lastMaintenanceDate: assetFields.lastMaintenanceDate || false,
          },
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

          return {
            الكود: asset.code || '',
            الاسم: asset.name || '',
            النوع: asset.type?.name || asset.type?.nameEn || '',
            الحالة: asset.status?.name || asset.status?.nameEn || '',
            الموقع: location,
            'تاريخ الشراء': asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('ar-SA') : '',
            'نهاية الضمان': asset.warrantyEnd ? new Date(asset.warrantyEnd).toLocaleDateString('ar-SA') : '',
            'آخر صيانة': asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString('ar-SA') : '',
          };
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
          where: { companyId: session.user.companyId! },
          select: {
            code: woFields.code || false,
            title: woFields.title || false,
            priority: woFields.priority ? { select: { name: true, nameEn: true } } : false,
            status: woFields.status ? { select: { name: true, nameEn: true } } : false,
            assetType: woFields.assetType ? { select: { name: true, nameEn: true } } : false,
            createdAt: woFields.createdAt || false,
          },
        });

        data = workOrders.map((wo: any) => ({
          الكود: wo.code || '',
          العنوان: wo.title || '',
          الأولوية: wo.priority?.name || wo.priority?.nameEn || '',
          الحالة: wo.status?.name || wo.status?.nameEn || '',
          'نوع الأصل': wo.assetType?.name || wo.assetType?.nameEn || '',
          'تاريخ الإنشاء': wo.createdAt ? new Date(wo.createdAt).toLocaleDateString('ar-SA') : '',
        }));
        break;
      }

      case 'tickets': {
        const ticketFields: Record<string, boolean> = {};
        columns.forEach((col: string) => {
          if (col === 'type') ticketFields.type = true;
          else ticketFields[col] = true;
        });

        const tickets = await prisma.ticket.findMany({
          where: { companyId: session.user.companyId! },
          select: {
            code: ticketFields.code || false,
            title: ticketFields.title || false,
            status: ticketFields.status ? { select: { name: true, nameEn: true } } : false,
            type: ticketFields.type || false,
            reporterName: ticketFields.reporterName || false,
            createdAt: ticketFields.createdAt || false,
          },
        });

        data = tickets.map((ticket: any) => ({
          الكود: ticket.code || '',
          العنوان: ticket.title || '',
          الحالة: ticket.status?.name || ticket.status?.nameEn || '',
          النوع: ticket.type || '',
          'اسم المبلغ': ticket.reporterName || '',
          'تاريخ الإنشاء': ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('ar-SA') : '',
        }));
        break;
      }

      case 'inventory': {
        const invFields: Record<string, boolean> = {};
        columns.forEach((col: string) => {
          invFields[col] = true;
        });

        const inventoryItems = await prisma.inventoryItem.findMany({
          where: { companyId: session.user.companyId! },
          select: {
            sku: invFields.sku || false,
            name: invFields.name || false,
            quantity: invFields.quantity || false,
            unit: invFields.unit || false,
            room: invFields.location ? { select: { name: true, nameEn: true } } : false,
          },
        });

        data = inventoryItems.map((item: any) => ({
          SKU: item.sku || '',
          الاسم: item.name || '',
          الكمية: item.quantity || 0,
          الوحدة: item.unit || '',
          الموقع: item.room?.name || item.room?.nameEn || 'لا يوجد موقع',
        }));
        break;
      }

      default:
        return NextResponse.json({ error: 'نموذج غير مدعوم' }, { status: 400 });
    }

    // إنشاء ملف Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير');
    
    // تنسيق الأعمدة للعربية
    worksheet['!cols'] = columns.map(() => ({ wch: 20 }));

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${savedReport.name}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('POST /api/reports/export/[id] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تصدير التقرير' },
      { status: 500 }
    );
  }
}