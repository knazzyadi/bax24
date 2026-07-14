'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void;
  isDeleting: boolean;
  isRtl: boolean;
}

const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm';

export function UserDeleteDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
  isDeleting,
  isRtl,
}: UserDeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={cn(glassCard, 'w-full max-w-md p-6')}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {isRtl ? 'تأكيد الحذف' : 'Confirm Delete'}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isRtl
            ? `هل أنت متأكد من حذف المستخدم "${userName}"؟`
            : `Are you sure you want to delete "${userName}"?`}
        </p>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-all duration-200 disabled:opacity-50"
          >
            {isDeleting
              ? isRtl
                ? 'جاري الحذف...'
                : 'Deleting...'
              : isRtl
              ? 'حذف'
              : 'Delete'}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  );
}