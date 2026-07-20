import { UserRepository } from '@/lib/repositories/user.repository';
import { mapUsersToView, mapUserToView } from '@/lib/mappers/user.mapper';
import type { UserFormData } from '@/app/[locale]/(dashboard)/users/types';

export class UserService {
  static async getUsers(
    companyId: string,
    filters?: { search?: string; roleId?: string }
  ) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.roleId) {
      where.roleId = filters.roleId;
    }

    const { data, total } = await UserRepository.findMany({
      companyId,
      where,
    });

    return {
      users: mapUsersToView(data),
      total,
    };
  }

  static async createUser(companyId: string, data: UserFormData) {
    const user = await UserRepository.create({
      companyId,
      name: data.name,
      email: data.email,
      roleId: data.roleId,
      branchIds: data.branchIds,
    });
    return mapUserToView(user);
  }

  static async updateUser(
    id: string,
    companyId: string,
    data: Partial<UserFormData>
  ) {
    const user = await UserRepository.update(id, companyId, {
      name: data.name,
      email: data.email,
      roleId: data.roleId,
      branchIds: data.branchIds,
    });
    return mapUserToView(user);
  }

  static async deleteUser(id: string, companyId: string) {
    await UserRepository.delete(id, companyId);
  }

  static async toggleUserStatus(id: string, companyId: string) {
    const user = await UserRepository.toggleStatus(id, companyId);
    return mapUserToView(user);
  }

  static async resendInvite(id: string, companyId: string) {
    // منطق إعادة إرسال الدعوة (مثال: إرسال بريد إلكتروني)
    // يمكن استدعاء API خارجي أو استخدام nodemailer
    return { success: true };
  }
}