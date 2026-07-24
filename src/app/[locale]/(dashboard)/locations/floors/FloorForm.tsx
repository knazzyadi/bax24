// src/app/[locale]/(dashboard)/locations/floors/FloorForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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
import { Loader2 } from 'lucide-react';
import type { Floor, Building } from './types';

interface FloorFormProps {
  editingFloor: Floor | null;
  buildings: Building[];
  onSuccess: () => void;
  isRtl: boolean;
}

export function FloorForm({
  editingFloor,
  buildings,
  onSuccess,
  isRtl,
}: FloorFormProps) {
  const t = useTranslations('Locations');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    code: '',
    order: 0,
    buildingId: '',
  });

  useEffect(() => {
    if (editingFloor) {
      setFormData({
        name: editingFloor.name || '',
        nameEn: editingFloor.nameEn || '',
        code: editingFloor.code || '',
        order: editingFloor.order ?? 0,
        buildingId: editingFloor.buildingId || '',
      });
    } else {
      setFormData({
        name: '',
        nameEn: '',
        code: '',
        order: 0,
        buildingId: '',
      });
    }
  }, [editingFloor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(isRtl ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    if (!formData.buildingId) {
      toast.error(isRtl ? 'المبنى مطلوب' : 'Building is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        code: formData.code.trim() || null,
        order: Number(formData.order),
        buildingId: formData.buildingId,
      };

      const url = editingFloor
        ? `/api/locations/floors/${editingFloor.id}`
        : '/api/locations/floors';
      const method = editingFloor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success(
        editingFloor
          ? isRtl
            ? 'تم تحديث الدور بنجاح'
            : 'Floor updated successfully'
          : isRtl
          ? 'تم إنشاء الدور بنجاح'
          : 'Floor created successfully'
      );
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Save error'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-4">
      {/* المبنى - قائمة منسدلة مع كود المبنى */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {isRtl ? 'المبنى' : 'Building'} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.buildingId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, buildingId: value }))
          }
        >
          <SelectTrigger className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all">
            <SelectValue placeholder={isRtl ? 'اختر المبنى' : 'Select building'} />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name} {building.code ? `(${building.code})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* الاسم بالعربية */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {isRtl ? 'الاسم بالعربية' : 'Arabic Name'} <span className="text-destructive">*</span>
        </Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={isRtl ? 'أدخل اسم الدور' : 'Enter floor name'}
          required
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      {/* الاسم بالإنجليزية */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {isRtl ? 'الاسم بالإنجليزية' : 'English Name'}
        </Label>
        <Input
          name="nameEn"
          value={formData.nameEn}
          onChange={handleChange}
          placeholder={isRtl ? 'الاسم بالإنجليزية' : 'Name in English'}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      {/* الكود */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {isRtl ? 'الكود' : 'Code'} <span className="text-destructive">*</span>
        </Label>
        <Input
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder={isRtl ? 'أدخل الكود' : 'Enter code'}
          required
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all font-mono uppercase tracking-wider"
        />
      </div>

      {/* الترتيب */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {isRtl ? 'الترتيب' : 'Order'}
        </Label>
        <Input
          name="order"
          type="number"
          value={formData.order}
          onChange={handleChange}
          className="h-11 rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      {/* الأزرار */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          className="flex-1 rounded-xl border-border h-11"
        >
          {isRtl ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {editingFloor
            ? isRtl
              ? 'تحديث'
              : 'Update'
            : isRtl
            ? 'حفظ'
            : 'Save'}
        </Button>
      </div>
    </form>
  );
}