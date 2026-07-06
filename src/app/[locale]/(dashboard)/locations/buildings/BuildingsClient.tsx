// src/app/[locale]/(dashboard)/locations/buildings/BuildingsClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building, Pencil, Trash2, Plus, X, Sparkles, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// =========================
// تنسيقات موحدة (نفس باقي صفحات النظام)
// =========================
const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300';

interface Building {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  branchId: string | null;
  branchName: string | null;
}

interface Branch {
  id: string;
  name: string;
}

interface BuildingsClientProps {
  initialBuildings: Building[];
  initialBranches: Branch[];
  locale: string;
}

export default function BuildingsClient({
  initialBuildings,
  initialBranches,
  locale,
}: BuildingsClientProps) {
  const router = useRouter();
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [branches] = useState<Branch[]>(initialBranches);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    code: '',
    order: 0,
    branchId: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editing
        ? `/api/locations/buildings/${editing.id}`
        : '/api/locations/buildings';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: t('saveSuccess') || 'تم الحفظ بنجاح' });
      setEditing(null);
      setForm({ name: '', nameEn: '', code: '', order: 0, branchId: '' });
      setShowForm(false);
      router.replace(`/${locale}/locations/buildings`);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm') || 'هل أنت متأكد من الحذف؟')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/locations/buildings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || t('deleteError') });
        return;
      }
      setMessage({ type: 'success', text: t('deleteSuccess') || 'تم الحذف بنجاح' });
      router.replace(`/${locale}/locations/buildings`);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const editBuilding = (b: Building) => {
    setEditing(b);
    setForm({
      name: b.name,
      nameEn: b.nameEn || '',
      code: b.code,
      order: b.order,
      branchId: b.branchId || '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', nameEn: '', code: '', order: 0, branchId: '' });
    setShowForm(false);
  };

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة (نفس باقي الصفحات) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة المخصص (مطابق لباقي الصفحات) */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Building className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('buildings') || 'المباني'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? 'إدارة المباني والفروع وتنظيم المواقع'
                : 'Manage buildings, branches and organize locations'}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addBuilding') || 'إضافة مبنى'}
          </button>
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

      {/* نموذج الإضافة / التعديل */}
      {showForm && (
        <div className={glassCard}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {editing ? t('editBuilding') || 'تعديل مبنى' : t('addBuilding') || 'إضافة مبنى'}
            </h2>
            <button
              onClick={cancelEdit}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t('nameAr') || 'الاسم بالعربية'}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
              required
            />
            <input
              type="text"
              placeholder={t('nameEn') || 'الاسم بالإنجليزية'}
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
            />
            <input
              type="text"
              placeholder={t('code') || 'الكود'}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 font-mono uppercase tracking-wider"
              required
            />
            <input
              type="number"
              placeholder={t('order') || 'الترتيب'}
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
            />
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 appearance-none"
            >
              <option value="">{isRTL ? 'اختر الفرع (اختياري)' : 'Select branch (optional)'}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    {isRTL ? 'جاري الحفظ...' : 'Saving...'}
                  </span>
                ) : (
                  t('save') || 'حفظ'
                )}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200"
              >
                {t('cancel') || 'إلغاء'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* جدول المباني */}
      <div className={glassCard}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
            <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isRTL ? 'قائمة المباني' : 'Buildings List'}
          </h2>
        </div>

        <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
              <tr>
                <th className={cn('p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider', isRTL ? 'text-right' : 'text-left')}>
                  #
                </th>
                <th className={cn('p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider', isRTL ? 'text-right' : 'text-left')}>
                  {t('nameAr') || 'الاسم بالعربية'}
                </th>
                <th className={cn('p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider', isRTL ? 'text-right' : 'text-left')}>
                  {t('nameEn') || 'الاسم بالإنجليزية'}
                </th>
                <th className={cn('p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider', isRTL ? 'text-right' : 'text-left')}>
                  {t('code') || 'الكود'}
                </th>
                <th className={cn('p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider', isRTL ? 'text-right' : 'text-left')}>
                  {t('order') || 'الترتيب'}
                </th>
                <th className={cn('p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider', isRTL ? 'text-right' : 'text-left')}>
                  {t('branch') || 'الفرع'}
                </th>
                <th className={cn('p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider', isRTL ? 'text-right' : 'text-left')}>
                  {t('actions') || 'الإجراءات'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {buildings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    {isRTL ? 'لا توجد مباني لعرضها' : 'No buildings to display'}
                  </td>
                </tr>
              ) : (
                buildings.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                    <td className="p-3 text-slate-600 dark:text-slate-300">{idx + 1}</td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{b.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{b.nameEn || '—'}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{b.code}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{b.order}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{b.branchName || '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => editBuilding(b)}
                          className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                          title={isRTL ? 'تعديل' : 'Edit'}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110"
                          title={isRTL ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}