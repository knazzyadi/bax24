'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Plus, X, RefreshCw, CheckCircle, XCircle, Trash2, Pencil, Search, 
  ChevronDown, ChevronUp 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ تم تعديل الواجهة لتشمل id داخل role و company
interface User {
  id: string;
  name: string | null;
  email: string;
  role: { id: string; name: string; label: string | null } | null;
  company: { id: string; name: string } | null;
  status: boolean;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  label: string | null;
}

export default function SuperAdminUsersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('SuperAdminUsersPage');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // States for search/filter
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // States for invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    roleId: '',
    companyId: '',
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  
  // States for edit modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', roleId: '', companyId: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Fetch users with filters
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      if (filterCompany) params.append('companyId', filterCompany);
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('fetchError', { fallback: 'فشل تحميل المستخدمين' }));
      setUsers(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch meta data (companies, roles)
  const fetchMeta = async () => {
    try {
      const [companiesRes, rolesRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/admin/setup-roles'), // ✅ تغيير المسار من /api/roles إلى /api/admin/setup-roles
      ]);
      if (companiesRes.ok) setCompanies(await companiesRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
    } catch (error) {
      console.error('Error fetching meta:', error);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else if (sessionStatus === 'authenticated') {
      if (session?.user?.role !== 'SUPER_ADMIN') {
        router.push(`/${locale}/dashboard`);
      } else {
        fetchUsers();
        fetchMeta();
      }
    }
  }, [sessionStatus, session, locale, router]);

  // Invite new user
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError('');
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('inviteError', { fallback: 'فشل إرسال الدعوة' }));
      setMessage({ type: 'success', text: t('inviteSuccess', { fallback: 'تم إرسال الدعوة بنجاح' }) });
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', roleId: '', companyId: '' });
      fetchUsers();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  // Toggle user status (activate/deactivate)
  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('statusError', { fallback: 'فشل تحديث الحالة' }));
      const statusText = !currentStatus ? t('active', { fallback: 'تفعيل' }) : t('inactive', { fallback: 'تعطيل' });
      setMessage({ type: 'success', text: t('statusToggled', { status: statusText, fallback: `تم ${statusText} المستخدم` }) });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Resend invitation email
  const resendInvite = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/resend-invite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: t('resendSuccess', { fallback: 'تم إعادة إرسال الدعوة بنجاح' }) });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Delete user (super admin only)
  const deleteUser = async (id: string) => {
    if (!confirm(t('deleteConfirm', { fallback: 'هل أنت متأكد من حذف هذا المستخدم نهائياً؟' }))) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: t('deleteSuccess', { fallback: 'تم حذف المستخدم بنجاح' }) });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Open edit modal with user data
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email,
      roleId: user.role?.id || '',
      companyId: user.company?.id || '',
    });
  };

  // Update user (name, email, role, company)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          roleId: editForm.roleId,
          companyId: editForm.companyId,
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
  if (!session || session.user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('title', { fallback: 'إدارة المستخدمين (سوبر أدمن)' })}</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} /> {t('addUser', { fallback: 'إضافة مستخدم جديد' })}
        </button>
      </div>

      {/* Message */}
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

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder', { fallback: 'بحث بالاسم أو البريد' })}
            className="pr-9 p-2 border border-border rounded-lg bg-background w-64"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="p-2 border border-border rounded-lg bg-background"
        >
          <option value="">{t('allRoles', { fallback: 'كل الأدوار' })}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>{r.label || r.name}</option>
          ))}
        </select>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="p-2 border border-border rounded-lg bg-background"
        >
          <option value="">{t('allCompanies', { fallback: 'كل الشركات' })}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={fetchUsers}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          {t('searchButton', { fallback: 'بحث' })}
        </button>
      </div>

      {/* Users Table */}
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
                <th className="p-3 text-right">{t('company', { fallback: 'الشركة' })}</th>
                <th className="p-3 text-right">{t('status', { fallback: 'الحالة' })}</th>
                <th className="p-3 text-right">{t('createdAt', { fallback: 'تاريخ الإنشاء' })}</th>
                <th className="p-3 text-right">{t('actions', { fallback: 'الإجراءات' })}</th>
               </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('noUsers', { fallback: 'لا يوجد مستخدمون' })}
                   </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{user.name || '-'}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role?.label || user.role?.name || '-'}</td>
                    <td className="p-3">{user.company?.name || '-'}</td>
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
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        className="text-blue-600 dark:text-blue-400 hover:opacity-80"
                        title={user.status ? t('statusInactive', { fallback: 'تعطيل' }) : t('statusActive', { fallback: 'تفعيل' })}
                      >
                        {user.status ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                      {user.role?.name !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => resendInvite(user.id)}
                          className="text-green-600 dark:text-green-400 hover:opacity-80"
                          title={t('resendInvite', { fallback: 'إعادة إرسال الدعوة' })}
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('inviteUser', { fallback: 'إضافة مستخدم جديد' })}</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('fullName', { fallback: 'الاسم الكامل' })} *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('email', { fallback: 'البريد الإلكتروني' })} *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('role', { fallback: 'الدور' })} *</label>
                <select
                  required
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                >
                  <option value="">{t('selectRole', { fallback: 'اختر دور' })}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.label || role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('company', { fallback: 'الشركة' })} *</label>
                <select
                  required
                  value={inviteForm.companyId}
                  onChange={(e) => setInviteForm({ ...inviteForm, companyId: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                >
                  <option value="">{t('selectCompany', { fallback: 'اختر شركة' })}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              {inviteError && <div className="text-red-600 text-sm">{inviteError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 border rounded-lg">{t('cancel', { fallback: 'إلغاء' })}</button>
                <button type="submit" disabled={inviting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                  {inviting ? t('sending', { fallback: 'جاري الإرسال...' }) : t('sendInvite', { fallback: 'إرسال الدعوة' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('editUser', { fallback: 'تعديل المستخدم' })}</h2>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            {roles.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {t('loadingRoles', { fallback: 'جاري تحميل الأدوار...' })}
              </div>
            ) : (
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
                    value={editForm.roleId}
                    onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                    required
                  >
                    <option value="">{t('selectRole', { fallback: 'اختر دور' })}</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.label || role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('company', { fallback: 'الشركة' })}</label>
                  <select
                    value={editForm.companyId}
                    onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-background dark:bg-gray-800 dark:text-white"
                    required
                  >
                    <option value="">{t('selectCompany', { fallback: 'اختر شركة' })}</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded-lg">{t('cancel', { fallback: 'إلغاء' })}</button>
                  <button type="submit" disabled={editSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                    {editSubmitting ? t('saving', { fallback: 'جاري الحفظ...' }) : t('saveChanges', { fallback: 'حفظ التغييرات' })}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}