// src/lib/auth-credentials.ts

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

type Credentials = {
  email?: string;
  password?: string;
};

export async function authorizeCredentials(
  credentials: Credentials
) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: {
      role: true,
      company: true,
    },
  });

  if (!user || !user.password) {
    return null;
  }

  if (user.status === false) {
    return null;
  }

  const isValid = await bcrypt.compare(
    credentials.password,
    user.password
  );

  if (!isValid) {
    return null;
  }

  let branchIds: string[] = [];

  try {
    const userBranches = await prisma.userBranch.findMany({
      where: {
        userId: user.id,
      },
      select: {
        branchId: true,
      },
    });

    branchIds = userBranches.map((ub) => ub.branchId);
  } catch (error) {
    console.warn('UserBranch error:', error);
  }

  branchIds = [...new Set(branchIds)];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role?.name || 'USER',
    companyId: user.companyId,
    companyName: user.company?.name,
    companyNameEn: user.company?.nameEn,
    branchId: null,
    branchIds,
  };
}