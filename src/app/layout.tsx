// src/app/layout.tsx
//هو الهيكل الأساسي (Root Layout) للتطبيق بالكامل في Next.js، ويغلف كل الصفحات بالـ Providers
//والإعدادات العامة (الثيم، الجلسة، الخطوط).
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  subsets: ['arabic'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${ibmPlexSansArabic.variable}`}>
      <body>
        <ThemeProvider defaultTheme="dark">
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
        {/* Toaster واحد فقط في أعلى التسلسل - إعدادات صلبة غير زجاجية */}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backdropFilter: 'none',
            },
          }}
        />
      </body>
    </html>
  );
}