// src/app/[locale]/(invitation)/accept-invitation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  // ✅ استخدام null بدلاً من نص فارغ
  const [error, setError] = useState<string | null>(() =>
    !token
      ? isRtl
        ? 'رابط الدعوة غير صالح'
        : 'Invalid invitation link'
      : null
  );
  const [success, setSuccess] = useState(false);

  // إعادة التوجيه بعد النجاح
  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => {
      router.push(`/${locale}/login?invited=true`);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [success, router, locale]);

  // التحقق من قوة كلمة المرور
  const getPasswordStrength = (pass: string): { level: number; text: string; color: string } => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 2) return { level: 1, text: isRtl ? 'ضعيفة' : 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { level: 2, text: isRtl ? 'متوسطة' : 'Medium', color: 'bg-yellow-500' };
    return { level: 3, text: isRtl ? 'قوية' : 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password !== '';
  const isPasswordValid = password.length >= 8 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // ✅ استخدام null بدلاً من ''

    if (!token) {
      setError(isRtl ? 'رابط الدعوة غير صالح' : 'Invalid invitation link');
      return;
    }

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError(isRtl ? 'كلمة المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (trimmedPassword.length < 8) {
      setError(isRtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: trimmedPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isRtl ? 'حدث خطأ أثناء التفعيل' : 'An error occurred during activation'));
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : (isRtl ? 'حدث خطأ غير متوقع' : 'Unexpected error');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // رابط غير صالح
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md shadow-xl border-destructive/20">
          <CardHeader className="space-y-3">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className={cn('text-2xl font-bold text-center text-destructive', isRtl && 'text-right')}>
              {isRtl ? 'رابط غير صالح' : 'Invalid Link'}
            </CardTitle>
            <p className={cn('text-center text-base text-muted-foreground', isRtl && 'text-right')}>
              {isRtl
                ? 'يبدو أن رابط الدعوة غير صحيح أو منتهي الصلاحية.'
                : 'The invitation link appears to be invalid or has expired.'}
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/${locale}/login`)} className="w-full h-12 text-base">
              {isRtl ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // نجاح التفعيل
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md shadow-xl border-green-500/30">
          <CardHeader className="space-y-4">
            <div className="mx-auto bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl font-bold">
              {isRtl ? 'تم التفعيل بنجاح' : 'Activation Successful'}
            </CardTitle>
            <p className="text-center text-base text-muted-foreground">
              {isRtl
                ? 'سيتم توجيهك إلى صفحة تسجيل الدخول خلال لحظات...'
                : 'You will be redirected to the login page shortly...'}
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // الصفحة الرئيسية
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isRtl ? 'تفعيل الحساب' : 'Activate Account'}
          </CardTitle>
          <p className="text-base text-muted-foreground">
            {isRtl
              ? 'قم بتعيين كلمة مرور قوية لتفعيل حسابك'
              : 'Set a strong password to activate your account'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-12 pr-10 text-base"
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {/* مؤشر قوة كلمة المرور */}
              {password && (
                <div className="space-y-1 mt-2">
                  <div className="flex gap-1 h-1.5">
                    <div className={`flex-1 rounded-full ${passwordStrength.level >= 1 ? passwordStrength.color : 'bg-muted'}`} />
                    <div className={`flex-1 rounded-full ${passwordStrength.level >= 2 ? passwordStrength.color : 'bg-muted'}`} />
                    <div className={`flex-1 rounded-full ${passwordStrength.level >= 3 ? passwordStrength.color : 'bg-muted'}`} />
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                    {passwordStrength.text}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    <li className={password.length >= 8 ? 'text-green-500' : ''}>
                      {isRtl ? '• 8 أحرف على الأقل' : '• At least 8 characters'}
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
                      {isRtl ? '• حرف كبير (A-Z)' : '• Uppercase letter (A-Z)'}
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-500' : ''}>
                      {isRtl ? '• رقم (0-9)' : '• Number (0-9)'}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="h-12 pr-10 text-base"
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs ${passwordsMatch ? 'text-green-500' : 'text-destructive'}`}>
                  {passwordsMatch
                    ? (isRtl ? '✓ كلمة المرور متطابقة' : '✓ Passwords match')
                    : (isRtl ? '✗ كلمة المرور غير متطابقة' : '✗ Passwords do not match')}
                </p>
              )}
            </div>

            {/* الأخطاء */}
            {error && (
              <div className="flex items-start gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* زر الإرسال */}
            <Button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full h-12 text-base font-medium"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading
                ? (isRtl ? 'جاري التفعيل...' : 'Activating...')
                : (isRtl ? 'تفعيل الحساب' : 'Activate Account')}
            </Button>
          </form>
        </CardContent>

        <div className="text-center text-xs text-muted-foreground border-t pt-4 pb-4">
          {isRtl
            ? 'سيتم استخدام هذه الكلمة المرور لتسجيل الدخول إلى حسابك.'
            : 'This password will be used to log in to your account.'}
        </div>
      </Card>
    </div>
  );
}