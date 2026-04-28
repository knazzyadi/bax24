//src\components\LayoutController.tsx
/**يتحكم في شكل الصفحة (Dashboard / Auth / Public)
*يحدد هل يظهر Header / Sidebar
*/
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const HIDE_TOOLBARS_PATHS = [
  '/ar/super-admin/users',
  '/en/super-admin/users',
  '/ar/users',
  '/en/users',
  // أضف أي مسار تريده، مثلاً:
  // '/ar/super-admin/companies',
  // '/en/reports',
];

export default function LayoutController() {
  const pathname = usePathname();

  useEffect(() => {
    const shouldHide = HIDE_TOOLBARS_PATHS.some(path => pathname?.startsWith(path));

    if (shouldHide) {
      document.body.classList.add('hide-app-toolbars');
    } else {
      document.body.classList.remove('hide-app-toolbars');
    }

    return () => {
      document.body.classList.remove('hide-app-toolbars');
    };
  }, [pathname]);

  return null;
}