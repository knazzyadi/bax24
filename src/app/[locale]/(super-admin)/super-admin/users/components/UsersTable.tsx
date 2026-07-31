// src/app/[locale]/(super-admin)/super-admin/users/components/UsersTable.tsx

'use client';

import { Pencil, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '../types';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onResendInvite: (id: string) => void;
}

export function UsersTable({
  users,
  onEdit,
  onDelete,
  onToggleStatus,
  onResendInvite,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16">
        <div className="mb-4 text-6xl">👤</div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">لا يوجد مستخدمون</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          انقر على &apos;إضافة مستخدم جديد&apos; لإنشاء أول مستخدم
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="min-w-full bg-card">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b">
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">#</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الاسم</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">البريد الإلكتروني</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الدور</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الشركة</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الحالة</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">تاريخ الإنشاء</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
          {users.map((user, index) => (
            <tr key={user.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
              <td className="p-3 text-center text-slate-700 dark:text-slate-200">{index + 1}</td>
              <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{user.name || '—'}</td>
              <td className="p-3 text-slate-600 dark:text-slate-300">{user.email}</td>
              <td className="p-3 text-slate-600 dark:text-slate-300">
                {user.role?.label || user.role?.name || '—'}
              </td>
              <td className="p-3 text-slate-600 dark:text-slate-300">
                {user.company?.name || '—'}
              </td>
              <td className="p-3">
                <Badge
                  variant={user.status ? 'default' : 'secondary'}
                  className={
                    user.status
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }
                >
                  {user.status ? 'نشط' : 'غير نشط'}
                </Badge>
              </td>
              <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                {new Date(user.createdAt).toLocaleDateString('ar-SA')}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(user)}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    title="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus(user.id, user.status)}
                    className={
                      user.status
                        ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    }
                    title={user.status ? 'تعطيل' : 'تفعيل'}
                  >
                    {user.status ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </Button>
                  {user.role?.name !== 'SUPER_ADMIN' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onResendInvite(user.id)}
                      className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                      title="إعادة إرسال الدعوة"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(user.id)}
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}