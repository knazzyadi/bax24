'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn, KeyRound, Home } from 'lucide-react';

export default function LoginPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const router = useRouter();
  const t = useTranslations('Login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result) {
        setError('حدث خطأ غير متوقع');
        return;
      }

      if (result.error) {
        setError('بيانات الدخول غير صحيحة');
        return;
      }

      // تحسين التوجيه مستقبلاً حسب الدور
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Home */}
          <div className="mb-4">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">الرئيسية</span>
            </Link>
          </div>

          {/* Card */}
          <div className="p-8 space-y-8 bg-card rounded-2xl shadow-xl border border-border">

            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                {t('title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                تسجيل الدخول إلى النظام
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('email')}
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                  <input
                    type="email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
                    placeholder="admin@system.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('password')}
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                  <input
                    type="password"
                    value={password}
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
                    required
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-sm text-muted-foreground hover:text-indigo-600 flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    نسيت كلمة المرور؟
                  </Link>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-50"
              >
                {loading ? 'جاري الدخول...' : t('submit')}
                <LogIn className="w-4 h-4" />
              </button>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}