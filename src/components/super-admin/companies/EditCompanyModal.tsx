// src/components/super-admin/companies/EditCompanyModal.tsx
'use client';

import { useState } from 'react';

interface Company {
  id: string;
  name?: string | null;
  nameEn?: string | null;
  adminEmail?: string | null;
  subscriptionStartDate?: string | Date | null;
  subscriptionEndDate?: string | Date | null;
}

interface EditCompanyModalProps {
  open: boolean;
  company: Company;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCompanyModal({
  open,
  company,
  onClose,
  onSuccess,
}: EditCompanyModalProps) {
  const [form, setForm] = useState(() => ({
    name: company?.name ?? '',
    nameEn: company?.nameEn ?? '',
    adminEmail: company?.adminEmail ?? '',
    adminPassword: '',
    subscriptionStartDate: company?.subscriptionStartDate
      ? new Date(company.subscriptionStartDate).toISOString().split('T')[0]
      : '',
    subscriptionEndDate: company?.subscriptionEndDate
      ? new Date(company.subscriptionEndDate).toISOString().split('T')[0]
      : '',
  }));

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث الشركة');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('حدث خطأ غير معروف');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-xl w-full max-w-lg space-y-3">
        <h2 className="text-xl font-bold">تعديل الشركة</h2>

        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="اسم الشركة"
          className="w-full border p-2 rounded"
        />

        <input
          value={form.nameEn}
          onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          placeholder="English Name"
          className="w-full border p-2 rounded"
        />

        <input
          value={form.adminEmail}
          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
          placeholder="Email"
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          value={form.adminPassword}
          onChange={(e) =>
            setForm({ ...form, adminPassword: e.target.value })
          }
          placeholder="Password (optional)"
          className="w-full border p-2 rounded"
        />

        <input
          type="date"
          value={form.subscriptionStartDate}
          onChange={(e) =>
            setForm({
              ...form,
              subscriptionStartDate: e.target.value,
            })
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="date"
          value={form.subscriptionEndDate}
          onChange={(e) =>
            setForm({
              ...form,
              subscriptionEndDate: e.target.value,
            })
          }
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded"
          >
            إلغاء
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1 bg-indigo-600 text-white rounded"
          >
            {loading ? 'جاري...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}