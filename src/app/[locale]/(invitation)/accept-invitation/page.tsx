// src/app/[locale]/(invitation)/accept-invitation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations('Invitation'); // تأكد من وجود هذه الترجمات، أو استخدم نصوصاً ثابتة إذا لم تكن موجودة

  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(isRtl ? 'رابط الدعوة غير صالح' : 'Invalid invitation link');
    }
  }, [token, isRtl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(isRtl ? 'كلمة المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError(isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isRtl ? 'حدث خطأ' : 'An error occurred'));
      setSuccess(true);
      // الانتقال إلى صفحة الدخول بعد 2 ثانية
      setTimeout(() => {
        router.push(`/${locale}/login?invited=true`);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // حالة عدم وجود توكن (رابط غير صالح)
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className={cn('text-2xl font-bold text-destructive', isRtl && 'text-right')}>
              {isRtl ? 'رابط غير صالح' : 'Invalid Link'}
            </CardTitle>
            <CardDescription className={isRtl && 'text-right'}>
              {isRtl
                ? 'يبدو أن رابط الدعوة غير صحيح أو منتهي الصلاحية.'
                : 'The invitation link appears to be invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push(`/${locale}/login`)} className="w-full">
              {isRtl ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // حالة النجاح
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl font-bold">
              {isRtl ? 'تم التفعيل بنجاح' : 'Activation Successful'}
            </CardTitle>
            <CardDescription className="text-center">
              {isRtl
                ? 'سيتم توجيهك إلى صفحة تسجيل الدخول خلال لحظات...'
                : 'You will be redirected to the login page shortly...'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // النموذج الرئيسي
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader>
          <CardTitle className={cn('text-2xl font-bold text-center', isRtl && 'font-cairo')}>
            {isRtl ? 'تفعيل الحساب' : 'Activate Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {isRtl
              ? 'قم بتعيين كلمة مرور جديدة لتفعيل حسابك'
              : 'Set a new password to activate your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className={isRtl ? 'text-right block' : ''}>
                {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11"
                dir={isRtl ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={isRtl ? 'text-right block' : ''}>
                {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="h-11"
                dir={isRtl ? 'rtl' : 'ltr'}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading
                ? (isRtl ? 'جاري التفعيل...' : 'Activating...')
                : (isRtl ? 'تفعيل الحساب' : 'Activate Account')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}