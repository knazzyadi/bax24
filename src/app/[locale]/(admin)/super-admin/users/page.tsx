'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: { name: string; label: string | null } | null;
  company: { name: string } | null;
  status: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [companies, setCompanies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    roleId: '',
    companyId: '',
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحميل المستخدمين');
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [c, r] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/roles'),
      ]);
      if (c.ok) setCompanies(await c.json());
      if (r.ok) setRoles(await r.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
      return;
    }
    if (session?.user?.role !== 'SUPER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
    fetchUsers();
    fetchMeta();
  }, [status]);

  const toggleUserStatus = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !current }),
      });
      if (!res.ok) throw new Error('فشل التحديث');
      await fetchUsers();
      setMessage({
        type: 'success',
        text: `تم ${!current ? 'تفعيل' : 'تعطيل'} المستخدم`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError('');
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الدعوة');
      setMessage({ type: 'success', text: 'تم إرسال الدعوة بنجاح' });
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', roleId: '', companyId: '' });
      fetchUsers();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const resendInvite = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/resend-invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'تم إعادة إرسال الدعوة بنجاح' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (status === 'loading') return <div className="p-6">جاري التحميل...</div>;
  if (!session || session.user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">المستخدمين</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + إضافة مستخدم
        </button>
      </div>

      {message && (
        <div className={`p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..."
          className="border p-2 rounded"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">كل الأدوار</option>
          {roles.map((r: any) => (
            <option key={r.id} value={r.name}>{r.label || r.name}</option>
          ))}
        </select>
        <button onClick={fetchUsers} className="bg-indigo-600 text-white px-3 rounded">
          بحث
        </button>
      </div>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="border-b text-right">
                <th>#</th>
                <th>الاسم</th>
                <th>الإيميل</th>
                <th>الدور</th>
                <th>الشركة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b">
                  <td>{i + 1}</td>
                  <td>{u.name || '-'}</td>
                  <td>{u.email}</td>
                  <td>{u.role?.label || u.role?.name}</td>
                  <td>{u.company?.name || '-'}</td>
                  <td>
                    <span className={u.status ? 'text-green-600' : 'text-red-600'}>
                      {u.status ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="space-x-2">
                    <button
                      onClick={() => toggleUserStatus(u.id, u.status)}
                      className="text-sm text-indigo-600"
                    >
                      تغيير الحالة
                    </button>
                    {u.role?.name !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => resendInvite(u.id)}
                        className="text-sm text-green-600"
                      >
                        إعادة إرسال الدعوة
                      </button>
                    )}
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">إضافة مستخدم جديد</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الدور *</label>
                <select
                  required
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-gray-900"
                >
                  <option value="">اختر دور</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.label || role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الشركة *</label>
                <select
                  required
                  value={inviteForm.companyId}
                  onChange={(e) => setInviteForm({ ...inviteForm, companyId: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-gray-900"
                >
                  <option value="">اختر شركة</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              {inviteError && <div className="text-red-600 text-sm">{inviteError}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 border rounded-md">إلغاء</button>
                <button type="submit" disabled={inviting} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                  {inviting ? 'جاري الإرسال...' : 'إرسال الدعوة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}