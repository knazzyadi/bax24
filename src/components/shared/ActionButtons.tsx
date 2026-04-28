//src\components\shared\ActionButtons.tsx
//أزرار (تعديل / حذف)
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  showView?: boolean;
  className?: string;
}

export function ActionButtons({ onEdit, onDelete, onView, showView = false, className }: ActionButtonsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showView && onView && (
        <button onClick={onView} className="text-green-600 hover:opacity-80" title="عرض">
          <Eye size={18} />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="text-yellow-600 hover:opacity-80" title="تعديل">
          <Pencil size={18} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="text-red-600 hover:opacity-80" title="حذف">
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}