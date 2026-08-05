// src/services/SupplierService.ts

import { prisma } from '@/lib/prisma';

// ============================================================
// ✅ تعريف نوع موحد لبيانات المورد
// ============================================================
type SupplierInput = {
  name?: string;
  nameEn?: string | null;
  code?: string | null;
  description?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive?: boolean;
};

export class SupplierService {
  /**
   * جلب جميع الموردين لشركة معينة
   */
  static async getSuppliers(companyId: string) {
    if (!companyId) {
      throw new Error('معرف الشركة مطلوب');
    }

    return prisma.supplier.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        isActive: true,
        contactPerson: true,
        phone: true,
        email: true,
        description: true,
        address: true,
        taxNumber: true,
        website: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * جلب مورد نشط واحد حسب المعرف
   */
  static async getActiveSupplierById(id: string, companyId: string) {
    return prisma.supplier.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
        isActive: true,
      },
    });
  }

  /**
   * جلب مورد واحد حسب المعرف (بدون فلتر isActive)
   */
  static async getSupplierById(id: string, companyId: string) {
    return prisma.supplier.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
  }

  /**
   * جلب مورد حسب الكود (للتأكد من عدم التكرار)
   */
  static async getSupplierByCode(code: string, companyId: string) {
    return prisma.supplier.findFirst({
      where: {
        code,
        companyId,
        deletedAt: null,
      },
    });
  }

  /**
   * جلب مورد حسب الاسم (للتأكد من عدم التكرار)
   */
  static async getSupplierByName(name: string, companyId: string) {
    return prisma.supplier.findFirst({
      where: {
        name,
        companyId,
        deletedAt: null,
      },
    });
  }

  /**
   * إنشاء مورد جديد
   */
  static async createSupplier(
    data: Required<Pick<SupplierInput, 'name'>> & SupplierInput,
    companyId: string
  ) {
    // التحقق من عدم وجود كود مكرر
    if (data.code) {
      const existing = await this.getSupplierByCode(data.code, companyId);
      if (existing) {
        throw new Error('الكود مستخدم بالفعل');
      }
    }

    // التحقق من عدم وجود اسم مكرر
    if (data.name) {
      const existing = await this.getSupplierByName(data.name, companyId);
      if (existing) {
        throw new Error('الاسم مستخدم بالفعل');
      }
    }

    return prisma.supplier.create({
      data: {
        name: data.name,
        nameEn: data.nameEn ?? null,
        code: data.code ?? null,
        description: data.description ?? null,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        address: data.address ?? null,
        taxNumber: data.taxNumber ?? null,
        isActive: data.isActive ?? true,
        companyId,
      },
    });
  }

  /**
   * تحديث مورد
   */
  static async updateSupplier(
    id: string,
    data: SupplierInput,
    companyId: string
  ) {
    // التحقق من وجود المورد
    const existing = await this.getSupplierById(id, companyId);
    if (!existing) {
      throw new Error('المورد غير موجود');
    }

    // التحقق من عدم وجود كود مكرر (إذا تم تغييره)
    if (data.code && data.code !== existing.code) {
      const duplicate = await this.getSupplierByCode(data.code, companyId);
      if (duplicate) {
        throw new Error('الكود مستخدم بالفعل');
      }
    }

    // التحقق من عدم وجود اسم مكرر (إذا تم تغييره)
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.getSupplierByName(data.name, companyId);
      if (duplicate) {
        throw new Error('الاسم مستخدم بالفعل');
      }
    }

    return prisma.supplier.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        nameEn: data.nameEn !== undefined ? data.nameEn : existing.nameEn,
        code: data.code !== undefined ? data.code : existing.code,
        description:
          data.description !== undefined ? data.description : existing.description,
        contactPerson:
          data.contactPerson !== undefined ? data.contactPerson : existing.contactPerson,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        email: data.email !== undefined ? data.email : existing.email,
        website: data.website !== undefined ? data.website : existing.website,
        address: data.address !== undefined ? data.address : existing.address,
        taxNumber: data.taxNumber !== undefined ? data.taxNumber : existing.taxNumber,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });
  }

  /**
   * حذف مورد (ناعم - Soft Delete)
   */
  static async deleteSupplier(id: string, companyId: string) {
    // التحقق من وجود المورد
    const existing = await this.getSupplierById(id, companyId);
    if (!existing) {
      throw new Error('المورد غير موجود');
    }

    // التحقق من عدم وجود أصول مرتبطة بهذا المورد
    const assetCount = await prisma.asset.count({
      where: {
        supplierId: id,
        deletedAt: null,
      },
    });

    if (assetCount > 0) {
      throw new Error('لا يمكن حذف المورد لأنه مرتبط بأصول موجودة');
    }

    return prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * حذف مورد نهائياً (Hard Delete) - بحذر
   */
  static async hardDeleteSupplier(id: string, companyId: string) {
    const existing = await this.getSupplierById(id, companyId);
    if (!existing) {
      throw new Error('المورد غير موجود');
    }

    // التحقق من عدم وجود أصول مرتبطة
    const assetCount = await prisma.asset.count({
      where: {
        supplierId: id,
        deletedAt: null,
      },
    });

    if (assetCount > 0) {
      throw new Error('لا يمكن حذف المورد لأنه مرتبط بأصول موجودة');
    }

    return prisma.supplier.delete({
      where: { id },
    });
  }

  /**
   * جلب الموردين النشطين فقط (للقوائم المنسدلة)
   */
  static async getActiveSuppliers(companyId: string) {
    if (!companyId) {
      throw new Error('معرف الشركة مطلوب');
    }

    return prisma.supplier.findMany({
      where: {
        companyId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
      },
    });
  }
}

export default SupplierService;