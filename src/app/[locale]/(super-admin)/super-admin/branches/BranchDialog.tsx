// src/app/[locale]/(super-admin)/super-admin/branches/BranchDialog.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Branch, Company, BranchFormData } from './types';
import { Loader2 } from 'lucide-react';

const branchSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  code: z.string().min(1, 'الكود مطلوب'),
  companyId: z.string().min(1, 'الشركة مطلوبة'),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBranch: Branch | null;
  companies: Company[];
  onSave: (data: BranchFormData) => Promise<boolean>;
  isSaving: boolean;
}

export function BranchDialog({
  open,
  onOpenChange,
  editingBranch,
  companies,
  onSave,
  isSaving,
}: BranchDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      nameEn: '',
      code: '',
      companyId: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (editingBranch) {
        reset({
          name: editingBranch.name,
          nameEn: editingBranch.nameEn || '',
          code: editingBranch.code,
          companyId: editingBranch.companyId,
        });
      } else {
        reset({
          name: '',
          nameEn: '',
          code: '',
          companyId: '',
        });
      }
    }
  }, [open, editingBranch, reset]);

  const onSubmit = async (data: BranchFormValues) => {
    // ✅ تحويل البيانات لتتناسب مع BranchFormData
    const formData: BranchFormData = {
      name: data.name,
      code: data.code,
      companyId: data.companyId,
      nameEn: data.nameEn || '', // ✅ تحويل undefined إلى string فارغ
    };
    const success = await onSave(formData);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {editingBranch ? 'تعديل فرع' : 'إضافة فرع جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              اسم الفرع (عربي) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-rose-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nameEn" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              الاسم بالإنجليزية
            </Label>
            <Input
              id="nameEn"
              {...register('nameEn')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <Label htmlFor="code" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              كود الفرع <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="code"
              {...register('code')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 font-mono"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-rose-500">{errors.code.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="companyId" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              الشركة <span className="text-rose-500">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue('companyId', value)}
              defaultValue={editingBranch?.companyId || ''}
              disabled={!!editingBranch}
            >
              <SelectTrigger className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50">
                <SelectValue placeholder="اختر شركة" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companyId && (
              <p className="mt-1 text-sm text-rose-500">{errors.companyId.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBranch ? 'تحديث' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}