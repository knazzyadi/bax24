// app/providers.tsx
"use client"; // يجب أن يكون Client Component لأن React Query يعمل على العميل

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // نقوم بإنشاء QueryClient داخل useState لضمان عدم إعادة إنشائه في كل رندر (لتحسين الأداء)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // تجنب إعادة الجلب المتكررة غير الضرورية
            staleTime: 60 * 1000, // البيانات تظل جديدة لمدة دقيقة واحدة
            refetchOnWindowFocus: false, // لا تعيد الجلب عند العودة للتبويب
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}