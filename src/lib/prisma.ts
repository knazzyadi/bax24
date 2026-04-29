// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { RequestContext } from './request-context';

// النماذج التي لا يتم تطبيق العزل عليها نهائياً
const SKIP_MODELS = ['User', 'Role', 'Permission', 'Company'];

// النماذج التي ليس لديها حقل companyId (نمنع إضافته تلقائياً)
const MODELS_WITHOUT_COMPANY_ID = [
  'TicketImage', 'WorkOrderAsset', 'ScheduleAsset',
  'UserBranch', 'WorkOrderAttachment', 'Notification'
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
          const ctx = RequestContext.get();
          const user = ctx?.user;

          if (!user || SKIP_MODELS.includes(model)) {
            return query(args);
          }

          let modifiedArgs = args;

          // استثناء النماذج التي لا تحتوي على companyId
          const shouldAddCompanyId = !MODELS_WITHOUT_COMPANY_ID.includes(model);

          // عمليات الجلب (findMany, findFirst, count)
          if (['findMany', 'findFirst', 'count'].includes(operation) && shouldAddCompanyId) {
            const existingWhere = (args && typeof args === 'object' && 'where' in args) ? args.where : {};
            modifiedArgs = {
              ...args,
              where: {
                ...existingWhere,
                companyId: user.companyId,
              },
            };
          }

          // عمليات الإنشاء (create, createMany)
          if (['create', 'createMany'].includes(operation) && shouldAddCompanyId) {
            if (operation === 'create') {
              const existingData = (args && typeof args === 'object' && 'data' in args) ? args.data : {};
              modifiedArgs = {
                ...args,
                data: {
                  ...(existingData && typeof existingData === 'object' ? existingData : {}),
                  companyId: user.companyId,
                },
              };
            } else if (operation === 'createMany') {
              const inputData = (args && typeof args === 'object' && 'data' in args) ? args.data : undefined;
              if (Array.isArray(inputData)) {
                modifiedArgs = {
                  ...args,
                  data: inputData.map((item: any) => ({ ...item, companyId: user.companyId })),
                };
              } else if (inputData && typeof inputData === 'object') {
                modifiedArgs = {
                  ...args,
                  data: { ...inputData, companyId: user.companyId },
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