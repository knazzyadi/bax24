// src/services/BranchService.ts
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { generateSlug } from '@/lib/utils';

export interface BranchCreateData {
  name: string;
  nameEn?: string;
  code: string;
  companyId: string;
}

export interface BranchUpdateData {
  name?: string;
  nameEn?: string;
  code?: string;
}

export class BranchService {
  /**
   * جلب جميع الفروع مع صلاحيات المستخدم
   */
  static async getAll(session: any, companyIdParam?: string) {
    let where: any = {};

    if (session.role !== 'SUPER_ADMIN') {
      where.companyId = session.companyId;
      if (session.role !== 'ADMIN' && session.branchIds?.length > 0) {
        where.id = { in: session.branchIds };
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

  /**
   * إنشاء فرع جديد
   */
  static async create(data: BranchCreateData, session: any) {
    const { name, nameEn, code, companyId } = data;

    if (!name?.trim()) {
      throw new Error('اسم الفرع مطلوب');
    }
    if (!code?.trim()) {
      throw new Error('كود الفرع مطلوب');
    }

    const targetCompanyId = session.role !== 'SUPER_ADMIN'
      ? session.companyId
      : companyId;

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
    let baseSlug = generateSlug(nameEn?.trim() || name.trim()) || 'branch';
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.branch.findFirst({ where: { slug } })) {
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
        // ✅ تم إزالة isActive (غير موجود في الـ Schema)
      },
    });
  }

  /**
   * تحديث فرع
   */
  static async update(id: string, data: BranchUpdateData, session: any) {
    const { name, nameEn, code } = data;

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('الفرع غير موجود');
    }

    // التحقق من الصلاحية
    if (session.role !== 'SUPER_ADMIN' && existing.companyId !== session.companyId) {
      throw new Error('لا تملك الصلاحية');
    }

    if (name && !name.trim()) {
      throw new Error('اسم الفرع مطلوب');
    }
    if (code && !code.trim()) {
      throw new Error('كود الفرع مطلوب');
    }

    // التحقق من تكرار الكود (باستثناء نفس السجل)
    if (code) {
      const duplicate = await prisma.branch.findFirst({
        where: {
          companyId: existing.companyId,
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
        name: name?.trim() || existing.name,
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || existing.code,
      },
    });
  }

  /**
   * حذف فرع
   */
  static async delete(id: string, session: any) {
    const existing = await prisma.branch.findUnique({
      where: { id },
      include: {
        tickets: { take: 1 },
        workOrders: { take: 1 },
        assets: { take: 1 },
      },
    });

    if (!existing) {
      throw new Error('الفرع غير موجود');
    }

    if (session.role !== 'SUPER_ADMIN' && existing.companyId !== session.companyId) {
      throw new Error('لا تملك الصلاحية');
    }

    // التحقق من وجود بيانات مرتبطة
    if (existing.tickets.length > 0 || existing.workOrders.length > 0 || existing.assets.length > 0) {
      throw new Error('لا يمكن حذف الفرع لوجود بيانات مرتبطة');
    }

    return prisma.branch.delete({ where: { id } });
  }
}