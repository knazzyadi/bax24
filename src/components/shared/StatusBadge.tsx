//src/components/shared/StatusBadge.tsx
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, Wrench, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 
    | string  // للنظام الجديد (PENDING, APPROVED, REJECTED)
    | { name: string; label?: string; color?: string } 
    | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;

  // إذا كان status نصاً (حالة التذاكر الجديدة)
  if (typeof status === 'string') {
    let label = '';
    let styles = '';
    let icon = null;
    switch (status) {
      case 'PENDING':
        label = 'معلق';
        styles = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
        icon = <Clock size={14} className="ml-1 inline" />;
        break;
      case 'APPROVED':
        label = 'مقبول';
        styles = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
        icon = <CheckCircle2 size={14} className="ml-1 inline" />;
        break;
      case 'REJECTED':
        label = 'مرفوض';
        styles = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        icon = <XCircle size={14} className="ml-1 inline" />;
        break;
      default:
        label = status;
        styles = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        icon = <AlertCircle size={14} className="ml-1 inline" />;
    }
    return (
      <span className={cn("px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1", styles, className)}>
        {icon} {label}
      </span>
    );
  }

  // إذا كان status كائن (النمط القديم لأوامر العمل والأصول)
  const name = status.name;
  const label = status.label || name;

  let styles = '';
  let icon = null;

  if (['COMPLETED', 'مكتمل', 'تم الاعتماد', 'مقبول', 'APPROVED'].includes(name)) {
    styles = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    icon = <CheckCircle2 size={14} className="ml-1 inline" />;
  } else if (['CANCELLED', 'ملغى', 'REJECTED'].includes(name)) {
    styles = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    icon = <XCircle size={14} className="ml-1 inline" />;
  } else if (['IN_PROGRESS', 'قيد التنفيذ'].includes(name)) {
    styles = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    icon = <Wrench size={14} className="ml-1 inline" />;
  } else {
    styles = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    icon = <Clock size={14} className="ml-1 inline" />;
  }

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1", styles, className)}>
      {icon} {label}
    </span>
  );
}