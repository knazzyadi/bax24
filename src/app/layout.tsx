// src/app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { Inter, IBM_Plex_Sans_Arabic, Geist } from 'next/font/google';
import '@/app/globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next"; // ✅ استيراد SpeedInsights

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  subsets: ['arabic'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(inter.variable, ibmPlexSansArabic.variable, "font-sans", geist.variable)}>
      <body>
        <ThemeProvider defaultTheme="dark">
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
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
        {/* ✅ إضافة SpeedInsights */}
        <SpeedInsights />
      </body>
    </html>
  );
}