// src/app/[locale]/(dashboard)/locations/rooms/components/RoomForm.tsx

'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Room, Floor, RoomFormData } from '../types';
import { roomSchema, RoomFormValues } from '../schemas/room.schema';
import { cn } from '@/lib/utils';

const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm';

interface RoomFormProps {
  editingRoom: Room | null;
  floors: Floor[];
  onSave: (data: RoomFormData) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
  locale: string;
}

export function RoomForm({
  editingRoom,
  floors,
  onSave,
  onCancel,
  isSaving,
  locale,
}: RoomFormProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      nameEn: '',
      code: '',
      order: 0,
      floorId: '',
      buildingId: '',
    },
  });

  const selectedFloorId = watch('floorId');

  // تحديد المبنى تلقائياً عند اختيار الدور
  const selectedFloor = useMemo(() => {
    return floors.find((f) => f.id === selectedFloorId);
  }, [floors, selectedFloorId]);

  useEffect(() => {
    if (selectedFloor) {
      setValue('buildingId', selectedFloor.buildingId);
    }
  }, [selectedFloor, setValue]);

  useEffect(() => {
    if (editingRoom) {
      reset({
        name: editingRoom.name,
        nameEn: editingRoom.nameEn || '',
        code: editingRoom.code,
        order: editingRoom.order,
        floorId: editingRoom.floorId,
        buildingId: editingRoom.floor.building.id,
      });
    } else {
      reset({
        name: '',
        nameEn: '',
        code: '',
        order: 0,
        floorId: '',
        buildingId: '',
      });
    }
  }, [editingRoom, reset]);

  const onSubmit = async (data: RoomFormValues) => {
    const success = await onSave(data);
    if (success) {
      onCancel();
    }
  };

  return (
    <div className={glassCard}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {editingRoom
            ? isRTL ? 'تعديل غرفة' : 'Edit Room'
            : isRTL ? 'إضافة غرفة' : 'Add Room'}
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
            {...register('floorId')}
            className={cn(
              'h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 appearance-none',
              errors.floorId && 'border-rose-500 focus:ring-rose-500'
            )}
          >
            <option value="">{isRTL ? 'الدور *' : 'Floor *'}</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.building?.name ? `${f.building.name} - ` : ''}{f.name}
              </option>
            ))}
          </select>
          {errors.floorId && (
            <p className="text-sm text-rose-500">{errors.floorId.message}</p>
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

        <input type="hidden" {...register('buildingId')} />

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