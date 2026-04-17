'use client';

import { useEffect, useState } from 'react';

export default function EditCompanyModal({
  open,
  company,
  onClose,
  onSuccess,
}: any) {
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    adminEmail: '',
    adminPassword: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        nameEn: company.nameEn || '',
        adminEmail: company.adminEmail || '',
        adminPassword: '',
        subscriptionStartDate: company.subscriptionStartDate
          ? company.subscriptionStartDate.split('T')[0]
          : '',
        subscriptionEndDate: company.subscriptionEndDate
          ? company.subscriptionEndDate.split('T')[0]
          : '',
      });
    }
  }, [company]);

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
      if (!res.ok) throw new Error(data.error);

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
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
            setForm({ ...form, subscriptionStartDate: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="date"
          value={form.subscriptionEndDate}
          onChange={(e) =>
            setForm({ ...form, subscriptionEndDate: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
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