// src/services/BranchService.ts

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

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
  static async getAll(where: any) {
    return prisma.branch.findMany({
      where,
      include: {
        company: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data: any, session: any) {
    const { name, nameEn, code, companyId } = data;

    let targetCompanyId = companyId;
    if (session.role !== 'SUPER_ADMIN') {
      targetCompanyId = session.companyId;
    }

    if (!targetCompanyId) {
      throw new Error('لا توجد شركة مرتبطة');
    }

    // التحقق من تكرار الكود
    const duplicate = await prisma.branch.findFirst({
      where: {
        companyId: targetCompanyId,
        code: code.trim(),
      },
    });
    if (duplicate) {
      throw new Error('يوجد فرع بنفس الكود');
    }

    // إنشاء slug فريد
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

  static async update(id: string, data: any, session: any) {
    const { name, nameEn, code, companyId } = data;

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new Error('الفرع غير موجود');
    }

    let targetCompanyId = companyId;
    if (session.role !== 'SUPER_ADMIN') {
      targetCompanyId = session.companyId;
      if (branch.companyId !== session.companyId) {
        throw new Error('لا تملك الصلاحية');
      }
    } else {
      targetCompanyId = companyId || branch.companyId;
    }

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

    return prisma.branch.update({
      where: { id },
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code.trim(),
      },
    });
  }

  static async delete(id: string, session: any) {
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