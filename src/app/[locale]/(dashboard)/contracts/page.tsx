// src/app/[locale]/(dashboard)/contracts/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { startOfDay, isBefore } from 'date-fns';
import ContractsClient from './ContractsClient';
import type { Contract } from '@/types/contracts';

export default async function ContractsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  await requirePermission('contracts.read', session);

  const { locale } = await params;
  const { q, status } = await searchParams;

  const companyId = session.user.companyId!;
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
  const branchIds = session.user.branchIds || [];

  const where: any = { companyId, deletedAt: null };

  if (!isAdmin) {
    if (branchIds.length > 0) {
      where.branchId = { in: branchIds };
    } else {
      return (
        <ContractsClient
          initialContracts={[]}
          initialQ={q || ''}
          initialStatus={status || 'all'}
          locale={locale}
        />
      );
    }
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { supplier: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (status && status !== 'all') where.status = status;

  // ✅ جلب العقود مع المرفقات لحساب عددها
  let allContracts = await prisma.contract.findMany({
    where,
    include: {
      branch: true,
      attachments: { select: { id: true } }, // نجلب فقط المعرفات لتقليل البيانات
    },
    orderBy: { createdAt: 'desc' },
  });

  // تحديث الحالات تلقائياً
  const today = startOfDay(new Date());
  let updated = false;
  const updatedContracts = allContracts.map((contract: any) => {
    let newStatus = contract.status;
    if (contract.status === 'PENDING_REVIEW' && isBefore(startOfDay(contract.startDate), today)) {
      newStatus = 'ACTIVE';
      updated = true;
    } else if (contract.status === 'ACTIVE' && isBefore(startOfDay(contract.endDate), today)) {
      newStatus = 'EXPIRED';
      updated = true;
    }
    return { ...contract, status: newStatus };
  });

  if (updated) {
    await Promise.all(
      updatedContracts.map((contract: any) => {
        const original = allContracts.find((c: any) => c.id === contract.id);
        if (original && contract.status !== original.status) {
          return prisma.contract.update({
            where: { id: contract.id },
            data: { status: contract.status },
          });
        }
        return Promise.resolve();
      })
    );
    allContracts = updatedContracts;
  }

  // ✅ إضافة عدد المرفقات لكل عقد وإزالة `attachments` (نحتفظ فقط بالعدد)
  const contractsWithCount = allContracts.map((contract: any) => ({
    ...contract,
    attachmentsCount: contract.attachments.length,
    attachments: undefined, // نزيل المصفوفة لتخفيف الحجم
  }));

  return (
    <ContractsClient
      initialContracts={contractsWithCount}
      initialQ={q || ''}
      initialStatus={status || 'all'}
      locale={locale}
    />
  );
}