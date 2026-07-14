// src/app/[locale]/(dashboard)/users/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminGuard } from '@/lib/client-guard';
import { useUsers } from './hooks/useUsers';
import { UsersHeader } from './components/UsersHeader';
import { UsersTable } from './components/UsersTable';
import { UserFormDialog } from './components/UserFormDialog';
import { UserDeleteDialog } from './components/UserDeleteDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';

function UsersPageContent() {
  const params = useParams();
  const locale = params?.locale as string;
  const isRtl = locale === 'ar';

  const {
    users,
    total,
    totalPages,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    changePage,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resendInvite,
  } = useUsers();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [branches] = useState<any[]>([]);
  const [roles] = useState<any[]>([
    { id: 'BRANCH_MANAGER', name: 'BRANCH_MANAGER', label: isRtl ? 'مدير فرع' : 'Branch Manager' },
    { id: 'TECHNICIAN', name: 'TECHNICIAN', label: isRtl ? 'فني' : 'Technician' },
  ]);

  const handleAdd = () => {
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setDeletingId(id);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteUser(deletingId);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleSave = async (data: any) => {
    if (editingUser) {
      await updateUser(editingUser.id, data);
    } else {
      await createUser(data);
    }
  };

  if (isLoading) {
    return (
      <div className="relative space-y-8 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <UsersHeader onAdd={handleAdd} isRtl={isRtl} />

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm p-4">
        <UsersTable
          users={users}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={toggleUserStatus}
          onResendInvite={resendInvite}
          isRtl={isRtl}
        />

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              onPageChange={changePage}
              isRtl={isRtl}
            />
          </div>
        )}
      </div>

      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        editingUser={editingUser}
        branches={branches}
        roles={roles}
        onSave={handleSave}
        isSaving={isSaving}
        isRtl={isRtl}
      />

      <UserDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userName={users.find((u) => u.id === deletingId)?.name || ''}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        isRtl={isRtl}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminGuard>
      <UsersPageContent />
    </AdminGuard>
  );
}