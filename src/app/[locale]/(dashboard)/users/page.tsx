'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, X, RefreshCw, CheckCircle, XCircle, Trash2, Pencil } from 'lucide-react';
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
  const [form, setForm] = useState({ name: '', email: '', role: 'SUPERVISOR' });
  const [submitting, setSubmitting] = useState(false);

  // States for edit modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else if (sessionStatus === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push(`/${locale}/dashboard`);
      } else {
        fetchUsers();
      }
    }
  }, [sessionStatus, session, locale, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/company/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('fetchError', { fallback: 'فشل تحميل المستخدمين' }));
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
        body: JSON.stringify({ ...form, roleName: form.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: t('inviteSuccess', { fallback: 'تم إرسال الدعوة بنجاح' }) });
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
      const statusText = !currentStatus ? t('active', { fallback: 'تفعيل' }) : t('inactive', { fallback: 'تعطيل' });
      setMessage({ type: 'success', text: t('statusToggled', { status: statusText, fallback: `تم ${statusText} المستخدم` }) });
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
      setMessage({ type: 'success', text: t('resendSuccess', { fallback: 'تم إعادة إرسال الدعوة' }) });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm(t('deleteConfirm', { fallback: 'هل أنت متأكد من حذف هذا المستخدم؟' }))) return;
    try {
      const res = await fetch(`/api/company/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: t('deleteSuccess', { fallback: 'تم الحذف بنجاح' }) });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email,
      role: user.role.name,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/company/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          name: editForm.name,
          email: editForm.email,
          roleName: editForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: t('updateSuccess', { fallback: 'تم تحديث المستخدم بنجاح' }) });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setEditSubmitting(false);
    }
  };

  if (sessionStatus === 'loading') {
    return <div className="p-6 text-center">{t('loading', { fallback: 'جاري التحميل...' })}</div>;
  }
  if (!session || session.user?.role !== 'ADMIN') return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t('title', { fallback: 'إدارة المستخدمين' })}
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} /> {t('addUser', { fallback: 'إضافة مستخدم جديد' })}
        </button>
      </div>

      {message && (
        <div
          className={cn(
            'p-3 mb-4 rounded-md',
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          )}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">{t('loading', { fallback: 'جاري تحميل المستخدمين...' })}</div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="p-3 text-right">#</th>
                <th className="p-3 text-right">{t('name', { fallback: 'الاسم' })}</th>
                <th className="p-3 text-right">{t('email', { fallback: 'البريد الإلكتروني' })}</th>
                <th className="p-3 text-right">{t('role', { fallback: 'الدور' })}</th>
                <th className="p-3 text-right">{t('status', { fallback: 'الحالة' })}</th>
                <th className="p-3 text-right">{t('createdAt', { fallback: 'تاريخ الإنشاء' })}</th>
                <th className="p-3 text-right">{t('actions', { fallback: 'الإجراءات' })}</th>
                </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('noUsers', { fallback: 'لا يوجد مستخدمون حتى الآن' })}
                    </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{user.name || '-'}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role.label || user.role.name}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          user.status
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        )}
                      >
                        {user.status ? t('active', { fallback: 'نشط' }) : t('inactive', { fallback: 'غير نشط' })}
                      </span>
                    </td>
                    <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-yellow-600 dark:text-yellow-400 hover:opacity-80"
                        title={t('editUser', { fallback: 'تعديل' })}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => toggleStatus(user.id, user.status)}
                        className="text-blue-600 dark:text-blue-400 hover:opacity-80"
                        title={user.status ? t('statusInactive', { fallback: 'تعطيل' }) : t('statusActive', { fallback: 'تفعيل' })}
                      >
                        {user.status ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <button
                        onClick={() => resendInvite(user.id)}
                        className="text-green-600 dark:text-green-400 hover:opacity-80"
                        title={t('resendInvite', { fallback: 'إعادة إرسال الدعوة' })}
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 dark:text-red-400 hover:opacity-80"
                        title={t('delete', { fallback: 'حذف' })}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* مودال إضافة مستخدم */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('inviteUser', { fallback: 'إضافة مستخدم جديد' })}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('fullName', { fallback: 'الاسم الكامل' })} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('email', { fallback: 'البريد الإلكتروني' })} *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('role', { fallback: 'الدور' })} *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                >
                  <option value="SUPERVISOR">{t('supervisor', { fallback: 'مشرف (Supervisor)' })}</option>
                  <option value="TECHNICIAN">{t('technician', { fallback: 'فني (Technician)' })}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">{t('cancel', { fallback: 'إلغاء' })}</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                  {submitting ? t('sending', { fallback: 'جاري الإرسال...' }) : t('sendInvite', { fallback: 'إرسال الدعوة' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تعديل مستخدم */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('editUser', { fallback: 'تعديل المستخدم' })}</h2>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('fullName', { fallback: 'الاسم الكامل' })}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('email', { fallback: 'البريد الإلكتروني' })}</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('role', { fallback: 'الدور' })}</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                >
                  <option value="SUPERVISOR">{t('supervisor', { fallback: 'مشرف (Supervisor)' })}</option>
                  <option value="TECHNICIAN">{t('technician', { fallback: 'فني (Technician)' })}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded-lg">{t('cancel', { fallback: 'إلغاء' })}</button>
                <button type="submit" disabled={editSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                  {editSubmitting ? t('saving', { fallback: 'جاري الحفظ...' }) : t('saveChanges', { fallback: 'حفظ التغييرات' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}