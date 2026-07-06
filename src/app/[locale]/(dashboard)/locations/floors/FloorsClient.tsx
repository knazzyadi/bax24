// src/app/[locale]/(dashboard)/locations/floors/FloorsClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Layers, Pencil, Trash2, Plus, X, MapPin, Building, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// =========================
// تنسيقات موحدة (نفس باقي صفحات النظام)
// =========================
const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300';

interface Building {
  id: string;
  name: string;
}

interface Floor {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  buildingId: string;
  building: {
    id: string;
    name: string;
  };
}

interface FloorsClientProps {
  initialFloors: Floor[];
  initialBuildings: Building[];
  locale: string;
}

export default function FloorsClient({
  initialFloors,
  initialBuildings,
  locale,
}: FloorsClientProps) {
  const router = useRouter();
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const [floors, setFloors] = useState<Floor[]>(initialFloors);
  const [buildings] = useState<Building[]>(initialBuildings);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    code: '',
    order: 0,
    buildingId: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buildingId) {
      setMessage({ type: 'error', text: t('requiredFields') });
      return;
    }
    setLoading(true);
    try {
      const url = editing ? `/api/locations/floors/${editing.id}` : '/api/locations/floors';
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
      setForm({ name: '', nameEn: '', code: '', order: 0, buildingId: '' });
      setShowForm(false);
      router.replace(`/${locale}/locations/floors`);
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
      const res = await fetch(`/api/locations/floors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || t('deleteError') });
        return;
      }
      setMessage({ type: 'success', text: t('deleteSuccess') || 'تم الحذف بنجاح' });
      router.replace(`/${locale}/locations/floors`);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const editFloor = (floor: Floor) => {
    setEditing(floor);
    setForm({
      name: floor.name,
      nameEn: floor.nameEn || '',
      code: floor.code,
      order: floor.order,
      buildingId: floor.buildingId,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', nameEn: '', code: '', order: 0, buildingId: '' });
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
            <Layers className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('floors') || 'الأدوار'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? 'إدارة الأدوار وتنظيم الطوابق حسب المباني'
                : 'Manage floors and organize levels by buildings'}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addFloor') || 'إضافة دور'}
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
              {editing ? t('editFloor') || 'تعديل دور' : t('addFloor') || 'إضافة دور'}
            </h2>
            <button
              onClick={cancelEdit}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.buildingId}
              onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 appearance-none"
              required
            >
              <option value="">{t('building') || 'المبنى'}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
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

      {/* جدول الأدوار */}
      <div className={glassCard}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
            <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isRTL ? 'قائمة الأدوار' : 'Floors List'}
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
                  {t('building') || 'المبنى'}
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
                  {t('actions') || 'الإجراءات'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {floors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    {isRTL ? 'لا توجد أدوار لعرضها' : 'No floors to display'}
                  </td>
                </tr>
              ) : (
                floors.map((floor, idx) => (
                  <tr key={floor.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                    <td className="p-3 text-slate-600 dark:text-slate-300">{idx + 1}</td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{floor.building.name}</td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{floor.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{floor.nameEn || '—'}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{floor.code}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{floor.order}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => editFloor(floor)}
                          className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                          title={isRTL ? 'تعديل' : 'Edit'}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(floor.id)}
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