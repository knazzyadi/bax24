// src/app/[locale]/(dashboard)/settings/asset-types/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { AdminGuard } from '@/lib/client-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

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
    return <div className="p-6 text-center text-muted-foreground">{t('loading') || 'جاري التحميل...'}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        {!showForm && (
          <Button onClick={openCreateModal} className="gap-2 shadow-sm">
            <Plus size={18} /> {t('addType')}
          </Button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg font-semibold">
              {editingType ? t('editType') : t('addType')}
            </CardTitle>
            <button
              onClick={cancelForm}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('name')} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={isRtl ? 'مثال: طبي' : 'Example: Medical'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('nameEn')}</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="Example: Medical"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('code') || 'الكود'}</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder={isRtl ? 'مثال: MED' : 'Example: MED'}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('order')}</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <Label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                  {t('isDefault')}
                </Label>
              </div>

              <div className="md:col-span-3 flex gap-2 pt-2 border-t">
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('save')}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* جدول الأنواع */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : types.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground">{t('noTypes') || 'لا توجد أنواع أصول مسجلة'}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">{t('name')}</TableHead>
                <TableHead className="font-semibold">{t('nameEn')}</TableHead>
                <TableHead className="font-semibold">{t('code') || 'الكود'}</TableHead>
                <TableHead className="font-semibold text-center">{t('order')}</TableHead>
                <TableHead className="font-semibold text-center">{t('isDefault')}</TableHead>
                <TableHead className="font-semibold text-center w-24">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.nameEn || '—'}</TableCell>
                  <TableCell>{type.code || '—'}</TableCell>
                  <TableCell className="text-center">{type.order}</TableCell>
                  <TableCell className="text-center">
                    {type.isDefault ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(type)}
                        title={t('edit')}
                        className="h-8 w-8 hover:bg-primary/10"
                      >
                        <Pencil size={15} className="text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(type.id)}
                        title={t('delete')}
                        className="h-8 w-8 hover:bg-destructive/10"
                      >
                        <Trash2 size={15} className="text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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