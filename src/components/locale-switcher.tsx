'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => switchLocale('en')}
        className={`px-2 py-1 rounded ${locale === 'en' ? 'bg-primary text-primary-foreground' : 'border'}`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('ar')}
        className={`px-2 py-1 rounded ${locale === 'ar' ? 'bg-primary text-primary-foreground' : 'border'}`}
      >
        AR
      </button>
    </div>
  );
}