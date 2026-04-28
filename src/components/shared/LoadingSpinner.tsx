//src\components\shared\LoadingSpinner.tsx
//مؤشر تحميل
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-12", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}