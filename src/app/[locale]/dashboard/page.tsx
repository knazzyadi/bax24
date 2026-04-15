'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { LogOut, Building, Wrench, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('Dashboard');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) return null;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const stats = [
    { icon: Building, label: t('facilities'), value: 12 },
    { icon: Wrench, label: t('maintenance'), value: 5 },
    { icon: Users, label: t('staff'), value: 8 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">bax24 - {t('title')}</h1>
        <div className="flex gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 rounded-md border hover:bg-red-100 dark:hover:bg-red-900">
            <LogOut size={18} /> {t('logout')}
          </button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-6">{t('welcome')}, {session.user?.email}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="border rounded-lg p-6 shadow-sm flex items-center gap-4">
              <stat.icon size={40} className="text-primary" />
              <div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-3xl font-bold">{stat.value}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-10 p-4 border rounded-lg bg-muted/20 text-center text-muted-foreground">{t('comingSoon')}</div>
      </main>
    </div>
  );
}