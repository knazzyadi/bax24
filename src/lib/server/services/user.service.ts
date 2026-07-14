// src/lib/server/services/user.service.ts
import type { Prisma } from '@prisma/client';
import { UserRepository } from '@/lib/server/repositories/user.repository';
import { mapUsersToView, mapUserToView } from '@/lib/server/mappers/user.mapper';
import { UserValidator } from '@/lib/server/validators/user.validator';
import type { CreateUserDto, UpdateUserDto } from '@/lib/server/dto/user.dto';
import type { SharedUser, SharedUserFilters, SharedPaginatedResponse } from '@/lib/shared/types/user';

export class UserService {
  static async getUsers(
    companyId: string,
    filters?: SharedUserFilters
  ): Promise<SharedPaginatedResponse<SharedUser>> {
    const where: Prisma.UserWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.roleId) {
      where.roleId = filters.roleId;
    }

    if (filters?.status !== undefined) {
      where.status = filters.status;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (filters?.sortBy) {
      orderBy[filters.sortBy as keyof Prisma.UserOrderByWithRelationInput] = filters.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const { data, total } = await UserRepository.findMany({
      companyId,
      where,
      skip,
      take: limit,
      orderBy,
    });

    return {
      data: mapUsersToView(data),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async createUser(companyId: string, data: unknown) {
    const validationResult = UserValidator.validateCreate(data);
    if (!validationResult.success) {
      throw new Error(validationResult.error.message);
    }

    const validated = validationResult.data as CreateUserDto;
    const user = await UserRepository.create({
      companyId,
      name: validated.name,
      email: validated.email,
      roleId: validated.roleId,
      branchIds: validated.branchIds,
    });
    return mapUserToView(user);
  }

  static async updateUser(id: string, companyId: string, data: unknown) {
    const validationResult = UserValidator.validateUpdate(data);
    if (!validationResult.success) {
      throw new Error(validationResult.error.message);
    }

    const validated = validationResult.data as UpdateUserDto;
    const user = await UserRepository.update(id, companyId, {
      name: validated.name,
      email: validated.email,
      roleId: validated.roleId,
      branchIds: validated.branchIds,
    });
    return mapUserToView(user);
  }

  static async deleteUser(id: string, companyId: string) {
    await UserRepository.delete(id, companyId);
  }

  static async restoreUser(id: string, companyId: string) {
    const user = await UserRepository.restore(id, companyId);
    return mapUserToView(user);
  }

  static async toggleUserStatus(id: string, companyId: string) {
    const user = await UserRepository.toggleStatus(id, companyId);
    return mapUserToView(user);
  }

  static async resendInvite(id: string, companyId: string) {
    // التحقق من وجود المستخدم
    const exists = await UserRepository.exists(id, companyId);
    if (!exists) throw new Error('User not found');

    // منطق إعادة إرسال الدعوة
    return { success: true };
  }
}