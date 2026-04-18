'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordRoot() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    // يمكنك تغيير اللغة الافتراضية حسب إعدادات المستخدم أو المتصفح
    const locale = 'ar'; // أو استخدم navigator.language.split('-')[0] مثلاً
    router.replace(`/${locale}/reset-password?token=${token}`);
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>جاري التوجيه...</p>
    </div>
  );
}