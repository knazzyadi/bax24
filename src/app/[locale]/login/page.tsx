'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn, KeyRound, Home } from 'lucide-react';

export default function LoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError('بيانات الدخول غير صحيحة');
        setLoading(false);
        return;
      }

      router.push(`/${locale}/dashboard`);
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">

        {/* العودة للرئيسية */}
        <div className="mb-4">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">الرئيسية</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground mt-2">
              مرحباً بك، أدخل بياناتك للمتابعة
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-sm mb-1 block">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm mb-1 block">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex justify-end mt-2">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs text-muted-foreground hover:text-indigo-600 flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  نسيت كلمة المرور؟
                </Link>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
              <LogIn className="w-4 h-4" />
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}