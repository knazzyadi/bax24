'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User, Branch, UserFormData } from '../types';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser?: User | null;
  branches: Branch[];
  roles: { id: string; name: string; label: string | null }[];
  onSave: (data: UserFormData) => Promise<void>;
  isSaving: boolean;
  isRtl: boolean;
}

const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm';

export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  branches,
  roles,
  onSave,
  isSaving,
  isRtl,
}: UserFormDialogProps) {
  const getInitialForm = (): UserFormData => {
    if (editingUser) {
      return {
        name: editingUser.name || '',
        email: editingUser.email,
        roleId: editingUser.role.id,
        branchIds: editingUser.branches?.map((b) => b.id) || [],
      };
    }

    return {
      name: '',
      email: '',
      roleId: roles[0]?.id || '',
      branchIds: [],
    };
  };

  const [form, setForm] = useState<UserFormData>(getInitialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(form);
      onOpenChange(false);
      } catch {
      // Error already handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleBranchToggle = (branchId: string) => {
    setForm((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId],
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={cn(glassCard, 'w-full max-w-md max-h-[90vh] overflow-y-auto p-6')}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {editingUser
              ? isRtl
                ? 'تعديل المستخدم'
                : 'Edit User'
              : isRtl
              ? 'إضافة مستخدم جديد'
              : 'Add New User'}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

          <form
            key={editingUser?.id ?? 'new-user'}
            onSubmit={handleSubmit}
            className="space-y-4"
          >          <div className="space-y-1.5">
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
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 appearance-none"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {isRtl ? role.label || role.name : role.label || role.name}
                </option>
              ))}
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
                branches.map((branch) => (
                  <label
                    key={branch.id}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.branchIds.includes(branch.id)}
                      onChange={() => handleBranchToggle(branch.id)}
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
              disabled={submitting || isSaving}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50"
            >
              {submitting || isSaving
                ? isRtl
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : editingUser
                ? isRtl
                  ? 'حفظ التغييرات'
                  : 'Save Changes'
                : isRtl
                ? 'إرسال الدعوة'
                : 'Send Invite'}
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}