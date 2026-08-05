// src/services/UserService.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

// ========== تعريف الأنواع ==========
interface Session {
  role?: string;
  companyId?: string;
  branchIds?: string[];
  userId?: string;
}

export interface UserFilters {
  role?: string;
  companyId?: string;
  search?: string;
  status?: boolean;
  page?: number;
  limit?: number;
}

export interface UserCreateData {
  name: string;
  email: string;
  roleId: string;
  companyId: string;
  status?: boolean;
  password?: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  roleId?: string;
  companyId?: string;
  status?: boolean;
  password?: string;
}

// نوع المستخدم مع العلاقات المستخدمة في getAll
type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    role: true;
    company: {
      select: {
        name: true;
        id: true;
      };
    };
  };
}>;

// ========== الخدمة ==========
export class UserService {
  /**
   * جلب قائمة المستخدمين مع إمكانية التصفية والبحث
   * لا تحتاج Session لأن صلاحية الوصول يتم التحقق منها في الـ route
   */
  static async getAll(
    filters: UserFilters = {}
  ): Promise<{
    users: UserWithRelations[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      role,
      companyId,
      search,
      status,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (companyId) {
      where.companyId = companyId;
    }

    if (role) {
      where.role = {
        name: role,
      };
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          company: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * جلب مستخدم بواسطة ID
   */
  static async getById(id: string, session?: Session) {
    if (!session) throw new Error('Session is required');
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role ?? '')) {
      throw new Error('ليس لديك صلاحية لعرض هذا المستخدم');
    }

    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        role: true,
        company: { select: { name: true, id: true } },
      },
    });

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    if (session.role !== 'SUPER_ADMIN' && user.companyId !== session.companyId) {
      throw new Error('لا تملك صلاحية الوصول لهذا المستخدم');
    }

    return user;
  }

  /**
   * إنشاء مستخدم جديد (عادةً عبر دعوة)
   */
  static async create(data: UserCreateData, session?: Session) {
    if (!session) throw new Error('Session is required');
    const { name, email, roleId, companyId, status = true, password } = data;

    if (!name?.trim() || !email?.trim() || !roleId || !companyId) {
      throw new Error('الاسم، البريد الإلكتروني، الدور، والشركة مطلوبة');
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role ?? '')) {
      throw new Error('ليس لديك صلاحية لإنشاء مستخدم');
    }

    let targetCompanyId = companyId;
    if (session.role !== 'SUPER_ADMIN') {
      if (companyId !== session.companyId) {
        throw new Error('لا يمكنك إنشاء مستخدم لشركة أخرى');
      }
      targetCompanyId = session.companyId!;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        deletedAt: null,
      },
    });
    if (existingUser) {
      throw new Error('البريد الإلكتروني مستخدم بالفعل');
    }

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        roleId,
        companyId: targetCompanyId,
        status,
        password: hashedPassword,
      },
      include: {
        role: true,
        company: { select: { name: true } },
      },
    });

    return user;
  }

  /**
   * تحديث مستخدم
   */
  static async update(id: string, data: UserUpdateData, session?: Session) {
    if (!session) throw new Error('Session is required');
    const { name, email, roleId, companyId, status, password } = data;

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role ?? '')) {
      throw new Error('ليس لديك صلاحية لتحديث هذا المستخدم');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existingUser) {
      throw new Error('المستخدم غير موجود');
    }

    if (session.role !== 'SUPER_ADMIN' && existingUser.companyId !== session.companyId) {
      throw new Error('لا تملك صلاحية تحديث هذا المستخدم');
    }

    if (email && email.trim().toLowerCase() !== existingUser.email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          deletedAt: null,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل');
      }
    }

    let targetCompanyId = existingUser.companyId;
    if (session.role === 'SUPER_ADMIN' && companyId) {
      targetCompanyId = companyId;
    } else if (companyId && companyId !== existingUser.companyId) {
      throw new Error('لا يمكن تغيير الشركة إلا بواسطة السوبر أدمن');
    }

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name?.trim() || existingUser.name,
        email: email?.trim().toLowerCase() || existingUser.email,
        roleId: roleId || existingUser.roleId,
        companyId: targetCompanyId,
        status: status !== undefined ? status : existingUser.status,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
      include: {
        role: true,
        company: { select: { name: true } },
      },
    });

    return updatedUser;
  }

  /**
   * حذف مستخدم (ناعم)
   */
  static async delete(id: string, session?: Session) {
    if (!session) throw new Error('Session is required');
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role ?? '')) {
      throw new Error('ليس لديك صلاحية لحذف المستخدم');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existingUser) {
      throw new Error('المستخدم غير موجود');
    }

    if (session.role !== 'SUPER_ADMIN' && existingUser.companyId !== session.companyId) {
      throw new Error('لا تملك صلاحية حذف هذا المستخدم');
    }

    if (id === session.userId) {
      throw new Error('لا يمكنك حذف حسابك الخاص');
    }

    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * إعادة تعيين كلمة المرور (إرسال رابط إعادة تعيين)
   */
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
    });
    if (!user) {
      throw new Error('البريد الإلكتروني غير مسجل');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
      },
    });

    return { message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' };
  }

  /**
   * تغيير كلمة المرور باستخدام الرمز
   */
  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        deletedAt: null,
      },
    });
    if (!user) {
      throw new Error('الرمز غير صالح');
    }

    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
      },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * تبديل حالة المستخدم (تفعيل / تعطيل)
   */
  static async toggleStatus(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    return prisma.user.update({
      where: { id },
      data: {
        status: !user.status,
      },
    });
  }

  /**
   * إعادة إرسال دعوة للمستخدم (إنشاء رمز جديد وإرسال بريد)
   */
  static async resendInvite(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    await prisma.user.update({
      where: { id },
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

    return {
      success: true,
    };
  }
}