'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

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
      setMessage({ type: 'success', text: editing ? 'تم التحديث' : 'تمت الإضافة' });
      setEditing(null);
      setForm({ name: '', nameEn: '', code: '', order: 0 });
      setShowForm(false);
      fetchBuildings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المبنى؟')) return;
    try {
      const res = await fetch(`/api/locations/buildings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        // عرض الرسالة التفصيلية من الخادم (مثل: لا يمكن الحذف لوجود أدوار مرتبطة)
        setMessage({ type: 'error', text: data.error || 'فشل الحذف' });
        return;
      }
      setMessage({ type: 'success', text: 'تم الحذف بنجاح' });
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
        <h1 className="text-2xl font-bold">إدارة المباني</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus size={18} /> إضافة مبنى جديد
          </button>
        )}
      </div>

      {message && (
        <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-card p-4 rounded-lg shadow mb-6 border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">{editing ? 'تعديل مبنى' : 'إضافة مبنى جديد'}</h2>
            <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="الاسم (عربي)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="الاسم (إنجليزي)"
              value={form.nameEn}
              onChange={e => setForm({ ...form, nameEn: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="الكود"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="الترتيب"
              value={form.order}
              onChange={e => setForm({ ...form, order: Number(e.target.value) })}
              className="border p-2 rounded"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                {editing ? 'تحديث' : 'إضافة'}
              </button>
              <button type="button" onClick={cancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-right">#</th>
                <th>الاسم (عربي)</th>
                <th>الاسم (إنجليزي)</th>
                <th>الكود</th>
                <th>الترتيب</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((b, idx) => (
                <tr key={b.id} className="border-b">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{b.name}</td>
                  <td className="p-2">{b.nameEn || '-'}</td>
                  <td className="p-2">{b.code}</td>
                  <td className="p-2">{b.order}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => editBuilding(b)} className="text-blue-600">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-600">
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