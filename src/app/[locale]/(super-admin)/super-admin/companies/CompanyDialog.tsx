// src/app/[locale]/(super-admin)/super-admin/companies/CompanyDialog.tsx
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, useWatch, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Company, CompanyFormData } from './types';
import { companySchema, defaultCompanyValues, CompanyFormValues } from './schemas';

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCompany: Company | null;
  onSave: (data: CompanyFormData) => Promise<boolean>;
  isSaving: boolean;
}

export function CompanyDialog({
  open,
  onOpenChange,
  editingCompany,
  onSave,
  isSaving,
}: CompanyDialogProps) {
  const t = useTranslations('SuperAdmin');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: defaultCompanyValues,
  });

  const isActive = useWatch({
    control,
    name: 'isActive',
  });

  // ✅ تعبئة النموذج عند التعديل أو الإضافة
  useEffect(() => {
    if (open) {
      if (editingCompany) {
        reset({
          name: editingCompany.name,
          nameEn: editingCompany.nameEn || '',
          email: editingCompany.email || '',
          phone: editingCompany.phone || '',
          address: editingCompany.address || '',
          subscriptionEndDate: editingCompany.subscriptionEndDate || '',
          isActive: editingCompany.isActive ?? true,
        });
      } else {
        reset(defaultCompanyValues);
      }
    }
  }, [open, editingCompany, reset]);

  // ✅ استخدام SubmitHandler مع النوع المستنتج
  const onSubmit: SubmitHandler<CompanyFormValues> = async (data) => {
    // CompanyFormData يتطابق مع CompanyFormValues، لا حاجة للتحويل
    const success = await onSave(data as CompanyFormData);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {editingCompany ? t('editCompany') : t('addCompany')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('companyName')} <span className="text-rose-500">*</span>
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
              {t('companyNameEn')}
            </Label>
            <Input
              id="nameEn"
              {...register('nameEn')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('phone')}
            </Label>
            <Input
              id="phone"
              {...register('phone')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('address')}
            </Label>
            <Input
              id="address"
              {...register('address')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <Label htmlFor="subscriptionEndDate" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('subscriptionEndDate')}
            </Label>
            <Input
              id="subscriptionEndDate"
              type="date"
              {...register('subscriptionEndDate')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor="isActive" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('active')}
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-xl"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCompany ? t('update') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}