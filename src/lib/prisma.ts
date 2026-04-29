// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { RequestContext } from './request-context';

const SKIP_MODELS = ['User', 'Role', 'Permission', 'Company'];
const MODELS_WITHOUT_COMPANY_ID = [
  'TicketImage', 'WorkOrderAsset', 'ScheduleAsset',
  'UserBranch', 'WorkOrderAttachment', 'Notification'
];

type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

function createExtendedClient() {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  const extendedClient = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const ctx = RequestContext.get();
          const user = ctx?.user;

          if (!user || SKIP_MODELS.includes(model)) {
            return query(args);
          }

          const companyId = user.companyId;
          if (!companyId) {
            return query(args);
          }

          const shouldAddCompanyId = !MODELS_WITHOUT_COMPANY_ID.includes(model);
          let modifiedArgs = args as any;  // ✅ استخدام any للتغلب على تعقيد الأنواع

          if (['findMany', 'findFirst', 'count'].includes(operation) && shouldAddCompanyId) {
            const existingWhere = (args && typeof args === 'object' && 'where' in args) ? (args as any).where : {};
            modifiedArgs = {
              ...args,
              where: {
                ...existingWhere,
                companyId: companyId,
              },
            };
          }

          if (['create', 'createMany'].includes(operation) && shouldAddCompanyId) {
            if (operation === 'create') {
              const existingData = (args && typeof args === 'object' && 'data' in args) ? (args as any).data : {};
              modifiedArgs = {
                ...args,
                data: {
                  ...(existingData && typeof existingData === 'object' ? existingData : {}),
                  companyId: companyId,
                },
              };
            } else if (operation === 'createMany') {
              const inputData = (args && typeof args === 'object' && 'data' in args) ? (args as any).data : undefined;
              if (Array.isArray(inputData)) {
                modifiedArgs = {
                  ...args,
                  data: inputData.map((item: any) => ({ ...item, companyId: companyId })),
                };
              } else if (inputData && typeof inputData === 'object') {
                modifiedArgs = {
                  ...args,
                  data: { ...inputData, companyId: companyId },
                };
              }
            }
          }

          return query(modifiedArgs);
        },
      },
    },
  });

  return extendedClient;
}

let prismaInstance: ExtendedPrismaClient | undefined;
export const prisma = (global as any).prismaInstance ?? createExtendedClient();
if (process.env.NODE_ENV !== 'production') {
  (global as any).prismaInstance = prisma;
}