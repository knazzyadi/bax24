// src/app/[locale]/(dashboard)/locations/buildings/BuildingForm.tsx
'use client';

import { useState } from 'react'; // ✅ حذف useEffect من الاستيراد
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
import type { Building, Branch } from './types';

interface BuildingFormProps {
  editingBuilding: Building | null;
  branches: Branch[];
  onSuccess: () => void;
  isRtl: boolean;
}

export function BuildingForm({
  editingBuilding,
  branches,
  onSuccess,
  isRtl,
}: BuildingFormProps) {
  const [loading, setLoading] = useState(false);
  
  // ✅ تهيئة الحالة مباشرة بدون useEffect
  const [formData, setFormData] = useState(() => ({
    name: editingBuilding?.name ?? '',
    nameEn: editingBuilding?.nameEn ?? '',
    code: editingBuilding?.code ?? '',
    order: editingBuilding?.order ?? 0,
    branchId: editingBuilding?.branchId ?? '',
  }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

    setLoading(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        code: formData.code.trim() || null,
        order: Number(formData.order),
        branchId: formData.branchId || null,
      };

      const url = editingBuilding
        ? `/api/locations/buildings/${editingBuilding.id}`
        : '/api/locations/buildings';
      const method = editingBuilding ? 'PUT' : 'POST';

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
        editingBuilding
          ? isRtl
            ? 'تم تحديث المبنى بنجاح'
            : 'Building updated successfully'
          : isRtl
          ? 'تم إنشاء المبنى بنجاح'
          : 'Building created successfully'
      );
      onSuccess();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Save error';

      toast.error(
        message || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Save error')
      );

      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-4">
      {/* الاسم بالعربية */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {isRtl ? 'الاسم بالعربية' : 'Arabic Name'} <span className="text-destructive">*</span>
        </Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={isRtl ? 'أدخل اسم المبنى' : 'Enter building name'}
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

      {/* الفرع */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {isRtl ? 'الفرع' : 'Branch'}
        </Label>
        <Select
          value={formData.branchId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, branchId: value }))
          }
        >
          <SelectTrigger className="h-11 rounded-xl border-border bg-background/50">
            <SelectValue
              placeholder={isRtl ? 'اختر الفرع (اختياري)' : 'Select branch (optional)'}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{isRtl ? 'بدون فرع' : 'No branch'}</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {editingBuilding
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