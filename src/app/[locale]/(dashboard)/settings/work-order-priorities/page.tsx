// src/app/[locale]/(dashboard)/settings/work-order-priorities/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, X, Loader2, Flag, Sparkles } from 'lucide-react';
import { AdminGuard } from '@/lib/client-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// =========================
// تنسيقات موحدة (نفس باقي صفحات النظام)
// =========================
const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300';

interface Priority {
  id: string;
  name: string;
  nameEn?: string;
  color: string;
  order: number;
  isDefault: boolean;
  companyId?: string;
}

// قائمة الألوان الجاهزة (مطابقة لصفحة الحالات)
const COLOR_OPTIONS = [
  { value: '#ef4444', nameAr: 'أحمر (عاجل)', nameEn: 'Red (Urgent)' },
  { value: '#f97316', nameAr: 'برتقالي', nameEn: 'Orange' },
  { value: '#eab308', nameAr: 'أصفر', nameEn: 'Yellow' },
  { value: '#22c55e', nameAr: 'أخضر', nameEn: 'Green' },
  { value: '#3b82f6', nameAr: 'أزرق', nameEn: 'Blue' },
  { value: '#8b5cf6', nameAr: 'بنفسجي', nameEn: 'Purple' },
  { value: '#ec489a', nameAr: 'وردي', nameEn: 'Pink' },
  { value: '#64748b', nameAr: 'رمادي (افتراضي)', nameEn: 'Gray (Default)' },
  { value: '#14b8a6', nameAr: 'فيروزي', nameEn: 'Teal' },
  { value: '#dc2626', nameAr: 'أحمر داكن', nameEn: 'Dark Red' },
];

function WorkOrderPrioritiesPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('WorkOrderPriorities');
  const isRtl = locale === 'ar';

  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    color: '#64748b',
    order: 0,
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPriorities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/work-order-priorities');
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('استجابة غير صالحة');
      }
      if (!res.ok) throw new Error(data.error || 'فشل التحميل');
      setPriorities(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') router.push(`/${locale}/login`);
    else if (sessionStatus === 'authenticated') fetchPriorities();
  }, [sessionStatus, router, locale, fetchPriorities]);

  const openCreateForm = () => {
    setEditingPriority(null);
    setForm({ name: '', nameEn: '', color: '#64748b', order: 0, isDefault: false });
    setShowForm(true);
  };

  const openEditForm = (priority: Priority) => {
    setEditingPriority(priority);
    setForm({
      name: priority.name,
      nameEn: priority.nameEn || '',
      color: priority.color || '#64748b',
      order: priority.order,
      isDefault: priority.isDefault,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('nameRequired') || 'الاسم مطلوب');
      return;
    }
    setSubmitting(true);
    try {
      const url = editingPriority
        ? `/api/work-order-priorities/${editingPriority.id}`
        : '/api/work-order-priorities';
      const method = editingPriority ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('استجابة غير صالحة');
      }
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      toast.success(editingPriority ? t('updateSuccess') : t('createSuccess'));
      setShowForm(false);
      setEditingPriority(null);
      await fetchPriorities();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || (editingPriority ? t('updateError') : t('createError')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm') || 'هل أنت متأكد؟')) return;
    try {
      const res = await fetch(`/api/work-order-priorities/${id}`, { method: 'DELETE' });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('استجابة غير صالحة');
      }
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success(t('deleteSuccess'));
      await fetchPriorities();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || t('deleteError'));
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingPriority(null);
    setForm({ name: '', nameEn: '', color: '#64748b', order: 0, isDefault: false });
  };

  const getColorLabel = (colorValue: string) => {
    const color = COLOR_OPTIONS.find(c => c.value === colorValue);
    if (!color) return colorValue;
    return isRtl ? color.nameAr : color.nameEn;
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة (نفس باقي الصفحات) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة المخصص (مطابق لباقي الصفحات) */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Flag className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('title')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('subtitle')}
            </p>
          </div>
        </div>
        {!showForm && (
          <Button
            onClick={openCreateForm}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            {t('addStatus')}
          </Button>
        )}
      </div>

      {/* رسائل النجاح / الخطأ */}
      {message && (
        <div
          className={cn(
            'p-4 rounded-xl border text-sm font-medium',
            message.type === 'success'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30 text-rose-700 dark:text-rose-300'
          )}
        >
          {message.text}
        </div>
      )}

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <div className={glassCard}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {editingPriority ? t('editStatus') : t('addStatus')}
            </h2>
            <button
              onClick={cancelForm}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('name')} <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={isRtl ? 'مثال: عاجل' : 'Example: Urgent'}
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('nameEn')}
              </Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="Example: Urgent"
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('order')}
              </Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                placeholder="0"
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
              />
            </div>

            {/* اختيار اللون */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('color')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setForm({ ...form, color: color.value })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50",
                      form.color === color.value
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={isRtl ? color.nameAr : color.nameEn}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {isRtl ? 'اللون المحدد:' : 'Selected:'} {getColorLabel(form.color)}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefault"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-indigo-600"
              />
              <Label htmlFor="isDefault" className="text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                {t('isDefault')}
              </Label>
            </div>

            <div className="md:col-span-3 flex gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={cancelForm}
                className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* جدول الأولويات */}
      <div className={glassCard}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isRtl ? 'قائمة الأولويات' : 'Priorities List'}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
          </div>
        ) : priorities.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            {t('noStatuses') || 'لا توجد أولويات مسجلة'}
          </div>
        ) : (
          <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {t('name')}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {t('nameEn')}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center">
                    {t('order')}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center">
                    {t('isDefault')}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {t('color')}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center">
                    {t('actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {priorities.map((priority) => (
                  <TableRow key={priority.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                      {priority.name}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {priority.nameEn || '—'}
                    </TableCell>
                    <TableCell className="text-center text-slate-600 dark:text-slate-300">
                      {priority.order}
                    </TableCell>
                    <TableCell className="text-center">
                      {priority.isDefault ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                          style={{ backgroundColor: priority.color || '#64748b' }}
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {getColorLabel(priority.color || '#64748b')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditForm(priority)}
                          className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                          title={t('edit')}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(priority.id)}
                          className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110"
                          title={t('delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkOrderPrioritiesPage() {
  return (
    <AdminGuard>
      <WorkOrderPrioritiesPageContent />
    </AdminGuard>
  );
}