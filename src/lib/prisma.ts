// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { RequestContext } from './request-context';

const SKIP_MODELS = ['User', 'Role', 'Permission', 'Company'];

const MODELS_WITHOUT_COMPANY_ID = [
  'TicketImage',
  'WorkOrderAsset',
  'ScheduleAsset',
  'UserBranch',
  'WorkOrderAttachment',
  'Notification',
];

type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

function createExtendedClient() {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

  const extendedClient = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          try {
            const ctx = RequestContext.get();
            const user = ctx?.user;

            // 🚀 SKIP ALL GLOBAL FILTERING FOR IMPORTANT MODELS
            if (
              !user ||
              SKIP_MODELS.includes(model) ||
              model === 'Asset'
            ) {
              return query(args);
            }

            const companyId = user.companyId;

            if (!companyId) {
              return query(args);
            }

            const shouldAddCompanyId =
              !MODELS_WITHOUT_COMPANY_ID.includes(model);

            let modifiedArgs = args as any;

            // ===============================
            // SELECT / FIND OPERATIONS
            // ===============================
            if (
              ['findMany', 'findFirst', 'count'].includes(operation) &&
              shouldAddCompanyId
            ) {
              const existingWhere =
                (args && typeof args === 'object' && 'where' in args)
                  ? (args as any).where
                  : {};

              modifiedArgs = {
                ...args,
                where: {
                  ...existingWhere,
                  companyId: companyId,
                },
              };
            }

            // ===============================
            // CREATE OPERATIONS
            // ===============================
            if (
              ['create', 'createMany'].includes(operation) &&
              shouldAddCompanyId
            ) {
              if (operation === 'create') {
                const existingData =
                  (args && typeof args === 'object' && 'data' in args)
                    ? (args as any).data
                    : {};

                modifiedArgs = {
                  ...args,
                  data: {
                    ...(existingData && typeof existingData === 'object'
                      ? existingData
                      : {}),
                    companyId: companyId,
                  },
                };
              } else if (operation === 'createMany') {
                const inputData =
                  (args && typeof args === 'object' && 'data' in args)
                    ? (args as any).data
                    : undefined;

                if (Array.isArray(inputData)) {
                  modifiedArgs = {
                    ...args,
                    data: inputData.map((item: any) => ({
                      ...item,
                      companyId,
                    })),
                  };
                } else if (inputData && typeof inputData === 'object') {
                  modifiedArgs = {
                    ...args,
                    data: {
                      ...inputData,
                      companyId,
                    },
                  };
                }
              }
            }

            return query(modifiedArgs);
          } catch (error) {
            // في حالة حدوث خطأ في RequestContext أو أي شيء آخر، نتجاوز التصفية وننفذ الاستعلام كما هو.
            console.error('Error in Prisma extension filter:', error);
            return query(args);
          }
        },
      },
    },
  });

  return extendedClient;
}

// ===============================
// Singleton pattern for Next.js (Vercel serverless)
// ===============================
const globalForPrisma = globalThis as unknown as {
  prismaInstance: ExtendedPrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prismaInstance ?? createExtendedClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaInstance = prisma;
}

// ===============================
// Transaction client type helper
// ===============================
export type TxClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];