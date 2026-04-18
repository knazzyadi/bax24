'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordRoot() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    const locale = 'ar'; // اللغة الافتراضية
    router.replace(`/${locale}/reset-password?token=${token}`);
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>جاري التوجيه...</p>
    </div>
  );
}