// src/app/[locale]/(dashboard)/locations/buildings/components/DeleteBuildingDialog.tsx

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DeleteBuildingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingName: string;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  locale: string;
}

export function DeleteBuildingDialog({
  open,
  onOpenChange,
  buildingName,
  onConfirm,
  isDeleting,
  locale,
}: DeleteBuildingDialogProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRTL ? (
              <>
                هل أنت متأكد من حذف المبنى <strong className="text-rose-500">"{buildingName}"</strong>؟
                <br />
                هذا الإجراء لا يمكن التراجع عنه.
              </>
            ) : (
              <>
                Are you sure you want to delete the building <strong className="text-rose-500">"{buildingName}"</strong>?
                <br />
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRTL ? 'حذف' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}