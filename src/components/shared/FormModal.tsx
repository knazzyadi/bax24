import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function FormModal({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'حفظ',
  isSubmitting = false,
  maxWidth = 'md',
}: FormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={cn("bg-card rounded-2xl w-full p-6 shadow-xl", maxWidthClasses[maxWidth])}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          {children}
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              {isSubmitting ? 'جاري الحفظ...' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}