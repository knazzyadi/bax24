'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Building {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
}

export default function BuildingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState({ name: '', nameEn: '', code: '', order: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/login`);
    else if (session?.user?.role !== 'ADMIN') router.push(`/${locale}/dashboard`);
    else fetchBuildings();
  }, [status]);

  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/locations/buildings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBuildings(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/locations/buildings/${editing.id}` : '/api/locations/buildings';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: editing ? t('save') : t('save') });
      setEditing(null);
      setForm({ name: '', nameEn: '', code: '', order: 0 });
      setShowForm(false);
      fetchBuildings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/locations/buildings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || t('deleteError') });
        return;
      }
      setMessage({ type: 'success', text: t('deleteSuccess') });
      fetchBuildings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const editBuilding = (b: Building) => {
    setEditing(b);
    setForm({ name: b.name, nameEn: b.nameEn || '', code: b.code, order: b.order });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', nameEn: '', code: '', order: 0 });
    setShowForm(false);
  };

  if (status === 'loading') return <div className="p-6">جاري التحميل...</div>;
  if (!session || session.user?.role !== 'ADMIN') return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t('buildings')}</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition"
          >
            <Plus size={18} /> {t('addBuilding')}
          </button>
        )}
      </div>

      {message && (
        <div className={cn(
          "p-2 mb-4 rounded",
          message.type === 'success'
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        )}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-foreground">{editing ? t('editBuilding') : t('addBuilding')}</h2>
            <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground transition">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t('nameAr')}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              required
            />
            <input
              type="text"
              placeholder={t('nameEn')}
              value={form.nameEn}
              onChange={e => setForm({ ...form, nameEn: e.target.value })}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
            <input
              type="text"
              placeholder={t('code')}
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              required
            />
            <input
              type="number"
              placeholder={t('order')}
              value={form.order}
              onChange={e => setForm({ ...form, order: Number(e.target.value) })}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
                {editing ? t('save') : t('save')}
              </button>
              <button type="button" onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition">
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="p-2 text-right text-foreground">#</th>
                <th className="p-2 text-right text-foreground">{t('nameAr')}</th>
                <th className="p-2 text-right text-foreground">{t('nameEn')}</th>
                <th className="p-2 text-right text-foreground">{t('code')}</th>
                <th className="p-2 text-right text-foreground">{t('order')}</th>
                <th className="p-2 text-right text-foreground">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((b, idx) => (
                <tr key={b.id} className="border-b border-border hover:bg-muted/30">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{b.name}</td>
                  <td className="p-2">{b.nameEn || '-'}</td>
                  <td className="p-2">{b.code}</td>
                  <td className="p-2">{b.order}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => editBuilding(b)} className="text-blue-600 dark:text-blue-400 hover:underline">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-600 dark:text-red-400 hover:underline">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
           </table>
        </div>
      )}
    </div>
  );
}