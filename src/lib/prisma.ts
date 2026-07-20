// src/lib/prisma.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { RequestContext } from './request-context';

// ============================================================
// 1. ✅ العميل الأساسي (بدون extensions) لـ PrismaAdapter
// ============================================================
export const prismaBase = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// ============================================================
// 2. بقية الكود كما هو (العميل الممتد للتطبيق)
// ============================================================

export type TxClient = Prisma.TransactionClient;
export type DbClient = typeof prisma;

const SKIP_MODELS = ['User', 'Role', 'Permission', 'Company'] as const;
const MODELS_WITHOUT_COMPANY_ID = [
  'TicketImage',
  'WorkOrderAsset',
  'ScheduleAsset',
  'UserBranch',
  'WorkOrderAttachment',
  'Notification',
] as const;

function createExtendedClient() {
  // ✅ استخدم prismaBase كقاعدة للتمديد
  return prismaBase.$extends({
    query: {
      $allModels: {
        async $allOperations(payload: any) {
          const { model, operation, args, query } = payload;

          try {
            if (args?.__skipFilter) {
              const { __skipFilter, ...cleanArgs } = args;
              return query(cleanArgs);
            }

            if (process.env.NEXT_PHASE === 'phase-production-build') {
              return query(args);
            }

            const ctx = RequestContext.get();
            const user = ctx?.user;

            if (!user || SKIP_MODELS.includes(model as any) || model === 'Asset') {
              return query(args);
            }

            const companyId = user.companyId;
            if (!companyId) {
              return query(args);
            }

            const shouldAddCompanyId = !MODELS_WITHOUT_COMPANY_ID.includes(model as any);
            if (!shouldAddCompanyId) {
              return query(args);
            }

            let modifiedArgs = args;

            if (['findMany', 'findFirst', 'count'].includes(operation)) {
              const existingWhere = args?.where ?? {};
              if (existingWhere.companyId === companyId) {
                return query(args);
              }
              modifiedArgs = {
                ...args,
                where: { ...existingWhere, companyId },
                __skipFilter: true,
              };
            }

            if (['create', 'createMany'].includes(operation)) {
              if (operation === 'create') {
                const existingData = args?.data ?? {};
                if (existingData.companyId === companyId) {
                  return query(args);
                }
                modifiedArgs = {
                  ...args,
                  data: { ...existingData, companyId },
                  __skipFilter: true,
                };
              }

              if (operation === 'createMany') {
                const inputData = args?.data;
                if (Array.isArray(inputData)) {
                  modifiedArgs = {
                    ...args,
                    data: inputData.map((item: any) => ({ ...item, companyId })),
                    __skipFilter: true,
                  };
                } else if (inputData) {
                  modifiedArgs = {
                    ...args,
                    data: { ...inputData, companyId },
                    __skipFilter: true,
                  };
                }
              }
            }

            return query(modifiedArgs);
          } catch (error) {
            console.error('Error in Prisma extension:', error);
            return query(args);
          }
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prismaInstance: ReturnType<typeof createExtendedClient> | undefined;
};

export const prisma = globalForPrisma.prismaInstance ?? createExtendedClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaInstance = prisma;
}