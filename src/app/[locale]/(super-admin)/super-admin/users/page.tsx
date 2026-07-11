// src/app/[locale]/(super-admin)/super-admin/users/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UsersToolbar } from './components/UsersToolbar';
import { UsersTable } from './components/UsersTable';
import { UserDialog } from './components/UserDialog';
import { DeleteUserDialog } from './components/DeleteUserDialog';
import { useUsers } from './hooks/useUsers';
import { User, UserFormData } from './types';

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    users,
    companies,
    roles,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    createUser,
    updateUser,
    toggleUserStatus,
    resendInvite,
    deleteUser,
  } = useUsers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/ar/login');
    if (session?.user?.role !== 'SUPER_ADMIN') router.push('/ar/dashboard');
  }, [session, status, router]);

  const handleAdd = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setDeletingId(id);
    setDeletingName(user.name || user.email);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (data: UserFormData) => {
    if (editingUser) {
      return updateUser(editingUser.id, data);
    } else {
      return createUser(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteUser(deletingId);
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
      {/* شريط الأدوات مع الفلاتر */}
      <div className="space-y-4">
        <UsersToolbar
          onAdd={handleAdd}
          search={filters.search}
          onSearchChange={(value) => updateFilters({ search: value })}
          filterRole={filters.role}
          onRoleChange={(value) => updateFilters({ role: value })}
          filterCompany={filters.companyId}
          onCompanyChange={(value) => updateFilters({ companyId: value })}
          roles={roles}
          companies={companies}
          total={users.length}
        />

        {/* حقل البحث والفلاتر */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="بحث بالاسم أو البريد..."
              className="pr-9 p-2 border border-border rounded-lg bg-background w-full h-10"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => updateFilters({ role: e.target.value })}
            className="p-2 border border-border rounded-lg bg-background h-10"
          >
            <option value="">كل الأدوار</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>{r.label || r.name}</option>
            ))}
          </select>
          <select
            value={filters.companyId}
            onChange={(e) => updateFilters({ companyId: e.target.value })}
            className="p-2 border border-border rounded-lg bg-background h-10"
          >
            <option value="">كل الشركات</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button
            onClick={() => {
              updateFilters({ search: '', role: '', companyId: '' });
            }}
            variant="outline"
            className="h-10"
          >
            إعادة تعيين
          </Button>
        </div>
      </div>

      {/* الجدول */}
      <UsersTable
        users={users}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onToggleStatus={toggleUserStatus}
        onResendInvite={resendInvite}
      />

      {/* حوار الإضافة / التعديل */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        roles={roles}
        companies={companies}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* حوار تأكيد الحذف */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userName={deletingName}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}