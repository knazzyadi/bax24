// src/app/[locale]/(super-admin)/super-admin/companies/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

import { useCompanies } from './hooks/useCompanies';
import { CompanyToolbar } from './components/CompanyToolbar';
import { CompanyTable } from './components/CompanyTable';
import { CompanyDialog } from './components/CompanyDialog';
import { DeleteCompanyDialog } from './components/DeleteCompanyDialog';
import { Company, CompanyFormData } from './types';

export default function CompaniesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    companies,
    isLoading,
    isSaving,
    isDeleting,
    createCompany,
    updateCompany,
    toggleCompanyStatus,
    deleteCompany,
  } = useCompanies();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/ar/login');
    if (session?.user?.role !== 'SUPER_ADMIN') router.push('/ar/dashboard');
  }, [session, status, router]);

  const handleAdd = () => {
    setEditingCompany(null);
    setDialogOpen(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const company = companies.find((c) => c.id === id);
    if (!company) return;
    setDeletingId(id);
    setDeletingName(company.name);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (data: CompanyFormData) => {
    if (editingCompany) {
      return updateCompany(editingCompany.id, data);
    } else {
      return createCompany(data);
    }
  };

  const handleToggleStatus = async (id: string) => {
    await toggleCompanyStatus(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteCompany(deletingId);
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setDeletingName('');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-3 rounded-xl border bg-card p-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* شريط الأدوات */}
      <CompanyToolbar onAdd={handleAdd} total={companies.length} />

      {/* الجدول */}
      <CompanyTable
        companies={companies}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onToggleStatus={handleToggleStatus}
      />

      {/* حوار الإضافة / التعديل */}
      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCompany={editingCompany}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* حوار تأكيد الحذف */}
      <DeleteCompanyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        companyName={deletingName}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}