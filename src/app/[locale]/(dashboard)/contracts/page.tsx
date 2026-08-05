// src/app/[locale]/(dashboard)/contracts/page.tsx

import { redirect } from 'next/navigation';
import { startOfDay, isBefore } from 'date-fns';
import type { Prisma, ContractStatus } from '@prisma/client';

import { getAuthSession, requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

import ContractsClient from './ContractsClient';

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

// تعريف نوع ContractStatus المحلي المطابق لـ ContractsClient
type ContractStatusUnion = 'PENDING_REVIEW' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

// تعريف نوع مطابق تماماً لـ Contract في ContractsClient
type LocalContract = {
  id: string;
  code: string;
  title: string;
  supplier: string;
  value: number;
  startDate: string;
  endDate: string;
  description: string | null;
  status: ContractStatusUnion; // استخدام النوع الحرفي
  cancellationReason: string | null;
  notes: string | null;
  branchId: string | null;
  branch: {
    id: string;
    code: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  agentName: string | null;
  agentPhone: string | null;
  agentEmail: string | null;
  type: string | null;
  attachmentsCount: number;
};

export default async function ContractsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  await requirePermission('contracts.read');

  const { locale } = await params;
  const { q, status } = await searchParams;

  const companyId = session.companyId!;
  const isAdmin = session.isAdmin;
  const branchIds = session.branchIds ?? [];

  const where: Prisma.ContractWhereInput = {
    companyId,
    deletedAt: null,
    ...(status && status !== 'all'
      ? { status: status as ContractStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { supplier: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(!isAdmin
      ? {
          branchId:
            branchIds.length > 0 ? { in: branchIds } : undefined,
        }
      : {}),
  };

  if (!isAdmin && branchIds.length === 0) {
    return (
      <ContractsClient
        initialContracts={[]}
        initialQ={q ?? ''}
        initialStatus={status ?? 'all'}
        locale={locale}
      />
    );
  }

  const allContracts = await prisma.contract.findMany({
    where,
    select: {
      id: true,
      code: true,
      title: true,
      supplier: true,
      value: true,
      startDate: true,
      endDate: true,
      description: true,
      status: true,
      cancellationReason: true,
      notes: true,
      branchId: true,
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
      agentName: true,
      agentPhone: true,
      agentEmail: true,
      attachments: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // تحديث الحالات التلقائية
  const today = startOfDay(new Date());

  const contractsToUpdate = allContracts
    .map((contract) => {
      let newStatus: ContractStatusUnion = contract.status; // سيتم إعادة تعيينه

      if (
        contract.status === 'PENDING_REVIEW' &&
        isBefore(startOfDay(contract.startDate), today)
      ) {
        newStatus = 'ACTIVE';
      } else if (
        contract.status === 'ACTIVE' &&
        isBefore(startOfDay(contract.endDate), today)
      ) {
        newStatus = 'EXPIRED';
      }

      return {
        id: contract.id,
        status: newStatus,
        changed: newStatus !== contract.status,
      };
    })
    .filter((c) => c.changed);

  if (contractsToUpdate.length > 0) {
    await Promise.all(
      contractsToUpdate.map((c) =>
        prisma.contract.update({
          where: { id: c.id },
          data: { status: c.status },
        })
      )
    );
  }

  // تحويل النتائج إلى LocalContract
  const contractsWithCount: LocalContract[] = allContracts.map((contract) => ({
    id: contract.id,
    code: contract.code ?? '',
    title: contract.title,
    supplier: contract.supplier,
    value: contract.value,
    startDate: contract.startDate.toISOString(),
    endDate: contract.endDate.toISOString(),
    description: contract.description,
    status: contract.status as ContractStatusUnion, // التحويل واضح لأنه يتطابق
    cancellationReason: contract.cancellationReason,
    notes: contract.notes,
    branchId: contract.branchId,
    branch: contract.branch,
    createdAt: contract.createdAt.toISOString(),
    updatedAt: contract.updatedAt.toISOString(),
    agentName: contract.agentName,
    agentPhone: contract.agentPhone,
    agentEmail: contract.agentEmail,
    type: null, // الحقل غير موجود في الموديل، نعطيه قيمة افتراضية
    attachmentsCount: contract.attachments.length,
  }));

  return (
    <ContractsClient
      initialContracts={contractsWithCount}
      initialQ={q ?? ''}
      initialStatus={status ?? 'all'}
      locale={locale}
    />
  );
}