//src\components\shared\PageHeader.tsx
//عنوان الصفحة + زر إضافة
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-1 font-medium">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}