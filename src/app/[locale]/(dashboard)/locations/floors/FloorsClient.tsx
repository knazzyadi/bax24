// src/app/[locale]/(dashboard)/locations/floors/FloorsClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      router.refresh();
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
      router.refresh();
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t('floors') || 'الأدوار'}</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition"
          >
            <Plus size={18} /> {t('addFloor') || 'إضافة دور'}
          </button>
        )}
      </div>

      {message && (
        <div
          className={cn(
            'p-2 mb-4 rounded',
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          )}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-foreground">
              {editing ? t('editFloor') || 'تعديل دور' : t('addFloor') || 'إضافة دور'}
            </h2>
            <button
              onClick={cancelEdit}
              className="text-muted-foreground hover:text-foreground transition"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.buildingId}
              onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
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
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              placeholder={t('nameEn') || 'الاسم بالإنجليزية'}
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder={t('code') || 'الكود'}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="number"
              placeholder={t('order') || 'الترتيب'}
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : t('save') || 'حفظ'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                {t('cancel') || 'إلغاء'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border border-border rounded-lg">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              <th className="p-2 text-right text-foreground">#</th>
              <th className="p-2 text-right text-foreground">{t('building') || 'المبنى'}</th>
              <th className="p-2 text-right text-foreground">{t('nameAr') || 'الاسم بالعربية'}</th>
              <th className="p-2 text-right text-foreground">{t('nameEn') || 'الاسم بالإنجليزية'}</th>
              <th className="p-2 text-right text-foreground">{t('code') || 'الكود'}</th>
              <th className="p-2 text-right text-foreground">{t('order') || 'الترتيب'}</th>
              <th className="p-2 text-right text-foreground">{t('actions') || 'الإجراءات'}</th>
            </tr>
          </thead>
          <tbody>
            {floors.map((floor, idx) => (
              <tr key={floor.id} className="border-b border-border hover:bg-muted/30">
                <td className="p-2 text-right">{idx + 1}</td>
                <td className="p-2 text-right">{floor.building.name}</td>
                <td className="p-2 text-right">{floor.name}</td>
                <td className="p-2 text-right">{floor.nameEn || '-'}</td>
                <td className="p-2 text-right">{floor.code}</td>
                <td className="p-2 text-right">{floor.order}</td>
                <td className="p-2 flex gap-2 justify-end">
                  <button
                    onClick={() => editFloor(floor)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(floor.id)}
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}