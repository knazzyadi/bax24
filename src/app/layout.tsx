// src/app/layout.tsx
//هو الهيكل الأساسي (Root Layout) للتطبيق بالكامل في Next.js، ويغلف كل الصفحات بالـ Providers
//والإعدادات العامة (الثيم، الجلسة، الخطوط).
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';
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
      </body>
    </html>
  );
}