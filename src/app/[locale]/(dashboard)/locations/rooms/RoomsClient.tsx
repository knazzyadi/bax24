// src/app/[locale]/(dashboard)/locations/rooms/RoomsClient.tsx

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DoorOpen, Plus } from 'lucide-react';
import { useRooms } from './hooks/useRooms';
import { RoomForm } from './components/RoomForm';
import { RoomsTable } from './components/RoomsTable';
import { DeleteRoomDialog } from './components/DeleteRoomDialog';
import { Room as RoomType, Floor } from './types';

interface RoomsClientProps {
  initialRooms: RoomType[];
  initialFloors: Floor[];
  locale: string;
}

export default function RoomsClient({
  initialRooms,
  initialFloors,
  locale,
}: RoomsClientProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const {
    rooms,
    floors,
    buildings,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    createRoom,
    updateRoom,
    deleteRoom,
  } = useRooms(initialRooms, initialFloors);

  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  const handleAdd = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  const handleEdit = (room: RoomType) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    const room = rooms.find((r) => r.id === id);
    if (!room) return;
    setDeletingId(id);
    setDeletingName(room.name);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingRoom) {
      return updateRoom(editingRoom.id, data);
    } else {
      return createRoom(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteRoom(deletingId);
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setDeletingName('');
  };

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <DoorOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('rooms')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? 'إدارة الغرف وتنظيم المواقع حسب الأدوار والمباني'
                : 'Manage rooms and organize spaces by floors and buildings'}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addRoom')}
          </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <RoomForm
          editingRoom={editingRoom}
          floors={floors}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingRoom(null);
          }}
          isSaving={isSaving}
          locale={locale}
        />
      )}

      {/* جدول الغرف */}
      <RoomsTable
        rooms={rooms}
        floors={floors}
        buildings={buildings}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        search={filters.search}
        onSearchChange={(value) => updateFilters({ search: value })}
        floorFilter={filters.floorId}
        onFloorFilterChange={(value) => updateFilters({ floorId: value })}
        buildingFilter={filters.buildingId}
        onBuildingFilterChange={(value) => updateFilters({ buildingId: value })}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={(field) => {
          if (filters.sortBy === field) {
            updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
          } else {
            updateFilters({ sortBy: field as any, sortOrder: 'asc' });
          }
        }}
        isLoading={isLoading}
        locale={locale}
      />

      {/* حوار تأكيد الحذف */}
      <DeleteRoomDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        roomName={deletingName}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        locale={locale}
      />
    </div>
  );
}