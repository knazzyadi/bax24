// src/app/[locale]/(super-admin)/super-admin/branches/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { useBranches } from './hooks/useBranches';
import { BranchToolbar } from './components/BranchToolbar';
import { BranchTable } from './components/BranchTable';
import { BranchDialog } from './components/BranchDialog';
import { DeleteBranchDialog } from './components/DeleteBranchDialog';
import { Branch, BranchFormData } from './types';

export default function BranchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    branches,
    companies,
    isLoading,
    isSaving,
    isDeleting,
    createBranch,
    updateBranch,
    deleteBranch,
  } = useBranches();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/ar/login');
    if (session?.user?.role !== 'SUPER_ADMIN') router.push('/ar/dashboard');
  }, [session, status, router]);

  const handleAdd = () => {
    setEditingBranch(null);
    setDialogOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const branch = branches.find((b) => b.id === id);
    if (!branch) return;
    setDeletingId(id);
    setDeletingName(branch.name);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (data: BranchFormData) => {
    if (editingBranch) {
      return updateBranch(editingBranch.id, data);
    } else {
      return createBranch(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteBranch(deletingId);
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setDeletingName('');
  };

  const copyPublicLink = (branch: Branch) => {
    if (!branch.slug || !branch.publicToken) {
      toast.error('هذا الفرع لا يدعم الروابط العامة');
      return;
    }
    const url = `${window.location.origin}/ar/tickets/public/${branch.slug}/${branch.publicToken}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ رابط تقديم البلاغات العامة');
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
      <BranchToolbar onAdd={handleAdd} total={branches.length} />

      {/* الجدول */}
      <BranchTable
        branches={branches}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onCopyLink={copyPublicLink}
      />

      {/* حوار الإضافة / التعديل */}
      <BranchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingBranch={editingBranch}
        companies={companies}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* حوار تأكيد الحذف */}
      <DeleteBranchDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        branchName={deletingName}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}