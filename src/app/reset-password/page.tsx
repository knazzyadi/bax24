'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');

  useEffect(() => {
    const locale = 'ar';

    router.replace(`/${locale}/reset-password?token=${token ?? ''}`);
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>جاري التوجيه...</p>
    </div>
  );
}

export default function ResetPasswordRoot() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>جاري التحميل...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}