// src/services/CompanyService.ts
import { prisma } from '@/lib/prisma';

export interface CompanyCreateData {
  name: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionEndDate?: Date | string; // يمكن أن تأتي كـ string أو Date
  isActive?: boolean;
}

export interface CompanyUpdateData {
  name?: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionEndDate?: Date | string;
  isActive?: boolean;
}

export class CompanyService {
  /**
   * جلب جميع الشركات (للسوبر أدمن فقط)
   */
  static async getAll() {
    return prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            branches: true,
            assets: true,
          },
        },
      },
    });
  }

  /**
   * جلب شركة واحدة
   */
  static async getById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            branches: true,
            assets: true,
          },
        },
      },
    });
    if (!company) {
      throw new Error('الشركة غير موجودة');
    }
    return company;
  }

  /**
   * إنشاء شركة جديدة
   */
  static async create(data: CompanyCreateData) {
    const { name, nameEn, email, phone, address, subscriptionEndDate, isActive } = data;

    if (!name?.trim()) {
      throw new Error('اسم الشركة مطلوب');
    }

    // التحقق من عدم تكرار الاسم
    const existing = await prisma.company.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      throw new Error('يوجد شركة بنفس الاسم');
    }

    return prisma.company.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
        isActive: isActive ?? true,
      },
    });
  }

  /**
   * تحديث شركة
   */
  static async update(id: string, data: CompanyUpdateData) {
    const { name, nameEn, email, phone, address, subscriptionEndDate, isActive } = data;

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('الشركة غير موجودة');
    }

    // التحقق من عدم تكرار الاسم (باستثناء نفس الشركة)
    if (name) {
      const duplicate = await prisma.company.findFirst({
        where: {
          name: name.trim(),
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new Error('يوجد شركة بنفس الاسم');
      }
    }

    return prisma.company.update({
      where: { id },
      data: {
        name: name?.trim() ?? existing.name,
        nameEn: nameEn?.trim() ?? null,
        email: email?.trim() ?? null,
        phone: phone?.trim() ?? null,
        address: address?.trim() ?? null,
        subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : existing.subscriptionEndDate,
        isActive: isActive ?? existing.isActive,
      },
    });
  }

  /**
   * حذف شركة
   */
  static async delete(id: string) {
    const existing = await prisma.company.findUnique({
      where: { id },
      include: {
        users: { take: 1 },
        branches: { take: 1 },
        assets: { take: 1 },
        workOrders: { take: 1 },
      },
    });

    if (!existing) {
      throw new Error('الشركة غير موجودة');
    }

    // التحقق من وجود بيانات مرتبطة
    if (existing.users.length > 0 || existing.branches.length > 0 || 
        existing.assets.length > 0 || existing.workOrders.length > 0) {
      throw new Error('لا يمكن حذف الشركة لوجود بيانات مرتبطة');
    }

    return prisma.company.delete({ where: { id } });
  }

  /**
   * تبديل حالة الشركة (تفعيل/تعطيل)
   */
  static async toggleStatus(id: string) {
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('الشركة غير موجودة');
    }

    return prisma.company.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }
}