// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

export const prismaBase = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? prismaBase;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}