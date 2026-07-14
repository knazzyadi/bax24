// src/lib/server/repositories/user.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const USER_INCLUDE = {
  role: { select: { id: true, name: true, label: true } },
  userBranches: { include: { branch: { select: { id: true, name: true } } } },
} satisfies Prisma.UserInclude;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;

export class UserRepository {
  static async findMany({
    companyId,
    where,
    skip,
    take,
    orderBy,
  }: {
    companyId: string;
    where?: Prisma.UserWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: {
          companyId,
          deletedAt: null,
          ...where,
        },
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: USER_INCLUDE,
      }),
      prisma.user.count({
        where: {
          companyId,
          deletedAt: null,
          ...where,
        },
      }),
    ]);

    return { data, total };
  }

  static async findById(id: string, companyId: string) {
    return prisma.user.findFirst({
      where: { id, companyId, deletedAt: null },
      include: USER_INCLUDE,
    });
  }

  static async findByEmail(email: string, companyId: string) {
    return prisma.user.findFirst({
      where: { email, companyId, deletedAt: null },
      include: USER_INCLUDE,
    });
  }

  static async exists(id: string, companyId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id, companyId, deletedAt: null },
    });
    return count > 0;
  }

  static async create(data: {
    companyId: string;
    name: string;
    email: string;
    roleId: string;
    branchIds: string[];
  }) {
    return prisma.user.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        email: data.email,
        roleId: data.roleId,
        status: true,
        userBranches: {
          createMany: {
            data: data.branchIds.map((branchId) => ({
              branchId,
            })),
          },
        },
      },
      include: USER_INCLUDE,
    });
  }

  static async update(
    id: string,
    companyId: string,
    data: {
      name?: string;
      email?: string;
      roleId?: string;
      branchIds?: string[];
      status?: boolean;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      return tx.user.update({
        where: { id, companyId },
        data: {
          name: data.name,
          email: data.email,
          roleId: data.roleId,
          status: data.status,
          userBranches: data.branchIds !== undefined
            ? {
                deleteMany: {},
                createMany: {
                  data: data.branchIds.map((branchId) => ({
                    branchId,
                  })),
                },
              }
            : undefined,
        },
        include: USER_INCLUDE,
      });
    });
  }

  static async delete(id: string, companyId: string) {
    const user = await prisma.user.findFirst({
      where: { id, companyId },
      select: { email: true },
    });

    if (!user) throw new Error('User not found');

    // استخدام معرف فريد لتجنب مشكلة طول البريد
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().slice(0, 8);
    const deletedEmail = `deleted+${randomId}@deleted.local`;

    return prisma.user.update({
      where: { id, companyId },
      data: {
        deletedAt: new Date(),
        email: deletedEmail,
      },
    });
  }

  static async restore(id: string, companyId: string) {
    return prisma.user.update({
      where: { id, companyId },
      data: {
        deletedAt: null,
        // يمكن استعادة البريد الأصلي إذا كان محفوظاً في حقل آخر
      },
      include: USER_INCLUDE,
    });
  }

  static async toggleStatus(id: string, companyId: string) {
    const user = await prisma.user.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { status: true },
    });

    if (!user) throw new Error('User not found');

    return prisma.user.update({
      where: { id, companyId },
      data: { status: !user.status },
      include: USER_INCLUDE,
    });
  }
}