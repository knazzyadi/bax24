// src/services/UserService.ts
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export interface UserFilters {
  role?: string;
  companyId?: string;
  search?: string;
}

export interface UserCreateData {
  name: string;
  email: string;
  roleId: string;
  companyId: string;
  status?: boolean;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  roleId?: string;
  companyId?: string;
  status?: boolean;
}

export class UserService {
  /**
   * جلب جميع المستخدمين مع فلترة
   */
  static async getAll(filters: UserFilters = {}) {
    const { role, companyId, search } = filters;
    const where: any = {};

    if (role) {
      where.role = { name: role };
    }
    if (companyId) {
      where.companyId = companyId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true, label: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * جلب مستخدم واحد
   */
  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true, label: true } },
        company: { select: { id: true, name: true } },
      },
    });
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }
    return user;
  }

  /**
   * إنشاء مستخدم جديد
   */
  static async create(data: UserCreateData) {
    const { name, email, roleId, companyId, status } = data;

    if (!name?.trim()) throw new Error('الاسم مطلوب');
    if (!email?.trim()) throw new Error('البريد الإلكتروني مطلوب');
    if (!roleId) throw new Error('الدور مطلوب');
    if (!companyId) throw new Error('الشركة مطلوبة');

    const existing = await prisma.user.findUnique({
      where: { email: email.trim() },
    });
    if (existing) {
      throw new Error('البريد الإلكتروني مستخدم بالفعل');
    }

    return prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        roleId,
        companyId,
        status: status ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true, label: true } },
        company: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * تحديث مستخدم
   */
  static async update(id: string, data: UserUpdateData) {
    const { name, email, roleId, companyId, status } = data;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('المستخدم غير موجود');
    }

    if (email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: email.trim(),
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل');
      }
    }

    return prisma.user.update({
      where: { id },
      data: {
        name: name?.trim() ?? existing.name,
        email: email?.trim() ?? existing.email,
        roleId: roleId ?? existing.roleId,
        companyId: companyId ?? existing.companyId,
        status: status ?? existing.status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true, label: true } },
        company: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * تبديل حالة المستخدم
   */
  static async toggleStatus(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('المستخدم غير موجود');
    }

    return prisma.user.update({
      where: { id },
      data: { status: !existing.status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true, label: true } },
        company: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * حذف مستخدم - التحقق من وجود بيانات مرتبطة باستخدام count
   */
  static async delete(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('المستخدم غير موجود');
    }

    // ✅ استخدام count بدلاً من include لتجنب مشاكل الأنواع
    const [ticketCount, createdWorkOrderCount, assignedWorkOrderCount] = await Promise.all([
      prisma.ticket.count({ where: { userId: id } }),
      prisma.workOrder.count({ where: { createdBy: id } }),
      prisma.workOrder.count({ where: { assignedTo: id } }),
    ]);

    const hasRelated = ticketCount > 0 || createdWorkOrderCount > 0 || assignedWorkOrderCount > 0;

    if (hasRelated) {
      throw new Error('لا يمكن حذف المستخدم لوجود بيانات مرتبطة (تذاكر أو أوامر عمل)');
    }

    return prisma.user.delete({ where: { id } });
  }

  /**
   * جلب جميع الأدوار
   */
  static async getRoles() {
    return prisma.role.findMany({
      select: { id: true, name: true, label: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * ✅ إعادة إرسال دعوة لمستخدم
   */
  static async resendInvite(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true, company: true },
    });

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    if (user.role?.name === 'SUPER_ADMIN') {
      throw new Error('لا يمكن إعادة إرسال دعوة للسوبر أدمن');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        invitationToken: token,
        invitationExpires: expires,
        status: false,
        password: null,
      },
    });

    await sendInvitationEmail(
      user.email,
      token,
      user.company?.name || 'الشركة'
    );

    return { success: true };
  }
}