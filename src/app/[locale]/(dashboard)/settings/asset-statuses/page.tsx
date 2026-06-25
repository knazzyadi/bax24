// src/app/[locale]/(dashboard)/settings/asset-statuses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { AdminGuard } from '@/lib/client-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { cn } from '@/lib/utils';

// ✅ قائمة الألوان الثابتة
const COLOR_PALETTE = [
  { value: '#3b82f6', nameAr: 'أزرق', nameEn: 'Blue' },
  { value: '#22c55e', nameAr: 'أخضر', nameEn: 'Green' },
  { value: '#ef4444', nameAr: 'أحمر', nameEn: 'Red' },
  { value: '#eab308', nameAr: 'أصفر', nameEn: 'Yellow' },
  { value: '#f97316', nameAr: 'برتقالي', nameEn: 'Orange' },
  { value: '#8b5cf6', nameAr: 'بنفسجي', nameEn: 'Purple' },
  { value: '#ec4899', nameAr: 'وردي', nameEn: 'Pink' },
  { value: '#6b7280', nameAr: 'رمادي', nameEn: 'Gray' },
  { value: '#06b6d4', nameAr: 'سماوي', nameEn: 'Cyan' },
];

interface AssetStatus {
  id: string;
  name: string;
  nameEn: string | null;
  color: string | null;
  order: number;
  isDefault: boolean;
}

function AssetStatusesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('AssetStatuses');
  const isRtl = locale === 'ar';

  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AssetStatus | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    color: '#3b82f6',
    order: 0,
    isDefault: false,
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      const url = bypassCache ? `/api/asset-statuses?t=${Date.now()}` : '/api/asset-statuses';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStatuses(data);
    } catch (err) {
      toast.error(t('fetchError') || 'حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('nameRequired') || 'الاسم مطلوب');
      return;
    }
    setSubmitting(true);
    try {
      const url = editing ? `/api/asset-statuses/${editing.id}` : '/api/asset-statuses';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(editing ? t('updateSuccess') : t('createSuccess'));
      setEditing(null);
      setForm({ name: '', nameEn: '', color: '#3b82f6', order: 0, isDefault: false });
      setShowForm(false);
      await fetchStatuses(true);
      router.refresh();
    } catch (err) {
      toast.error(editing ? t('updateError') : t('createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm') || 'هل أنت متأكد؟')) return;
    try {
      const res = await fetch(`/api/asset-statuses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(t('deleteSuccess'));
      await fetchStatuses(true);
      router.refresh();
    } catch (err) {
      toast.error(t('deleteError'));
    }
  };

  const editStatus = (status: AssetStatus) => {
    setEditing(status);
    setForm({
      name: status.name,
      nameEn: status.nameEn || '',
      color: status.color || '#3b82f6',
      order: status.order,
      isDefault: status.isDefault,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', nameEn: '', color: '#3b82f6', order: 0, isDefault: false });
    setShowForm(false);
  };

  const getColorLabel = (colorValue: string) => {
    const color = COLOR_PALETTE.find(c => c.value === colorValue);
    if (!color) return colorValue;
    return isRtl ? color.nameAr : color.nameEn;
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
          <Button onClick={() => setShowForm(true)} className="gap-2 shadow-sm">
            <Plus size={18} /> {t('addStatus')}
          </Button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg font-semibold">
              {editing ? t('editStatus') : t('addStatus')}
            </CardTitle>
            <button
              onClick={cancelEdit}
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
                  placeholder={isRtl ? 'مثال: نشط' : 'Example: Active'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('nameEn')}</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="Example: Active"
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('color')}</Label>
                <Select
                  value={form.color}
                  onValueChange={(val) => setForm({ ...form, color: val })}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-border"
                        style={{ backgroundColor: form.color }}
                      />
                      <span>{getColorLabel(form.color)}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_PALETTE.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{isRtl ? color.nameAr : color.nameEn}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* جدول الحالات */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : statuses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground">{t('noStatuses') || 'لا توجد حالات مسجلة'}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">{t('name')}</TableHead>
                <TableHead className="font-semibold">{t('nameEn')}</TableHead>
                <TableHead className="font-semibold">{t('color')}</TableHead>
                <TableHead className="font-semibold text-center">{t('order')}</TableHead>
                <TableHead className="font-semibold text-center">{t('isDefault')}</TableHead>
                <TableHead className="font-semibold text-center w-24">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status) => (
                <TableRow key={status.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{status.name}</TableCell>
                  <TableCell>{status.nameEn || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: status.color || '#6b7280' }}
                      />
                      <span className="text-sm">{getColorLabel(status.color || '#6b7280')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{status.order}</TableCell>
                  <TableCell className="text-center">
                    {status.isDefault ? (
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
                        onClick={() => editStatus(status)}
                        title={t('edit')}
                        className="h-8 w-8 hover:bg-primary/10"
                      >
                        <Pencil size={15} className="text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(status.id)}
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

export default function AssetStatusesPage() {
  return (
    <AdminGuard>
      <AssetStatusesPageContent />
    </AdminGuard>
  );
}