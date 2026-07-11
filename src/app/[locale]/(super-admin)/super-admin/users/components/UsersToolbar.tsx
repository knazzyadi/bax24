// src/app/[locale]/(super-admin)/super-admin/users/components/UsersToolbar.tsx

'use client';

import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Role, Company } from '../types';

interface UsersToolbarProps {
  onAdd: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filterRole: string;
  onRoleChange: (value: string) => void;
  filterCompany: string;
  onCompanyChange: (value: string) => void;
  roles: Role[];
  companies: Company[];
  total?: number;
}

export function UsersToolbar({
  onAdd,
  search,
  onSearchChange,
  filterRole,
  onRoleChange,
  filterCompany,
  onCompanyChange,
  roles,
  companies,
  total,
}: UsersToolbarProps) {
  return (
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-indigo-100/30 via-transparent to-purple-100/30 dark:from-indigo-950/20 dark:via-transparent dark:to-purple-950/20" />
      
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
          <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">إدارة المستخدمين</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إدارة مستخدمي النظام والأدوار</p>
          {typeof total === 'number' && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
              {total} {total === 1 ? 'مستخدم' : 'مستخدمين'}
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={onAdd}
        className="h-12 rounded-xl px-6 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
      >
        <Plus className="h-5 w-5" />
        إضافة مستخدم جديد
      </Button>
    </div>
  );
}

// أضف استيراد Users
import { Users } from 'lucide-react';