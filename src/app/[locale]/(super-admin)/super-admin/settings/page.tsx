'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Message = {
  type: 'success' | 'error';
  text: string;
};

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
      return;
    }

    if (session?.user?.role !== 'SUPER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }

    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [status, session, router, locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage(null);

    try {
      const { name, email, password, confirmPassword } = formData;

      if (password && password !== confirmPassword) {
        setMessage({
          type: 'error',
          text: 'كلمة المرور غير متطابقة',
        });
        return;
      }

      const payload: any = {
        name,
        email,
      };

      // إرسال كلمة المرور فقط إذا تم إدخالها
      if (password) {
        payload.password = password;
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل التحديث');
      }

      await update({
        name,
        email,
      });

      setMessage({
        type: 'success',
        text: 'تم تحديث الملف الشخصي بنجاح',
      });

      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        الإعدادات
      </h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          الملف الشخصي للسوبر أدمن
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="الاسم"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="كلمة المرور الجديدة (اختياري)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />

          <Input
            label="تأكيد كلمة المرور"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        إعدادات إضافية سيتم إضافتها لاحقاً
      </div>
    </div>
  );
}

/* 🧩 Input Component (Inline Reusable) */
function Input({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-foreground">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full p-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}