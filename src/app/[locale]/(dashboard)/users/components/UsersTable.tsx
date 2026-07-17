'use client';

import { useTranslations } from 'next-intl';
import { Pencil, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { User } from '../types';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onResendInvite: (id: string) => void;
  isPending?: boolean;
  isRtl?: boolean; // ✅ إضافة isRtl اختيارية
}

export function UsersTable({
  users,
  onEdit,
  onDelete,
  onToggleStatus,
  onResendInvite,
  isPending,
  isRtl = true, // ✅ قيمة افتراضية
}: UsersTableProps) {
  const t = useTranslations('UsersPage');

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        {isRtl ? 'لا يوجد مستخدمون حتى الآن' : 'No users yet'}
      </div>
    );
  }

  return (
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
                {user.role?.label || user.role?.name || '-'}
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300">
                {user.branches && user.branches.length > 0
                  ? user.branches.map((b) => b.name).join(', ')
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
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                    title={isRtl ? 'تعديل' : 'Edit'}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onToggleStatus(user.id)}
                    className="p-2 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 hover:scale-110"
                    title={user.status ? (isRtl ? 'تعطيل' : 'Disable') : (isRtl ? 'تفعيل' : 'Enable')}
                  >
                    {user.status ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button
                    onClick={() => onResendInvite(user.id)}
                    className="p-2 rounded-full text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 hover:scale-110"
                    title={isRtl ? 'إعادة إرسال الدعوة' : 'Resend Invite'}
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
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
  );
}