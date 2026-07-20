// src/app/[locale]/(dashboard)/locations/buildings/BuildingForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import type { Building, Branch } from './types';
import { buildingSchema } from './building.schema';

type BuildingFormInput = z.input<typeof buildingSchema>;
type BuildingFormOutput = z.output<typeof buildingSchema>;

const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm p-6'; // ✅ إضافة padding p-6

interface BuildingFormProps {
  editingBuilding: Building | null;
  branches: Branch[];
  onSave: (data: BuildingFormOutput) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
  locale: string;
}

export function BuildingForm({
  editingBuilding,
  branches,
  onSave,
  onCancel,
  isSaving,
  locale,
}: BuildingFormProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuildingFormInput>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: '',
      nameEn: '',
      code: '',
      order: 0,
      branchId: '',
    },
  });

  useEffect(() => {
    if (editingBuilding) {
      reset({
        name: editingBuilding.name,
        nameEn: editingBuilding.nameEn || '',
        code: editingBuilding.code,
        order: editingBuilding.order ?? 0,
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

  const onSubmit = async (data: BuildingFormInput) => {
    const validatedData: BuildingFormOutput = buildingSchema.parse(data);
    const success = await onSave(validatedData);
    if (success) {
      onCancel();
    }
  };

  return (
    <div className={glassCard}>
      {/* رأس النموذج */}
      <div className="flex justify-between items-center mb-6"> {/* ✅ زيادة المسافة السفلية */}
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {editingBuilding
            ? isRTL ? 'تعديل مبنى' : 'Edit Building'
            : isRTL ? 'إضافة مبنى' : 'Add Building'}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* النموذج مع تباعد داخلي أكبر */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <input
            type="text"
            placeholder={isRTL ? 'الاسم بالعربية *' : 'Arabic Name *'}
            {...register('name')}
            className={cn(
              'h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4',
              errors.name && 'border-rose-500 focus:ring-rose-500'
            )}
          />
          {errors.name && (
            <p className="text-sm text-rose-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <input
            type="text"
            placeholder={isRTL ? 'الاسم بالإنجليزية' : 'English Name'}
            {...register('nameEn')}
            className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
        </div>

        <div className="space-y-1">
          <input
            type="text"
            placeholder={isRTL ? 'الكود *' : 'Code *'}
            {...register('code')}
            className={cn(
              'h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 font-mono uppercase tracking-wider',
              errors.code && 'border-rose-500 focus:ring-rose-500'
            )}
          />
          {errors.code && (
            <p className="text-sm text-rose-500 mt-1">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <input
            type="number"
            placeholder={isRTL ? 'الترتيب' : 'Order'}
            {...register('order', { valueAsNumber: true })}
            className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <select
            {...register('branchId')}
            className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 appearance-none"
          >
            <option value="">{isRTL ? 'اختر الفرع (اختياري)' : 'Select branch (optional)'}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex gap-3 mt-2"> {/* ✅ إضافة هامش علوي */}
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving
              ? isRTL ? 'جاري الحفظ...' : 'Saving...'
              : isRTL ? 'حفظ' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}