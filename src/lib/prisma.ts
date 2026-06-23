// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { RequestContext } from './request-context';

// ===============================
// الثوابت: النماذج المستثناة من التصفية التلقائية
// ===============================
const SKIP_MODELS = ['User', 'Role', 'Permission', 'Company'] as const;
const MODELS_WITHOUT_COMPANY_ID = [
  'TicketImage',
  'WorkOrderAsset',
  'ScheduleAsset',
  'UserBranch',
  'WorkOrderAttachment',
  'Notification',
] as const;

// ===============================
// تعريف النوع الممتد لعميل Prisma
// ===============================
type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

/**
 * دالة لإنشاء عميل Prisma مع إضافات (Extensions) لتطبيق
 * تصفية تلقائية بناءً على companyId من السياق (RequestContext)
 */
function createExtendedClient() {
  // العميل الأساسي مع إعدادات التسجيل
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

  // إضافة الإضافات (Extensions) مع تحديد الأنواع بشكل صريح
  const extendedClient = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: {
          model: string;
          operation: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          try {
            // جلب السياق الحالي (المستخدم)
            const ctx = RequestContext.get();
            const user = ctx?.user;

            // 🚀 تخطي التصفية للنماذج المستثناة أو نموذج Asset
            if (
              !user ||
              SKIP_MODELS.includes(model as any) ||
              model === 'Asset'
            ) {
              return query(args);
            }

            const companyId = user.companyId;

            // إذا لم يكن هناك companyId، ننفذ الاستعلام بدون تصفية
            if (!companyId) {
              return query(args);
            }

            // التحقق مما إذا كان هذا النموذج يحتوي على حقل companyId
            const shouldAddCompanyId =
              !MODELS_WITHOUT_COMPANY_ID.includes(model as any);

            let modifiedArgs = args as any;

            // ===============================
            // عمليات SELECT / FIND (إضافة شرط companyId)
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
            // عمليات CREATE (إضافة companyId تلقائياً)
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

            // تنفيذ الاستعلام النهائي
            return query(modifiedArgs);
          } catch (error) {
            // في حالة حدوث خطأ (مثل عدم وجود السياق)، يتم تسجيل الخطأ وتنفيذ الاستعلام بدون تصفية
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
// نمط Singleton لضمان عميل واحد في بيئة Serverless (Vercel)
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
// نوع مساعد لاستخدام المعاملات (Transactions)
// ===============================
export type TxClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];