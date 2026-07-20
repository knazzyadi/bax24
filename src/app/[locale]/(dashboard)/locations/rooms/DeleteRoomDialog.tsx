// src/app/[locale]/(dashboard)/locations/rooms/RoomDialog.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { Room, Floor, RoomFormData } from './types';

// ✅ تعريف الـ Schema
const roomSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  code: z.string().min(1, 'الكود مطلوب'),
  order: z.number().min(0).default(0),
  floorId: z.string().min(1, 'الدور مطلوب'),
});

// ✅ استخدام z.input للحصول على نوع الإدخال (حيث يكون order اختيارياً في defaultValues)
type RoomFormValues = z.input<typeof roomSchema>;

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (refetchData?: boolean) => void;
  editingRoom: Room | null;
  floors: Floor[];
  onSave: (data: RoomFormData) => Promise<boolean>;
  isSaving: boolean;
  locale: string;
}

export function RoomDialog({
  open,
  onOpenChange,
  editingRoom,
  floors,
  onSave,
  isSaving,
  locale,
}: RoomDialogProps) {
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
    },
  });

  const selectedFloorId = watch('floorId');

  const selectedFloor = useMemo(() => {
    return floors.find((f) => f.id === selectedFloorId);
  }, [floors, selectedFloorId]);

  useEffect(() => {
    if (editingRoom) {
      reset({
        name: editingRoom.name,
        nameEn: editingRoom.nameEn || '',
        code: editingRoom.code,
        order: editingRoom.order,
        floorId: editingRoom.floorId,
      });
    } else {
      reset({
        name: '',
        nameEn: '',
        code: '',
        order: 0,
        floorId: '',
      });
    }
  }, [editingRoom, reset]);

  const onSubmit: SubmitHandler<RoomFormValues> = async (data) => {
    // استخراج buildingId من الدور المختار
    const floor = floors.find((f) => f.id === data.floorId);
    if (!floor) {
      // يجب أن يكون هناك دور، لأن الـ schema يتطلب floorId
      return;
    }
    const formData: RoomFormData = {
      name: data.name,
      code: data.code,
      order: data.order ?? 0, // تأكد من وجود قيمة
      floorId: data.floorId,
      buildingId: floor.buildingId,
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
            {editingRoom
              ? isRTL ? 'تعديل غرفة' : 'Edit Room'
              : isRTL ? 'إضافة غرفة' : 'Add Room'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="floorId">{isRTL ? 'الدور *' : 'Floor *'}</Label>
            <Select
              value={watch('floorId') || ''}
              onValueChange={(value) => setValue('floorId', value)}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800">
                <SelectValue placeholder={isRTL ? 'اختر الدور' : 'Select floor'} />
              </SelectTrigger>
              <SelectContent>
                {floors.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.building?.name ? `${f.building.name} - ` : ''}{f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.floorId && (
              <p className="text-sm text-rose-500">{errors.floorId.message}</p>
            )}
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