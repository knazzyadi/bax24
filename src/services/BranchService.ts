// src/services/BranchService.ts
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

// تعريف Session مع دعم null لـ branchIds
interface Session {
  role: string;
  companyId?: string | null;
  branchIds?: string[] | null; // ← تم التعديل
}

export interface BranchCreateData {
  name: string;
  nameEn?: string;
  code: string;
  companyId?: string;
}

export interface BranchUpdateData {
  name?: string;
  nameEn?: string;
  code?: string;
  companyId?: string;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export class BranchService {
  static async getAll(session: Session, companyIdParam?: string) {
    const where: Prisma.BranchWhereInput = {};
    const companyId = companyIdParam ?? session.companyId;

    if (session.role !== 'SUPER_ADMIN') {
      where.companyId = companyId ?? undefined;
      const branchIds = session.branchIds ?? [];
      if (session.role !== 'ADMIN' && branchIds.length > 0) {
        where.id = { in: branchIds };
      }
    } else if (companyIdParam) {
      where.companyId = companyIdParam;
    }

    return prisma.branch.findMany({
      where,
      include: {
        company: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data: BranchCreateData, session: Session) {
    const { name, nameEn, code, companyId } = data;

    let targetCompanyId = companyId;
    if (session.role !== 'SUPER_ADMIN') {
      targetCompanyId = session.companyId ?? undefined;
    }

    if (!targetCompanyId) {
      throw new Error('لا توجد شركة مرتبطة');
    }

    const duplicate = await prisma.branch.findFirst({
      where: {
        companyId: targetCompanyId,
        code: code.trim(),
      },
    });
    if (duplicate) {
      throw new Error('يوجد فرع بنفس الكود');
    }

    let baseSlug = generateSlug(nameEn?.trim() || name.trim());
    if (!baseSlug) baseSlug = 'branch';
    let slug = baseSlug;
    let counter = 1;
    while (
      await prisma.branch.findFirst({
        where: { slug },
      })
    ) {
      slug = `${baseSlug}-${counter++}`;
    }

    return prisma.branch.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code.trim(),
        companyId: targetCompanyId,
        slug,
        publicToken: randomUUID(),
        allowPublicTickets: true,
      },
    });
  }

  static async update(id: string, data: BranchUpdateData, session: Session) {
    const { name, nameEn, code } = data;

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new Error('الفرع غير موجود');
    }

    let targetCompanyId = branch.companyId;
    if (session.role !== 'SUPER_ADMIN') {
      if (branch.companyId !== session.companyId) {
        throw new Error('لا تملك الصلاحية');
      }
      targetCompanyId = session.companyId ?? branch.companyId;
    } else if (data.companyId) {
      targetCompanyId = data.companyId;
    }

    if (code) {
      const duplicate = await prisma.branch.findFirst({
        where: {
          companyId: targetCompanyId,
          code: code.trim(),
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new Error('يوجد فرع بنفس الكود');
      }
    }

    return prisma.branch.update({
      where: { id },
      data: {
        name: name?.trim() || branch.name,
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || branch.code,
        ...(data.companyId && session.role === 'SUPER_ADMIN'
          ? { companyId: data.companyId }
          : {}),
      },
    });
  }

  static async delete(id: string, session: Session) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new Error('الفرع غير موجود');
    }

    if (session.role !== 'SUPER_ADMIN' && branch.companyId !== session.companyId) {
      throw new Error('لا تملك الصلاحية');
    }

    return prisma.branch.delete({ where: { id } });
  }
}