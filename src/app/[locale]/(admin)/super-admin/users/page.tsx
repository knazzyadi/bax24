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

  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);

  // 🎯 جلب المستخدمين (مع فلاتر)
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

  // 🎯 جلب الشركات والأدوار مرة واحدة فقط
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

  // 🎯 تغيير حالة المستخدم
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

  if (status === 'loading') return <div className="p-6">جاري التحميل...</div>;
  if (!session || session.user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">المستخدمين</h1>
      </div>

      {/* Message */}
      {message && (
        <div className="p-2 rounded bg-green-100 text-green-700">
          {message.text}
        </div>
      )}

      {/* Filters */}
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
            <option key={r.id} value={r.name}>
              {r.label || r.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchUsers}
          className="bg-indigo-600 text-white px-3 rounded"
        >
          بحث
        </button>
      </div>

      {/* Table */}
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
                <th>الإجراء</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b">
                  <td>{i + 1}</td>
                  <td>{u.name || '-'}</td>
                  <td>{u.email}</td>
                  <td>{u.role?.label || u.role?.name}</td>
                  <td>{u.company?.name}</td>

                  <td>
                    <span
                      className={
                        u.status ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {u.status ? 'نشط' : 'معطل'}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => toggleUserStatus(u.id, u.status)}
                      className="text-sm text-indigo-600"
                    >
                      تغيير
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