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

  // جلب العقود مع البيانات المطلوبة (بما فيها حقول المندوب والمرفقات)
  let allContracts = await prisma.contract.findMany({
    where,
    include: {
      branch: true,
      attachments: { select: { id: true } },
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

  // تحويل البيانات لـ ContractsClient مع إضافة عدد المرفقات وحقول المندوب
  const contractsWithCount = allContracts.map((contract: any) => ({
    id: contract.id,
    code: contract.code,
    title: contract.title,
    supplier: contract.supplier,
    value: contract.value,
    startDate: contract.startDate,
    endDate: contract.endDate,
    description: contract.description,
    status: contract.status,
    cancellationReason: contract.cancellationReason,
    notes: contract.notes,
    branchId: contract.branchId,
    branch: contract.branch,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    // ✅ إضافة حقول المندوب
    agentName: contract.agentName,
    agentPhone: contract.agentPhone,
    agentEmail: contract.agentEmail,
    // ✅ إضافة عدد المرفقات
    type: contract.type,
    attachmentsCount: contract.attachments?.length || 0,
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