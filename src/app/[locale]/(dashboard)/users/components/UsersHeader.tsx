'use client';

import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UsersHeaderProps {
  onAdd: () => void;
  isRtl: boolean;
}

export function UsersHeader({ onAdd, isRtl }: UsersHeaderProps) {
  return (
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
      <Button
        onClick={onAdd}
        className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        {isRtl ? 'إضافة مستخدم جديد' : 'Add New User'}
      </Button>
    </div>
  );
}