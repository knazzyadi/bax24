//src\components\super-admin\companies\AddCompanyModal.tsx
//إنشاء نافذة (Modal) لإضافة شركة جديدة داخل لوحة الـ Super Admin وإرسال البيانات إلى API لإنشاء سجل جديد في قاعدة البيانات
'use client';

import { useState } from 'react';

export default function AddCompanyModal({ open, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    companyNameAr: '',
    companyNameEn: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onSuccess();
      onClose();

      setFormData({
        companyNameAr: '',
        companyNameEn: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        subscriptionStartDate: '',
        subscriptionEndDate: '',
      });

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl">

        <h2 className="text-xl font-bold mb-4">إضافة شركة جديدة</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* اسم الشركة عربي */}
          <div>
            <label className="block text-sm mb-1">اسم الشركة (عربي) *</label>
            <input
              type="text"
              name="companyNameAr"
              value={formData.companyNameAr}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          {/* اسم الشركة انجليزي */}
          <div>
            <label className="block text-sm mb-1">اسم الشركة (إنجليزي)</label>
            <input
              type="text"
              name="companyNameEn"
              value={formData.companyNameEn}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          {/* اسم المدير */}
          <div>
            <label className="block text-sm mb-1">اسم المدير *</label>
            <input
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          {/* ايميل المدير */}
          <div>
            <label className="block text-sm mb-1">البريد الإلكتروني *</label>
            <input
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-sm mb-1">كلمة المرور *</label>
            <input
              type="password"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          {/* تواريخ الاشتراك */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">بداية الاشتراك</label>
              <input
                type="date"
                name="subscriptionStartDate"
                value={formData.subscriptionStartDate}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">نهاية الاشتراك</label>
              <input
                type="date"
                name="subscriptionEndDate"
                value={formData.subscriptionEndDate}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              {loading ? 'جاري الحفظ...' : 'إضافة'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}