'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminGuard } from '@/lib/client-guard';

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
  { value: '#ef4444', label: 'أحمر (عاجل)', labelEn: 'Red (Urgent)' },
  { value: '#f97316', label: 'برتقالي', labelEn: 'Orange' },
  { value: '#eab308', label: 'أصفر', labelEn: 'Yellow' },
  { value: '#22c55e', label: 'أخضر', labelEn: 'Green' },
  { value: '#3b82f6', label: 'أزرق', labelEn: 'Blue' },
  { value: '#8b5cf6', label: 'بنفسجي', labelEn: 'Purple' },
  { value: '#ec489a', label: 'وردي', labelEn: 'Pink' },
  { value: '#64748b', label: 'رمادي (افتراضي)', labelEn: 'Gray (Default)' },
  { value: '#14b8a6', label: 'فيروزي', labelEn: 'Teal' },
  { value: '#dc2626', label: 'أحمر داكن', labelEn: 'Dark Red' },
];

function WorkOrderPrioritiesPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('WorkOrderPriorities');

  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  const openCreateModal = () => {
    setEditingPriority(null);
    setForm({ name: '', nameEn: '', color: '#64748b', order: 0, isDefault: false });
    setShowModal(true);
  };

  const openEditModal = (priority: Priority) => {
    setEditingPriority(priority);
    setForm({
      name: priority.name,
      nameEn: priority.nameEn || '',
      color: priority.color || '#64748b',
      order: priority.order,
      isDefault: priority.isDefault,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setMessage({ type: 'success', text: editingPriority ? t('updateSuccess') : t('createSuccess') });
      setShowModal(false);
      fetchPriorities();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
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
      setMessage({ type: 'success', text: t('deleteSuccess') });
      fetchPriorities();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (sessionStatus === 'loading') {
    return <div className="p-6 text-center">{t('loading')}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={18} /> {t('addStatus')}
        </button>
      </div>

      {message && (
        <div
          className={cn(
            'p-3 mb-4 rounded-md',
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          )}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('loading')}</div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 text-right text-gray-700 dark:text-gray-300">{t('name')}</th>
                <th className="p-3 text-right text-gray-700 dark:text-gray-300">{t('nameEn')}</th>
                <th className="p-3 text-right text-gray-700 dark:text-gray-300">{t('order')}</th>
                <th className="p-3 text-right text-gray-700 dark:text-gray-300">{t('isDefault')}</th>
                <th className="p-3 text-right text-gray-700 dark:text-gray-300">{t('color')}</th>
                <th className="p-3 text-right text-gray-700 dark:text-gray-300">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {priorities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t('noStatuses')}
                  </td>
                </tr>
              ) : (
                priorities.map((priority) => (
                  <tr
                    key={priority.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-3 text-gray-900 dark:text-white">{priority.name}</td>
                    <td className="p-3 text-gray-900 dark:text-white">{priority.nameEn || '-'}</td>
                    <td className="p-3 text-gray-900 dark:text-white">{priority.order}</td>
                    <td className="p-3">
                      {priority.isDefault ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <X size={16} className="text-red-500" />
                      )}
                    </td>
                    <td className="p-3">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: priority.color }}
                      />
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(priority)}
                        className="text-yellow-600 hover:opacity-80"
                        title={t('edit')}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(priority.id)}
                        className="text-red-600 hover:opacity-80"
                        title={t('delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for create/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editingPriority ? t('editStatus') : t('addStatus')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('name')} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('nameEn')}
                </label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('order')}
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('color')}
                </label>
                <select
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {COLOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="dark:bg-gray-800">
                      {locale === 'ar' ? option.label : option.labelEn}
                    </option>
                  ))}
                </select>
                <div
                  className="mt-2 w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: form.color }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('isDefault')}
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700"
                >
                  {submitting ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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