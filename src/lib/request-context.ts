//src\lib\request-context.ts
//في أي تطبيق ويب، كل طلب (Request) يأتي من مستخدم مختلف
import { AsyncLocalStorage } from 'async_hooks';

export type RequestContextType = {
  user?: {
    id: string;
    role: string;
    companyId?: string | null;
    branchId?: string | null;
  };
};

const asyncLocalStorage = new AsyncLocalStorage<RequestContextType>();

export const RequestContext = {
  run: (context: RequestContextType, callback: () => any) => {
    return asyncLocalStorage.run(context, callback);
  },

  get: (): RequestContextType => {
    return asyncLocalStorage.getStore() || {};
  },
};