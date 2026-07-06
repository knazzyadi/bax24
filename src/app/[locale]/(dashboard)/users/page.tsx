// src/app/[locale]/(dashboard)/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, X, RefreshCw, CheckCircle, XCircle, Trash2, Pencil, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminGuard } from '@/lib/client-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// =========================
// تنسيقات موحدة (نفس باقي صفحات النظام)
// =========================
const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300';

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
  const isRtl = locale === 'ar';

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
    if (!confirm(isRtl ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) return;
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
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <span className="text-sm text-slate-500 dark:text-slate-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة (نفس باقي الصفحات) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة المخصص (مطابق لباقي الصفحات) */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? 'إدارة المستخدمين' : 'User Management'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? 'إدارة المستخدمين والأدوار والصلاحيات'
                : 'Manage users, roles and permissions'}
            </p>
          </div>
        </div>
        {!showModal && !editingUser && (
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {isRtl ? 'إضافة مستخدم جديد' : 'Add New User'}
          </Button>
        )}
      </div>

      {/* رسائل النجاح / الخطأ */}
      {message && (
        <div
          className={cn(
            'p-4 rounded-xl border text-sm font-medium',
            message.type === 'success'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30 text-rose-700 dark:text-rose-300'
          )}
        >
          {message.text}
        </div>
      )}

      {/* جدول المستخدمين */}
      <div className={glassCard}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isRtl ? 'قائمة المستخدمين' : 'Users List'}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            {isRtl ? 'لا يوجد مستخدمون حتى الآن' : 'No users yet'}
          </div>
        ) : (
          <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    #
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {isRtl ? 'الاسم' : 'Name'}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {isRtl ? 'البريد الإلكتروني' : 'Email'}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {isRtl ? 'الدور' : 'Role'}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {isRtl ? 'الفروع' : 'Branches'}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center">
                    {isRtl ? 'الحالة' : 'Status'}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {isRtl ? 'تاريخ الإنشاء' : 'Created At'}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center">
                    {isRtl ? 'الإجراءات' : 'Actions'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {users.map((user, idx) => (
                  <TableRow key={user.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                    <TableCell className="text-slate-600 dark:text-slate-300">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                      {user.name || '-'}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{user.email}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {user.role.label || user.role.name}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {user.branches && user.branches.length > 0
                        ? user.branches.map(b => b.name).join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          user.status
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        )}
                      >
                        {user.status ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {new Date(user.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                          title={isRtl ? 'تعديل' : 'Edit'}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => toggleStatus(user.id, user.status)}
                          className="p-2 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 hover:scale-110"
                          title={user.status ? (isRtl ? 'تعطيل' : 'Disable') : (isRtl ? 'تفعيل' : 'Enable')}
                        >
                          {user.status ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button
                          onClick={() => resendInvite(user.id)}
                          className="p-2 rounded-full text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 hover:scale-110"
                          title={isRtl ? 'إعادة إرسال الدعوة' : 'Resend Invite'}
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110"
                          title={isRtl ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* مودال إضافة مستخدم */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={cn(glassCard, "w-full max-w-md max-h-[90vh] overflow-y-auto p-6")}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isRtl ? 'إضافة مستخدم جديد' : 'Add New User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? 'الاسم الكامل' : 'Full Name'} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? 'البريد الإلكتروني' : 'Email'} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? 'الدور' : 'Role'} <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 appearance-none"
                >
                  <option value="BRANCH_MANAGER">{isRtl ? 'مدير فرع' : 'Branch Manager'}</option>
                  <option value="TECHNICIAN">{isRtl ? 'فني' : 'Technician'}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? 'الفروع المسموح بها' : 'Allowed Branches'}
                </Label>
                <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto bg-white/30 dark:bg-slate-900/30">
                  {branches.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      {isRtl ? 'لا توجد فروع متاحة' : 'No branches available'}
                    </p>
                  ) : (
                    branches.map(branch => (
                      <label key={branch.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.branchIds.includes(branch.id)}
                          onChange={() => handleBranchToggle(branch.id, false)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-indigo-600"
                        />
                        {branch.name}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {isRtl
                    ? 'اختر الفروع التي سيتمكن المستخدم من الوصول إليها. اتركها فارغة للسماح بجميع الفروع.'
                    : 'Select branches the user can access. Leave empty for all branches.'}
                </p>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال الدعوة' : 'Send Invite')}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تعديل مستخدم */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={cn(glassCard, "w-full max-w-md max-h-[90vh] overflow-y-auto p-6")}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isRtl ? 'تعديل المستخدم' : 'Edit User'}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? 'الاسم الكامل' : 'Full Name'} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? 'البريد الإلكتروني' : 'Email'} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? 'الدور' : 'Role'} <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 appearance-none"
                >
                  <option value="BRANCH_MANAGER">{isRtl ? 'مدير فرع' : 'Branch Manager'}</option>
                  <option value="TECHNICIAN">{isRtl ? 'فني' : 'Technician'}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? 'الفروع المسموح بها' : 'Allowed Branches'}
                </Label>
                <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto bg-white/30 dark:bg-slate-900/30">
                  {branches.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      {isRtl ? 'لا توجد فروع متاحة' : 'No branches available'}
                    </p>
                  ) : (
                    branches.map(branch => (
                      <label key={branch.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.branchIds.includes(branch.id)}
                          onChange={() => handleBranchToggle(branch.id, true)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-indigo-600"
                        />
                        {branch.name}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {isRtl
                    ? 'اختر الفروع التي سيتمكن المستخدم من الوصول إليها. اتركها فارغة للسماح بجميع الفروع.'
                    : 'Select branches the user can access. Leave empty for all branches.'}
                </p>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <Button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  {editSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
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