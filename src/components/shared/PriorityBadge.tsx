//src\components\shared\PriorityBadge.tsx
//يعرض الأولوية
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: {
    name: string;
    label?: string;
  } | null;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (!priority) return null;
  const name = priority.name;
  const label = priority.label || name;

  let styles = '';
  if (name === 'عاجل' || name === 'URGENT') styles = 'bg-red-500/10 text-red-600 dark:text-red-400';
  else if (name === 'مرتفع' || name === 'HIGH') styles = 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
  else if (name === 'متوسط' || name === 'MEDIUM') styles = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  else if (name === 'منخفض' || name === 'LOW') styles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  else styles = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", styles, className)}>
      {label}
    </span>
  );
}