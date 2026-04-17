'use client';

import { usePathname, useParams } from 'next/navigation';
import { Globe } from 'lucide-react';

export function LocaleSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'en';

  const switchLocale = () => {
    const newLocale = currentLocale === 'ar' ? 'en' : 'ar';
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    // إعادة تحميل الصفحة كاملة لضمان تحديث كل المحتوى
    window.location.href = newPathname;
  };

  return (
    <button
      onClick={switchLocale}
      className="p-2 rounded-md hover:bg-muted transition"
      aria-label="تبديل اللغة"
    >
      <Globe size={20} />
    </button>
  );
}