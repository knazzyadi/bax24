'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Branch {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  companyId: string;
  company: { name: string };
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
}

export default function BranchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    code: '',
    companyId: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/ar/login');
    if (session?.user?.role !== 'SUPER_ADMIN') router.push('/ar/dashboard');
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchesRes, companiesRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/companies'),
      ]);
      if (!branchesRes.ok) {
        const errText = await branchesRes.text();
        throw new Error(`فشل جلب الفروع: ${branchesRes.status} - ${errText}`);
      }
      if (!companiesRes.ok) {
        const errText = await companiesRes.text();
        throw new Error(`فشل جلب الشركات: ${companiesRes.status} - ${errText}`);
      }
      const branchesData = await branchesRes.json();
      const companiesData = await companiesRes.json();
      setBranches(branchesData || []);
      setCompanies(companiesData || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', nameEn: '', code: '', companyId: '' });
    setEditingBranch(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      nameEn: branch.nameEn || '',
      code: branch.code,
      companyId: branch.companyId,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        setError(err.error || 'فشل الحذف');
      }
    } catch (err) {
      setError('خطأ في الشبكة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let url = '/api/branches';
      let method = 'POST';
      if (editingBranch) {
        url = `/api/branches/${editingBranch.id}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        resetForm();
        fetchData();
      } else {
        const err = await res.json();
        setError(err.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      setError('خطأ في الشبكة');
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة الفروع</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'إلغاء' : '+ إضافة فرع جديد'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {showForm && (
        <div className="bg-gray-50 p-4 rounded mb-6 border">
          <h2 className="text-xl font-semibold mb-3">
            {editingBranch ? 'تعديل فرع' : 'إضافة فرع'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block mb-1">اسم الفرع (عربي) *</label>
              <input
                type="text"
                required
                className="w-full border p-2 rounded"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block mb-1">اسم الفرع (إنجليزي)</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              />
            </div>
            <div>
              <label className="block mb-1">كود الفرع *</label>
              <input
                type="text"
                required
                className="w-full border p-2 rounded"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block mb-1">الشركة *</label>
              <select
                required
                className="w-full border p-2 rounded"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                disabled={!!editingBranch} // لا نسمح بتغيير الشركة أثناء التعديل (لتبسيط المنطق)
              >
                <option value="">اختر شركة</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {editingBranch ? 'تحديث' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">#</th>
              <th className="p-2 border">اسم الفرع (عربي)</th>
              <th className="p-2 border">الاسم بالإنجليزية</th>
              <th className="p-2 border">الكود</th>
              <th className="p-2 border">الشركة</th>
              <th className="p-2 border">تاريخ الإضافة</th>
              <th className="p-2 border">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-4 text-gray-500">
                  لا توجد فروع مسجلة
                </td>
              </tr>
            ) : (
              branches.map((branch, idx) => (
                <tr key={branch.id} className="border-t">
                  <td className="p-2 border text-center">{idx + 1}</td>
                  <td className="p-2 border">{branch.name}</td>
                  <td className="p-2 border">{branch.nameEn || '—'}</td>
                  <td className="p-2 border">{branch.code}</td>
                  <td className="p-2 border">{branch.company?.name || '—'}</td>
                  <td className="p-2 border">{new Date(branch.createdAt).toLocaleDateString('ar')}</td>
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm ml-2 hover:bg-yellow-600"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}