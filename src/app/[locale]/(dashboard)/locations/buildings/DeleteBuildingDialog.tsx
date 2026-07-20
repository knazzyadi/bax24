// src/app/[locale]/(dashboard)/locations/buildings/BuildingDialog.tsx
'use client';

import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { Building, Branch, BuildingFormData } from './types';
import { buildingSchema, type BuildingFormValues } from './building.schema';

interface BuildingDialogProps {
  open: boolean;
  onOpenChange: (refetchData?: boolean) => void;
  editingBuilding: Building | null;
  branches: Branch[];
  onSave: (data: BuildingFormData) => Promise<boolean>;
  isSaving: boolean;
  locale: string;
}

export function BuildingDialog({
  open,
  onOpenChange,
  editingBuilding,
  branches,
  onSave,
  isSaving,
  locale,
}: BuildingDialogProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: '',
      nameEn: '',
      code: '',
      order: 0, // ✅ قيمة افتراضية مطابقة للنوع
      branchId: '',
    },
  });

  useEffect(() => {
    if (editingBuilding) {
      reset({
        name: editingBuilding.name,
        nameEn: editingBuilding.nameEn || '',
        code: editingBuilding.code,
        order: editingBuilding.order,
        branchId: editingBuilding.branchId || '',
      });
    } else {
      reset({
        name: '',
        nameEn: '',
        code: '',
        order: 0,
        branchId: '',
      });
    }
  }, [editingBuilding, reset]);

  const onSubmit: SubmitHandler<BuildingFormValues> = async (data) => {
    // ✅ استخدام ?? 0 لأن order اختياري في الـ schema
    const formData: BuildingFormData = {
      name: data.name,
      code: data.code,
      order: data.order ?? 0,
      branchId: data.branchId || '',
      nameEn: data.nameEn || '',
    };
    const success = await onSave(formData);
    if (success) {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onOpenChange()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {editingBuilding
              ? isRTL ? 'تعديل مبنى' : 'Edit Building'
              : isRTL ? 'إضافة مبنى' : 'Add Building'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="branchId">{isRTL ? 'الفرع (اختياري)' : 'Branch (optional)'}</Label>
            <Select
              value={watch('branchId') || ''}
              onValueChange={(value) => setValue('branchId', value)}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800">
                <SelectValue placeholder={isRTL ? 'اختر الفرع' : 'Select branch'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{isRTL ? 'بدون فرع' : 'No branch'}</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{isRTL ? 'الاسم بالعربية *' : 'Arabic Name *'}</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={isRTL ? 'أدخل الاسم بالعربية' : 'Enter Arabic name'}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800"
            />
            {errors.name && (
              <p className="text-sm text-rose-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn">{isRTL ? 'الاسم بالإنجليزية' : 'English Name'}</Label>
            <Input
              id="nameEn"
              {...register('nameEn')}
              placeholder={isRTL ? 'أدخل الاسم بالإنجليزية' : 'Enter English name'}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">{isRTL ? 'الكود *' : 'Code *'}</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder={isRTL ? 'أدخل الكود' : 'Enter code'}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 font-mono uppercase tracking-wider"
            />
            {errors.code && (
              <p className="text-sm text-rose-500">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">{isRTL ? 'الترتيب' : 'Order'}</Label>
            <Input
              id="order"
              type="number"
              {...register('order', { valueAsNumber: true })}
              placeholder="0"
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800"
            />
            {errors.order && (
              <p className="text-sm text-rose-500">{errors.order.message}</p>
            )}
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange()}
              className="h-12 rounded-xl"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving
                ? isRTL ? 'جاري الحفظ...' : 'Saving...'
                : isRTL ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}