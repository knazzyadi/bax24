'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Plus, X, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: { name: string; label: string | null };
  status: boolean;
  createdAt: string;
}

export default function CompanyUsersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('UsersPage');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'SUPERVISOR' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') router.push(`/${locale}/login`);
    else if (session?.user?.role !== 'ADMIN') router.push(`/${locale}/dashboard`);
    else fetchUsers();
  }, [sessionStatus]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/company/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/company/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'تم إرسال الدعوة بنجاح' });
      setShowModal(false);
      setForm({ name: '', email: '', role: 'SUPERVISOR' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/company/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `تم ${currentStatus ? 'تعطيل' : 'تفعيل'} المستخدم` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const resendInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/company/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resendInvite' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'تم إعادة إرسال الدعوة' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      const res = await fetch(`/api/company/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'تم الحذف بنجاح' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (sessionStatus === 'loading') return <div className="p-6">جاري التحميل...</div>;
  if (!session || session.user?.role !== 'ADMIN') return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={18} /> إضافة مستخدم جديد
        </button>
      </div>

      {message && (
        <div className={cn(
          "p-2 mb-4 rounded",
          message.type === 'success'
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        )}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="p-2 text-right">#</th>
                <th className="p-2 text-right">الاسم</th>
                <th className="p-2 text-right">البريد الإلكتروني</th>
                <th className="p-2 text-right">الدور</th>
                <th className="p-2 text-right">الحالة</th>
                <th className="p-2 text-right">تاريخ الإنشاء</th>
                <th className="p-2 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{user.name || '-'}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role.label || user.role.name}</td>
                  <td className="p-2">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      user.status
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    )}>
                      {user.status ? 'نشط' : 'غير نشط'}
                    </span>
                   </td>
                  <td className="p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => toggleStatus(user.id, user.status)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      title={user.status ? 'تعطيل' : 'تفعيل'}
                    >
                      {user.status ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button
                      onClick={() => resendInvite(user.id)}
                      className="text-green-600 dark:text-green-400 hover:underline"
                      title="إعادة إرسال الدعوة"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
           </table>
        </div>
      )}

      {/* Modal لإضافة مستخدم */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">إضافة مستخدم جديد</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الدور *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                >
                  <option value="SUPERVISOR">مشرف (Supervisor)</option>
                  <option value="TECHNICIAN">فني (Technician)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">إلغاء</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                  {submitting ? 'جاري الإرسال...' : 'إرسال الدعوة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}