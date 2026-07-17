// src/app/[locale]/(dashboard)/locations/floors/components/FloorForm.tsx

'use client';

import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Floor, Building, FloorFormData } from '../types';
import { floorSchema, type FloorFormValues } from '../schemas/floor.schema';
import { cn } from '@/lib/utils';

const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm';

interface FloorFormProps {
  editingFloor: Floor | null;
  buildings: Building[];
  onSave: (data: FloorFormData) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
  locale: string;
}

export function FloorForm({
  editingFloor,
  buildings,
  onSave,
  onCancel,
  isSaving,
  locale,
}: FloorFormProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FloorFormValues>({
    resolver: zodResolver(floorSchema),
    defaultValues: {
      name: '',
      nameEn: '',
      code: '',
      order: 0,
      buildingId: '',
    },
  });

  useEffect(() => {
    if (editingFloor) {
      reset({
        name: editingFloor.name,
        nameEn: editingFloor.nameEn || '',
        code: editingFloor.code,
        order: editingFloor.order,
        buildingId: editingFloor.buildingId,
      });
    } else {
      reset({
        name: '',
        nameEn: '',
        code: '',
        order: 0,
        buildingId: '',
      });
    }
  }, [editingFloor, reset]);

  const onSubmit: SubmitHandler<FloorFormValues> = async (data) => {
    const formData: FloorFormData = {
      name: data.name,
      code: data.code,
      order: data.order,
      buildingId: data.buildingId,
      nameEn: data.nameEn || '',
    };
    const success = await onSave(formData);
    if (success) onCancel();
  };

  return (
    <div className={glassCard}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {editingFloor
            ? isRTL ? 'تعديل دور' : 'Edit Floor'
            : isRTL ? 'إضافة دور' : 'Add Floor'}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <select
            {...register('buildingId')}
            className={cn(
              'h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 appearance-none',
              errors.buildingId && 'border-rose-500 focus:ring-rose-500'
            )}
          >
            <option value="">{isRTL ? 'المبنى *' : 'Building *'}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.buildingId && (
            <p className="text-sm text-rose-500">{errors.buildingId.message}</p>
          )}
        </div>

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
            <p className="text-sm text-rose-500">{errors.name.message}</p>
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
            <p className="text-sm text-rose-500">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <input
            type="number"
            placeholder={isRTL ? 'الترتيب' : 'Order'}
            {...register('order', { valueAsNumber: true })}
            className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
          />
          {errors.order && (
            <p className="text-sm text-rose-500">{errors.order.message}</p>
          )}
        </div>

        <div className="md:col-span-2 flex gap-3">
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
            className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}