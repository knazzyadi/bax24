// src/lib/request-context.ts
// في أي تطبيق ويب، كل طلب (Request) يأتي من مستخدم مختلف.
// يستخدم هذا الملف AsyncLocalStorage لعزل البيانات (مثل معلومات المستخدم) لكل طلب على حدة،
// مما يسمح بالوصول إليها في أي مكان في دورة حياة الطلب (مثل Prisma extensions).

import { AsyncLocalStorage } from 'async_hooks';

/**
 * تعريف نوع البيانات المخزنة في سياق الطلب.
 * يمكن توسيع هذا النوع ليشمل أي بيانات إضافية متعلقة بالطلب.
 */
export type RequestContextType = {
  user?: {
    id: string;
    role: string;
    companyId?: string | null;
    branchId?: string | null;
  };
};

// إنشاء مخزن محلي غير متزامن (AsyncLocalStorage) لعزل البيانات لكل طلب.
const asyncLocalStorage = new AsyncLocalStorage<RequestContextType>();

/**
 * كائن RequestContext يحتوي على دوال للتفاعل مع السياق:
 * - run: تنفيذ دالة معينة في سياق محدد.
 * - get: الحصول على السياق الحالي (أو كائن فارغ إذا لم يكن موجوداً).
 */
export const RequestContext = {
  /**
   * تنفيذ دالة callback في سياق محدد (context).
   * @param context - كائن يحتوي على بيانات السياق (مثل المستخدم).
   * @param callback - الدالة التي سيتم تنفيذها في هذا السياق.
   * @returns قيمة إرجاع الدالة callback.
   */
  run: (context: RequestContextType, callback: () => any) => {
    return asyncLocalStorage.run(context, callback);
  },

  /**
   * الحصول على السياق الحالي.
   * @returns كائن RequestContextType أو كائن فارغ إذا لم يكن هناك سياق نشط.
   */
  get: (): RequestContextType => {
    return asyncLocalStorage.getStore() || {};
  },
};