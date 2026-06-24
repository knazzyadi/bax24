// src/lib/request-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export type RequestUser = {
  id: string;
  role: string;
  companyId?: string | null;
  branchId?: string | null;
};

export type RequestContextType = {
  user?: RequestUser;
};

const asyncLocalStorage = new AsyncLocalStorage<RequestContextType>();

export const RequestContext = {
  run: (context: RequestContextType, callback: () => void) => {
    return asyncLocalStorage.run(context, callback);
  },
  get: (): RequestContextType => {
    return asyncLocalStorage.getStore() ?? {};
  },
};