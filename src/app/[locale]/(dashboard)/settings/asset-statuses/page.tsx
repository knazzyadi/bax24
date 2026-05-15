// src/app/[locale]/(dashboard)/settings/asset-statuses/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminGuard } from '@/lib/client-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface AssetStatus {
  id: string;
  name: string;
  nameEn: string | null;
  code: string | null;
  color: string | null;
  order: number;
  isDefault: boolean;
}

function AssetStatusesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('Settings'); // تأكد من وجود هذه الترجمة

  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AssetStatus | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    code: '',
    color: '#64748b',
    order: 0,
    isDefault: false,
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else {
      fetchStatuses();
    }
  }, [status, locale, router]);

  const fetchStatuses = async (bypassCache = false) => {
    setLoading(true);
    try {
      const url = bypassCache ? '/api/asset-statuses?t=' + Date.now() : '/api/asset-statuses';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatuses(data);
    } catch (err: any) {
      toast.error(err.message || t('fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }
    try {
      const url = editing ? `/api/asset-statuses/${editing.id}` : '/api/asset-statuses';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? t('updateSuccess') : t('createSuccess'));
      setEditing(null);
      setForm({ name: '', nameEn: '', code: '', color: '#64748b', order: 0, isDefault: false });
      setShowForm(false);
      await fetchStatuses(true);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/asset-statuses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(t('deleteSuccess'));
      await fetchStatuses(true);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const editStatus = (status: AssetStatus) => {
    setEditing(status);
    setForm({
      name: status.name,
      nameEn: status.nameEn || '',
      code: status.code || '',
      color: status.color || '#64748b',
      order: status.order,
      isDefault: status.isDefault,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', nameEn: '', code: '', color: '#64748b', order: 0, isDefault: false });
    setShowForm(false);
  };

  if (status === 'loading' || loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('assetStatuses')}</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus size={18} /> {t('addStatus')}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>{editing ? t('editStatus') : t('addStatus')}</CardTitle>
            <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('nameAr')} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('nameEn')}</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('code')}</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('color')}</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="#64748b"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('order')}</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isDefault">{t('defaultStatus')}</Label>
              </div>
              <div className="md:col-span-2 flex gap-2 pt-2">
                <Button type="submit">{editing ? t('save') : t('create')}</Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>{t('cancel')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {statuses.length === 0 ? (
        <p className="text-center text-muted-foreground">{t('noStatuses')}</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="p-3 text-right">{t('nameAr')}</th>
                <th className="p-3 text-right">{t('nameEn')}</th>
                <th className="p-3 text-right">{t('code')}</th>
                <th className="p-3 text-right">{t('color')}</th>
                <th className="p-3 text-right">{t('order')}</th>
                <th className="p-3 text-right">{t('default')}</th>
                <th className="p-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((status) => (
                <tr key={status.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">{status.name}</td>
                  <td className="p-3">{status.nameEn || '-'}</td>
                  <td className="p-3">{status.code || '-'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: status.color || '#64748b' }} />
                      <span>{status.color || '-'}</span>
                    </div>
                  </td>
                  <td className="p-3">{status.order}</td>
                  <td className="p-3">{status.isDefault ? '✓' : ''}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => editStatus(status)} className="text-blue-600 hover:underline">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(status.id)} className="text-red-600 hover:underline">
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

export default function AssetStatusesPage() {
  return (
    <AdminGuard>
      <AssetStatusesPageContent />
    </AdminGuard>
  );
}