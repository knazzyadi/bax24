// src/app/[locale]/(super-admin)/super-admin/users/components/UserDialog.tsx

'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { User, Company, Role, UserFormData } from '../types';
import { Loader2 } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  roleId: z.string().min(1, 'الدور مطلوب'),
  companyId: z.string().min(1, 'الشركة مطلوبة'),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  roles: Role[];
  companies: Company[];
  onSave: (data: UserFormData) => Promise<boolean>;
  isSaving: boolean;
}

export function UserDialog({
  open,
  onOpenChange,
  editingUser,
  roles,
  companies,
  onSave,
  isSaving,
}: UserDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
      companyId: '',
    },
  });

  // ✅ استخدام useWatch بدلاً من watch
  const selectedRole = useWatch({
    control,
    name: 'roleId',
  });

  useEffect(() => {
    if (open) {
      if (editingUser) {
        reset({
          name: editingUser.name || '',
          email: editingUser.email,
          roleId: editingUser.role?.id || '',
          companyId: editingUser.company?.id || '',
        });
      } else {
        reset({
          name: '',
          email: '',
          roleId: '',
          companyId: '',
        });
      }
    }
  }, [open, editingUser, reset]);

  const onSubmit = async (data: UserFormValues) => {
    const success = await onSave(data);
    if (success) {
      onOpenChange(false);
    }
  };

  const isEditing = !!editingUser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {isEditing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              الاسم الكامل <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
              placeholder="أدخل الاسم الكامل"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-rose-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              البريد الإلكتروني <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
              placeholder="example@domain.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="roleId" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              الدور <span className="text-rose-500">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue('roleId', value)}
              value={selectedRole}
            >
              <SelectTrigger className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50">
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.label || role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="mt-1 text-sm text-rose-500">{errors.roleId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="companyId" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              الشركة <span className="text-rose-500">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue('companyId', value)}
              defaultValue={editingUser?.company?.id || ''}
            >
              <SelectTrigger className="mt-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50">
                <SelectValue placeholder="اختر الشركة" />
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
              {isEditing ? 'تحديث' : 'إرسال الدعوة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}