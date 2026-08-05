// src/services/BranchService.ts
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

interface Session {
  role: string;
  companyId?: string;
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
  companyId?: string; // ✅ أضفنا هذا الحقل
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
  static async getAll(where: Prisma.BranchWhereInput) {
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

  static async create(data: BranchCreateData, session: Session) {
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

  static async update(id: string, data: BranchUpdateData, session: Session) {
    const { name, nameEn, code, companyId } = data; // استخراج companyId من البيانات

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new Error('الفرع غير موجود');
    }

    let targetCompanyId: string | undefined; // تعريف المتغير

    if (session.role !== 'SUPER_ADMIN') {
      // غير سوبر أدمن، يجب أن يكون ضمن نفس الشركة
      if (branch.companyId !== session.companyId) {
        throw new Error('لا تملك الصلاحية');
      }
      targetCompanyId = session.companyId; // قد تكون undefined
    } else {
      // سوبر أدمن: يمكنه تحديد شركة جديدة
      targetCompanyId = companyId ?? branch.companyId; // إذا لم يحدد، يبقى نفس الشركة
    }

    // التأكد من وجود targetCompanyId
    if (!targetCompanyId) {
      throw new Error('لا توجد شركة مرتبطة');
    }

    // التحقق من تكرار الكود إذا تم تغييره
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
        name: name?.trim() ?? branch.name, // استخدام ?? بدلاً من || للحفاظ على القيم الفارغة
        nameEn: nameEn?.trim() ?? null,
        code: code?.trim() ?? branch.code,
        // إذا كان سوبر أدمن وتم توفير companyId، يتم تحديثه
        ...(session.role === 'SUPER_ADMIN' && companyId && { companyId }),
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