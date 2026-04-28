'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

import CompaniesTable from '@/components/super-admin/companies/CompaniesTable';
import AddCompanyModal from '@/components/super-admin/companies/AddCompanyModal';
import EditCompanyModal from '@/components/super-admin/companies/EditCompanyModal';

export default function CompaniesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);
  const [editCompany, setEditCompany] = useState<any>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/companies');
      const data = await res.json();
      // التأكد من أن البيانات مصفوفة
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else if (session?.user?.role !== 'SUPER_ADMIN') {
      router.push(`/${locale}/dashboard`);
    } else {
      fetchCompanies();
    }
  }, [status, session, router, locale, fetchCompanies]);

  const toggleStatus = useCallback(async (id: string, current: boolean) => {
    try {
      await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchCompanies();
    } catch (err) {
      console.error(err);
    }
  }, [fetchCompanies]);

  if (loading) return <p className="p-6">جاري التحميل...</p>;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة الشركات</h1>
        <button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          + إضافة شركة
        </button>
      </div>

      {/* Table */}
      <CompaniesTable
        companies={companies}
        onEdit={setEditCompany}
        onToggleStatus={toggleStatus}
      />

      {/* Modals */}
      <AddCompanyModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchCompanies}
      />

      <EditCompanyModal
        open={!!editCompany}
        company={editCompany}
        onClose={() => setEditCompany(null)}
        onSuccess={fetchCompanies}
      />
    </div>
  );
}