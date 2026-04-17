'use client';

import { useEffect, useState } from 'react';
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

  const fetchCompanies = async () => {
    setLoading(true);
    const res = await fetch('/api/companies');
    const data = await res.json();
    setCompanies(data);
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else if (session?.user?.role !== 'SUPER_ADMIN') {
      router.push(`/${locale}/dashboard`);
    } else {
      fetchCompanies();
    }
  }, [status]);

  const toggleStatus = async (id: string, current: boolean) => {
    await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });

    fetchCompanies();
  };

  if (loading) return <p className="p-6">جاري التحميل...</p>;

  return (
    <div className="p-6 space-y-4">

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">إدارة الشركات</h1>

        <button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
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