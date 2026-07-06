// src/app/[locale]/(dashboard)/settings/asset-types/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, X, Loader2, Tag, Sparkles } from 'lucide-react';
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

interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  description?: string;
  order: number;
  isDefault: boolean;
}

function AssetTypesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('AssetTypes');
  const isRtl = locale === 'ar';

  const [types, setTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    code: '',
    description: '',
    order: 0,
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/asset-types');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(t('fetchError') || 'حدث خطأ في جلب البيانات');
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else if (status === 'authenticated') {
      fetchTypes();
    }
  }, [status, router, locale, fetchTypes]);

  const openCreateModal = () => {
    setEditingType(null);
    setForm({ name: '', nameEn: '', code: '', description: '', order: 0, isDefault: false });
    setShowForm(true);
  };

  const openEditModal = (type: AssetType) => {
    setEditingType(type);
    setForm({
      name: type.name,
      nameEn: type.nameEn || '',
      code: type.code || '',
      description: type.description || '',
      order: type.order,
      isDefault: type.isDefault,
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
      const url = editingType ? `/api/asset-types/${editingType.id}` : '/api/asset-types';
      const method = editingType ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'حدث خطأ');
      }
      toast.success(editingType ? t('updateSuccess') : t('createSuccess'));
      setShowForm(false);
      setEditingType(null);
      await fetchTypes();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || (editingType ? t('updateError') : t('createError')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm') || 'هل أنت متأكد؟')) return;
    try {
      const res = await fetch(`/api/asset-types/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل الحذف');
      }
      toast.success(t('deleteSuccess'));
      await fetchTypes();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || t('deleteError'));
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingType(null);
    setForm({ name: '', nameEn: '', code: '', description: '', order: 0, isDefault: false });
  };

  if (status === 'loading') {
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
            <Tag className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
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
            onClick={openCreateModal}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            {t('addType')}
          </Button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <div className={glassCard}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {editingType ? t('editType') : t('addType')}
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
                placeholder={isRtl ? 'مثال: طبي' : 'Example: Medical'}
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
                placeholder="Example: Medical"
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('code') || 'الكود'}
              </Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder={isRtl ? 'مثال: MED' : 'Example: MED'}
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 font-mono uppercase tracking-wider"
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

      {/* جدول الأنواع */}
      <div className={glassCard}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isRtl ? 'قائمة الأنواع' : 'Types List'}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
          </div>
        ) : types.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            {t('noTypes') || 'لا توجد أنواع أصول مسجلة'}
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
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {t('code') || 'الكود'}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center">
                    {t('order')}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center">
                    {t('isDefault')}
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center">
                    {t('actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {types.map((type) => (
                  <TableRow key={type.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                      {type.name}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {type.nameEn || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 dark:text-slate-300">
                      {type.code || '—'}
                    </TableCell>
                    <TableCell className="text-center text-slate-600 dark:text-slate-300">
                      {type.order}
                    </TableCell>
                    <TableCell className="text-center">
                      {type.isDefault ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(type)}
                          className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                          title={t('edit')}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
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

export default function AssetTypesPage() {
  return (
    <AdminGuard>
      <AssetTypesPageContent />
    </AdminGuard>
  );
}