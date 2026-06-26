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
    let selectFields: Record<string, boolean> = {};

    // تحديد الحقول المطلوبة بناءً على modelType
    switch (modelType) {
      case 'assets':
        // تعريف الأعمدة المسموحة للنموذج
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
            room: assetFields.location ? { select: { name: true, nameEn: true } } : false,
            purchaseDate: assetFields.purchaseDate || false,
            warrantyEnd: assetFields.warrantyEnd || false,
            lastMaintenanceDate: assetFields.lastMaintenanceDate || false,
          },
          take: 100, // حد أقصى للعرض
        });

        data = assets.map((asset: any) => ({
          code: asset.code || '',
          name: asset.name || '',
          type: asset.type?.name || asset.type?.nameEn || '',
          status: asset.status?.name || asset.status?.nameEn || '',
          location: asset.room?.name || asset.room?.nameEn || '',
          purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('ar-SA') : '',
          warrantyEnd: asset.warrantyEnd ? new Date(asset.warrantyEnd).toLocaleDateString('ar-SA') : '',
          lastMaintenanceDate: asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString('ar-SA') : '',
        }));
        break;

      // أضف حالات أخرى حسب الحاجة (workOrders, tickets, inventory)
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