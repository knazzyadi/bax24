// src/app/[locale]/(dashboard)/locations/rooms/RoomsClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Floor {
  id: string;
  name: string;
  nameEn: string | null;
  buildingId: string;
  building: {
    id: string;
    name: string;
  };
}

interface Room {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  floorId: string;
  floor: {
    id: string;
    name: string;
    nameEn: string | null;
    building: {
      id: string;
      name: string;
      nameEn: string | null;
    };
  };
}

interface RoomsClientProps {
  initialRooms: Room[];
  initialFloors: Floor[];
  locale: string;
}

export default function RoomsClient({
  initialRooms,
  initialFloors,
  locale,
}: RoomsClientProps) {
  const router = useRouter();
  const t = useTranslations('Locations');

  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [floors] = useState<Floor[]>(initialFloors);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    code: '',
    order: 0,
    floorId: '',
    buildingId: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFloorChange = (floorId: string) => {
    const selectedFloor = floors.find((f) => f.id === floorId);
    setForm((prev) => ({
      ...prev,
      floorId,
      buildingId: selectedFloor?.buildingId || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.floorId || !form.buildingId) {
      setMessage({ type: 'error', text: t('requiredFields') });
      return;
    }
    setLoading(true);
    try {
      const url = editing ? `/api/locations/rooms/${editing.id}` : '/api/locations/rooms';
      const method = editing ? 'PUT' : 'POST';
      const payload = {
        name: form.name,
        nameEn: form.nameEn || null,
        code: form.code,
        order: form.order,
        floorId: form.floorId,
        buildingId: form.buildingId,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: t('saveSuccess') || 'تم الحفظ بنجاح' });
      setEditing(null);
      setForm({ name: '', nameEn: '', code: '', order: 0, floorId: '', buildingId: '' });
      setShowForm(false);
      
      // ✅ إعادة تحميل الصفحة لعرض البيانات الجديدة
      router.replace(`/${locale}/locations/rooms`);
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
      const res = await fetch(`/api/locations/rooms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || t('deleteError') });
        return;
      }
      setMessage({ type: 'success', text: t('deleteSuccess') || 'تم الحذف بنجاح' });
      router.replace(`/${locale}/locations/rooms`);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const editRoom = (room: Room) => {
    const floor = floors.find((f) => f.id === room.floorId);
    setEditing(room);
    setForm({
      name: room.name,
      nameEn: room.nameEn || '',
      code: room.code,
      order: room.order,
      floorId: room.floorId,
      buildingId: floor?.buildingId || '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', nameEn: '', code: '', order: 0, floorId: '', buildingId: '' });
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t('rooms') || 'الغرف'}</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition"
          >
            <Plus size={18} /> {t('addRoom') || 'إضافة غرفة'}
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
              {editing ? t('editRoom') || 'تعديل غرفة' : t('addRoom') || 'إضافة غرفة'}
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
              value={form.floorId}
              onChange={(e) => handleFloorChange(e.target.value)}
              className="border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">{t('floor') || 'الدور'}</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.building?.name ? `${f.building.name} - ` : ''}{f.name}
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
              <th className="p-2 text-right text-foreground">{t('floor') || 'الدور'}</th>
              <th className="p-2 text-right text-foreground">{t('nameAr') || 'الاسم بالعربية'}</th>
              <th className="p-2 text-right text-foreground">{t('nameEn') || 'الاسم بالإنجليزية'}</th>
              <th className="p-2 text-right text-foreground">{t('code') || 'الكود'}</th>
              <th className="p-2 text-right text-foreground">{t('order') || 'الترتيب'}</th>
              <th className="p-2 text-right text-foreground">{t('actions') || 'الإجراءات'}</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, idx) => (
              <tr key={room.id} className="border-b border-border hover:bg-muted/30">
                <td className="p-2 text-right">{idx + 1}</td>
                <td className="p-2 text-right">
                  {room.floor.building.name} - {room.floor.name}
                </td>
                <td className="p-2 text-right">{room.name}</td>
                <td className="p-2 text-right">{room.nameEn || '-'}</td>
                <td className="p-2 text-right">{room.code}</td>
                <td className="p-2 text-right">{room.order}</td>
                <td className="p-2 flex gap-2 justify-end">
                  <button
                    onClick={() => editRoom(room)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
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