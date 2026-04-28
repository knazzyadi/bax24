// src/app/[locale]/(dashboard)/settings/asset-types/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminGuard } from '@/lib/client-guard';

interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  description?: string;
  order: number;
  isDefault: boolean;
  companyId?: string;
}

function AssetTypesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('AssetTypes');

  const [types, setTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/asset-types');
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('استجابة غير صالحة من الخادم');
      }
      if (!res.ok) throw new Error(data.error || 'فشل تحميل البيانات');
      setTypes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setShowModal(true);
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
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingType ? `/api/asset-types/${editingType.id}` : '/api/asset-types';
      const method = editingType ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('استجابة غير صالحة من الخادم');
      }
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      setMessage({ type: 'success', text: editingType ? t('updateSuccess') : t('createSuccess') });
      setShowModal(false);
      fetchTypes();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/asset-types/${id}`, { method: 'DELETE' });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('استجابة غير صالحة من الخادم');
      }
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      setMessage({ type: 'success', text: t('deleteSuccess') });
      fetchTypes();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (status === 'loading') return <div className="p-6 text-center">{t('loading')}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <button onClick={openCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2">
          <Plus size={18} /> {t('addType')}
        </button>
      </div>

      {message && (
        <div className={cn('p-3 mb-4 rounded-md', message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="p-3 text-right">{t('name')}</th>
                <th className="p-3 text-right">{t('nameEn')}</th>
                <th className="p-3 text-right">{t('code')}</th>
                <th className="p-3 text-right">{t('order')}</th>
                <th className="p-3 text-right">{t('isDefault')}</th>
                <th className="p-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{t('noTypes')}</td></tr>
              ) : (
                types.map((type) => (
                  <tr key={type.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{type.name}</td>
                    <td className="p-3">{type.nameEn || '-'}</td>
                    <td className="p-3">{type.code || '-'}</td>
                    <td className="p-3">{type.order}</td>
                    <td className="p-3">{type.isDefault ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-red-500" />}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEditModal(type)} className="text-yellow-600 hover:opacity-80" title={t('edit')}>
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:opacity-80" title={t('delete')}>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">{editingType ? t('editType') : t('addType')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('name')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('nameEn')}</label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('code')}</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: MED, HVAC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('order')}</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                <label htmlFor="isDefault" className="text-sm">{t('isDefault')}</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">{t('cancel')}</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
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

export default function AssetTypesPage() {
  return (
    <AdminGuard>
      <AssetTypesPageContent />
    </AdminGuard>
  );
}