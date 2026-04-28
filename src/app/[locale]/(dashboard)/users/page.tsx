'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, X, RefreshCw, CheckCircle, XCircle, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminGuard } from '@/lib/client-guard';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: { name: string; label: string | null };
  status: boolean;
  createdAt: string;
  branches?: { id: string; name: string }[];
}

interface Branch {
  id: string;
  name: string;
}

function CompanyUsersPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('UsersPage');

  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'BRANCH_MANAGER', branchIds: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', branchIds: [] as string[] });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else if (sessionStatus === 'authenticated') {
      // لم نعد نتحقق من الدور هنا لأن AdminGuard يضمن ذلك
      fetchUsers();
      fetchBranches();
    }
  }, [sessionStatus, locale, router]);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      } else {
        console.error('Failed to fetch branches', await res.text());
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/company/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحميل المستخدمين');
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
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          roleName: form.role,
          branchIds: form.branchIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'تم إرسال الدعوة بنجاح' });
      setShowModal(false);
      setForm({ name: '', email: '', role: 'BRANCH_MANAGER', branchIds: [] });
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
      const statusText = !currentStatus ? 'تفعيل' : 'تعطيل';
      setMessage({ type: 'success', text: `تم ${statusText} المستخدم` });
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

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email,
      role: user.role.name,
      branchIds: user.branches?.map(b => b.id) || [],
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
          branchIds: editForm.branchIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'تم تحديث المستخدم بنجاح' });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleBranchToggle = (branchId: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        branchIds: prev.branchIds.includes(branchId)
          ? prev.branchIds.filter(id => id !== branchId)
          : [...prev.branchIds, branchId],
      }));
    } else {
      setForm(prev => ({
        ...prev,
        branchIds: prev.branchIds.includes(branchId)
          ? prev.branchIds.filter(id => id !== branchId)
          : [...prev.branchIds, branchId],
      }));
    }
  };

  if (sessionStatus === 'loading') {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} /> إضافة مستخدم جديد
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
        <div className="text-center py-8">جاري تحميل المستخدمين...</div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="p-3 text-right">#</th>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">البريد الإلكتروني</th>
                <th className="p-3 text-right">الدور</th>
                <th className="p-3 text-right">الفروع</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">تاريخ الإنشاء</th>
                <th className="p-3 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا يوجد مستخدمون حتى الآن
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
                      {user.branches && user.branches.length > 0
                        ? user.branches.map(b => b.name).join(', ')
                        : '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          user.status
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        )}
                      >
                        {user.status ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-yellow-600 dark:text-yellow-400 hover:opacity-80"
                        title="تعديل"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => toggleStatus(user.id, user.status)}
                        className="text-blue-600 dark:text-blue-400 hover:opacity-80"
                        title={user.status ? 'تعطيل' : 'تفعيل'}
                      >
                        {user.status ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <button
                        onClick={() => resendInvite(user.id)}
                        className="text-green-600 dark:text-green-400 hover:opacity-80"
                        title="إعادة إرسال الدعوة"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 dark:text-red-400 hover:opacity-80"
                        title="حذف"
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
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الدور *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                >
                  <option value="BRANCH_MANAGER">مدير فرع (Branch Manager)</option>
                  <option value="TECHNICIAN">فني (Technician)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الفروع المسموح بها</label>
                <div className="border border-border rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
                  {branches.length === 0 ? (
                    <p className="text-muted-foreground text-sm">لا توجد فروع متاحة</p>
                  ) : (
                    branches.map(branch => (
                      <label key={branch.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.branchIds.includes(branch.id)}
                          onChange={() => handleBranchToggle(branch.id, false)}
                          className="rounded border-border"
                        />
                        {branch.name}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">اختر الفروع التي سيتمكن المستخدم من الوصول إليها. اتركها فارغة للسماح بجميع الفروع.</p>
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

      {/* مودال تعديل مستخدم */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">تعديل المستخدم</h2>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الدور</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                >
                  <option value="BRANCH_MANAGER">مدير فرع (Branch Manager)</option>
                  <option value="TECHNICIAN">فني (Technician)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الفروع المسموح بها</label>
                <div className="border border-border rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
                  {branches.length === 0 ? (
                    <p className="text-muted-foreground text-sm">لا توجد فروع متاحة</p>
                  ) : (
                    branches.map(branch => (
                      <label key={branch.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.branchIds.includes(branch.id)}
                          onChange={() => handleBranchToggle(branch.id, true)}
                          className="rounded border-border"
                        />
                        {branch.name}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">اختر الفروع التي سيتمكن المستخدم من الوصول إليها. اتركها فارغة للسماح بجميع الفروع.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded-lg">إلغاء</button>
                <button type="submit" disabled={editSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                  {editSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyUsersPage() {
  return (
    <AdminGuard>
      <CompanyUsersPageContent />
    </AdminGuard>
  );
}