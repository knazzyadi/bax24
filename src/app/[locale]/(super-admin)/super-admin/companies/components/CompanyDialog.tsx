// src/app/[locale]/(super-admin)/super-admin/companies/components/CompanyDialog.tsx
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
import { Switch } from '@/components/ui/switch';
import { Company, CompanyFormData } from '../types';
import { Loader2 } from 'lucide-react';

const companySchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  subscriptionEndDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CompanyFormValues = z.infer<typeof companySchema>;

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
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      nameEn: '',
      email: '',
      phone: '',
      address: '',
      subscriptionEndDate: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (open) {
      if (editingCompany) {
        reset({
          name: editingCompany.name,
          nameEn: editingCompany.nameEn || '',
          email: editingCompany.email || '',
          phone: editingCompany.phone || '',
          address: editingCompany.address || '',
          subscriptionEndDate: editingCompany.subscriptionEndDate ? new Date(editingCompany.subscriptionEndDate).toISOString().split('T')[0] : '',
          isActive: editingCompany.isActive,
        });
      } else {
        reset({
          name: '',
          nameEn: '',
          email: '',
          phone: '',
          address: '',
          subscriptionEndDate: '',
          isActive: true,
        });
      }
    }
  }, [open, editingCompany, reset]);

  const onSubmit = async (data: CompanyFormValues) => {
    const success = await onSave(data);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {editingCompany ? 'تعديل شركة' : 'إضافة شركة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              اسم الشركة <span className="text-rose-500">*</span>
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
              اسم الشركة (إنجليزي)
            </Label>
            <Input
              id="nameEn"
              {...register('nameEn')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              البريد الإلكتروني
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
              رقم الهاتف
            </Label>
            <Input
              id="phone"
              {...register('phone')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              العنوان
            </Label>
            <Input
              id="address"
              {...register('address')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <Label htmlFor="subscriptionEndDate" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              تاريخ انتهاء الاشتراك
            </Label>
            <Input
              id="subscriptionEndDate"
              type="date"
              {...register('subscriptionEndDate')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">نشطة</Label>
              <p className="text-sm text-muted-foreground">تفعيل أو تعطيل هذه الشركة</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
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
              {editingCompany ? 'تحديث' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}