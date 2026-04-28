// src/lib/prisma.ts
// إنشاء اتصال قاعدة البيانات عبر Prisma مع tenant isolation احترافي

import { PrismaClient } from '@prisma/client';
import { RequestContext } from './request-context';

// النماذج التي لا يتم تطبيق العزل عليها (لأنها عامة أو مرتبطة بالشركات/المستخدمين)
const SKIP_MODELS = ['User', 'Role', 'Permission', 'Company'];

// تعريف النوع العام للـ PrismaClient المُمدد
type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

// دالة لإنشاء العميل مع الامتدادات
function createExtendedClient() {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

  // تطبيق الامتداد (الـ middleware الجديد) باستخدام $extends
  const extendedClient = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. جلب سياق الطلب الحالي
          const ctx = RequestContext.get();
          const user = ctx?.user;

          // 2. إذا لم يوجد مستخدم، أو النموذج مستثنى، نمرر العملية بدون تعديل
          if (!user || SKIP_MODELS.includes(model)) {
            return query(args);
          }

          // 3. نسخة معدّلة من args (لا نعدل الأصل مباشرة)
          let modifiedArgs = args;

          // 4. للعمليات التي تجلب البيانات (findMany, findFirst, count) نضيف companyId تلقائياً
          if (['findMany', 'findFirst', 'count'].includes(operation)) {
            modifiedArgs = {
              ...args,
              where: {
                ...args?.where,
                companyId: user.companyId,
              },
            };
          }

          // 5. للعمليات التي تنشئ بيانات (create, createMany) نضيف companyId تلقائياً
          //    (حتى لا نضطر لتمريره يدوياً في كل مكان)
          if (['create', 'createMany'].includes(operation)) {
            if (operation === 'create') {
              modifiedArgs = {
                ...args,
                data: {
                  ...args?.data,
                  companyId: user.companyId,
                },
              };
            } else if (operation === 'createMany') {
              // createMany قد يستقبل مصفوفة data أو كائن واحد حسب الإصدار
              const data = args?.data;
              if (Array.isArray(data)) {
                modifiedArgs = {
                  ...args,
                  data: data.map((item: any) => ({ ...item, companyId: user.companyId })),
                };
              } else if (data) {
                modifiedArgs = {
                  ...args,
                  data: { ...data, companyId: user.companyId },
                };
              }
            }
          }

          // 6. تنفيذ العملية المعدلة
          return query(modifiedArgs);
        },
      },
    },
  });

  return extendedClient;
}

// استخدام Singleton pattern للحفاظ على اتصال واحد
let prismaInstance: ExtendedPrismaClient | undefined;

export const prisma = (global as any).prismaInstance ?? createExtendedClient();

if (process.env.NODE_ENV !== 'production') {
  (global as any).prismaInstance = prisma;
}