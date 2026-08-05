// src/components/super-admin/companies/AddCompanyModal.tsx
'use client';

import { useState } from 'react';

// ============================
// ✅ واجهات الأنواع (بدون any)
// ============================
interface AddCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CompanyFormData {
  companyNameAr: string;
  companyNameEn: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

export default function AddCompanyModal({
  open,
  onClose,
  onSuccess,
}: AddCompanyModalProps) {
  // حالة النموذج
  const [formData, setFormData] = useState<CompanyFormData>({
    companyNameAr: '',
    companyNameEn: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
  });

  const [loading, setLoading] = useState(false);

  // إذا كانت النافذة مغلقة، لا نعرض أي شيء
  if (!open) return null;

  // ============================
  // ✅ معالجة تغيير الحقول
  // ============================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ============================
  // ✅ معالجة إرسال النموذج
  // ============================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إنشاء الشركة');
      }

      // ✅ إشعار النجاح (يمكنك استبدال alert بـ toast)
      alert('✅ تم إنشاء الشركة بنجاح!');

      // ✅ إعادة تعيين النموذج وإغلاق النافذة
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

    } catch (err: unknown) {
      // ✅ معالجة الأخطاء بأمان
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'حدث خطأ غير متوقع';

      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // ✅ واجهة المستخدم
  // ============================
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        // إغلاق النافذة عند النقر على الخلفية
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          إضافة شركة جديدة
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اسم الشركة (عربي) */}
          <div>
            <label htmlFor="companyNameAr" className="block text-sm mb-1">
              اسم الشركة (عربي) *
            </label>
            <input
              id="companyNameAr"
              type="text"
              name="companyNameAr"
              value={formData.companyNameAr}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>

          {/* اسم الشركة (إنجليزي) */}
          <div>
            <label htmlFor="companyNameEn" className="block text-sm mb-1">
              اسم الشركة (إنجليزي)
            </label>
            <input
              id="companyNameEn"
              type="text"
              name="companyNameEn"
              value={formData.companyNameEn}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* اسم المدير */}
          <div>
            <label htmlFor="adminName" className="block text-sm mb-1">
              اسم المدير *
            </label>
            <input
              id="adminName"
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>

          {/* البريد الإلكتروني */}
          <div>
            <label htmlFor="adminEmail" className="block text-sm mb-1">
              البريد الإلكتروني *
            </label>
            <input
              id="adminEmail"
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label htmlFor="adminPassword" className="block text-sm mb-1">
              كلمة المرور *
            </label>
            <input
              id="adminPassword"
              type="password"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>

          {/* تواريخ الاشتراك */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="subscriptionStartDate" className="block text-sm mb-1">
                بداية الاشتراك
              </label>
              <input
                id="subscriptionStartDate"
                type="date"
                name="subscriptionStartDate"
                value={formData.subscriptionStartDate}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="subscriptionEndDate" className="block text-sm mb-1">
                نهاية الاشتراك
              </label>
              <input
                id="subscriptionEndDate"
                type="date"
                name="subscriptionEndDate"
                value={formData.subscriptionEndDate}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              disabled={loading}
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الحفظ...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}