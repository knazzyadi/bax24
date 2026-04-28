// src/app/[locale]/(dashboard)/inventory/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import InventoryClient from './InventoryClient';
import type { InventoryItem } from './types';

export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  await requirePermission('assets.read', session);

  const { locale } = await params;
  const { q, status = 'all' } = await searchParams; // نستخدم status للفلترة المحلية

  const companyId = session.user.companyId!;
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
  const branchIds = session.user.branchIds || [];

  // بناء شرط الفلترة حسب الفروع
  const branchFilter: any = {};
  if (!isAdmin) {
    if (branchIds.length > 0) {
      branchFilter.room = {
        floor: {
          building: {
            branchId: { in: branchIds }
          }
        }
      };
    } else {
      // لا فروع → قائمة فارغة
      return (
        <InventoryClient
          initialItems={[]}
          initialSearch={q || ''}
          initialStatus={status}
          locale={locale}
        />
      );
    }
  }

  // جلب جميع أصناف المخزون (مع العلاقات)
  const items = await prisma.inventoryItem.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...branchFilter,
    },
    include: {
      room: {
        include: {
          floor: {
            include: { building: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' },
  });

  // تحويل التواريخ إلى سلاسل
  const serializedItems: InventoryItem[] = items.map((item: any) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <InventoryClient
      initialItems={serializedItems}
      initialSearch={q || ''}
      initialStatus={status}
      locale={locale}
    />
  );
}