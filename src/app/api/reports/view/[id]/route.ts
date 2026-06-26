// src/app/api/reports/view/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    const { id } = await params;

    // جلب التقرير المحفوظ
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

    const columns = JSON.parse(savedReport.columns);
    const modelType = savedReport.modelType;

    // بناء استعلام Prisma ديناميكي
    let data: any[] = [];

    // تحديد الحقول المطلوبة بناءً على modelType
    switch (modelType) {
      case 'assets': {
        const assetFields: Record<string, boolean> = {};
        columns.forEach((col: string) => {
          if (col === 'type') assetFields.type = true;
          else if (col === 'status') assetFields.status = true;
          else if (col === 'location') assetFields.room = true;
          else assetFields[col] = true;
        });

        const assets = await prisma.asset.findMany({
          where: { companyId: session.user.companyId! },
          select: {
            code: assetFields.code || false,
            name: assetFields.name || false,
            nameEn: assetFields.nameEn || false,
            type: assetFields.type ? { select: { name: true, nameEn: true } } : false,
            status: assetFields.status ? { select: { name: true, nameEn: true } } : false,
            room: assetFields.location ? {
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
          take: 100,
        });

        data = assets.map((asset: any) => {
          // بناء الموقع الكامل (المبنى - الدور - الغرفة)
          let location = '';
          if (asset.room) {
            const buildingName = asset.room.floor?.building?.name || asset.room.floor?.building?.nameEn || '';
            const floorName = asset.room.floor?.name || asset.room.floor?.nameEn || '';
            const roomName = asset.room.name || asset.room.nameEn || '';
            location = [buildingName, floorName, roomName].filter(Boolean).join(' - ');
          }
          if (!location) location = 'لا يوجد موقع';

          return {
            code: asset.code || '',
            name: asset.name || '',
            type: asset.type?.name || asset.type?.nameEn || '',
            status: asset.status?.name || asset.status?.nameEn || '',
            location: location,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('ar-SA') : '',
            warrantyEnd: asset.warrantyEnd ? new Date(asset.warrantyEnd).toLocaleDateString('ar-SA') : '',
            lastMaintenanceDate: asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString('ar-SA') : '',
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
          take: 100,
        });

        data = workOrders.map((wo: any) => ({
          code: wo.code || '',
          title: wo.title || '',
          priority: wo.priority?.name || wo.priority?.nameEn || '',
          status: wo.status?.name || wo.status?.nameEn || '',
          assetType: wo.assetType?.name || wo.assetType?.nameEn || '',
          createdAt: wo.createdAt ? new Date(wo.createdAt).toLocaleDateString('ar-SA') : '',
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
          take: 100,
        });

        data = tickets.map((ticket: any) => ({
          code: ticket.code || '',
          title: ticket.title || '',
          status: ticket.status?.name || ticket.status?.nameEn || '',
          type: ticket.type || '',
          reporterName: ticket.reporterName || '',
          createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('ar-SA') : '',
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
          take: 100,
        });

        data = inventoryItems.map((item: any) => ({
          sku: item.sku || '',
          name: item.name || '',
          quantity: item.quantity || 0,
          unit: item.unit || '',
          location: item.room?.name || item.room?.nameEn || 'لا يوجد موقع',
        }));
        break;
      }

      default:
        return NextResponse.json({ error: 'نموذج غير مدعوم' }, { status: 400 });
    }

    return NextResponse.json({
      id: savedReport.id,
      name: savedReport.name,
      description: savedReport.description,
      modelType,
      columns,
      data,
      createdAt: savedReport.createdAt,
      updatedAt: savedReport.updatedAt,
    });
  } catch (error: any) {
    console.error('GET /api/reports/view/[id] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}