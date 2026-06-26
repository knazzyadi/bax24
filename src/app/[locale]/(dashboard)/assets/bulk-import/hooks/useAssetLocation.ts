// hooks/useAssetLocation.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Building, Floor, Room } from '@/types/assets';
import { toast } from 'sonner';

// دالة مساعدة لتطبيع nameEn: تحويل null إلى undefined
const normalizeBuilding = (b: Building): Building & { nameEn?: string } => ({
  ...b,
  nameEn: b.nameEn ?? undefined,
});

const normalizeFloor = (f: Floor): Floor & { nameEn?: string } => ({
  ...f,
  nameEn: f.nameEn ?? undefined,
});

const normalizeRoom = (r: Room): Room & { nameEn?: string } => ({
  ...r,
  nameEn: r.nameEn ?? undefined,
});

export function useAssetLocation() {
  const { data: session } = useSession();
  const [rawBuildings, setRawBuildings] = useState<Building[]>([]);
  const [rawFloors, setRawFloors] = useState<Floor[]>([]);
  const [rawRooms, setRawRooms] = useState<Room[]>([]);

  const [buildings, setBuildings] = useState<(Building & { nameEn?: string })[]>([]);
  const [floors, setFloors] = useState<(Floor & { nameEn?: string })[]>([]);
  const [rooms, setRooms] = useState<(Room & { nameEn?: string })[]>([]);

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedRoomCode, setSelectedRoomCode] = useState('');
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب المباني (مع إضافة companyId من الجلسة)
  useEffect(() => {
    if (!session?.user?.companyId) {
      setError('لا توجد شركة مرتبطة بالمستخدم');
      return;
    }

    const fetchBuildings = async () => {
      setLoadingBuildings(true);
      setError(null);
      try {
        const res = await fetch(`/api/buildings?companyId=${session.user.companyId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'فشل تحميل المباني');
        }
        const data = await res.json();
        setRawBuildings(data);
        setBuildings(data.map(normalizeBuilding));
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
        setRawBuildings([]);
        setBuildings([]);
      } finally {
        setLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, [session]);

  // جلب الأدوار عند تغيير المبنى
  useEffect(() => {
    if (!selectedBuildingId) {
      setRawFloors([]);
      setFloors([]);
      return;
    }
    setLoadingFloors(true);
    fetch(`/api/buildings/${selectedBuildingId}/floors`)
      .then(res => {
        if (!res.ok) throw new Error('فشل تحميل الأدوار');
        return res.json();
      })
      .then(data => {
        setRawFloors(data);
        setFloors(data.map(normalizeFloor));
      })
      .catch(err => {
        toast.error(err.message);
        setRawFloors([]);
        setFloors([]);
      })
      .finally(() => setLoadingFloors(false));
  }, [selectedBuildingId]);

  // جلب الغرف عند تغيير الدور
  useEffect(() => {
    if (!selectedFloorId) {
      setRawRooms([]);
      setRooms([]);
      setSelectedRoomCode('');
      setSelectedRoomName('');
      return;
    }
    setLoadingRooms(true);
    fetch(`/api/floors/${selectedFloorId}/rooms`)
      .then(res => {
        if (!res.ok) throw new Error('فشل تحميل الغرف');
        return res.json();
      })
      .then(data => {
        const building = rawBuildings.find(b => b.id === selectedBuildingId);
        const floor = rawFloors.find(f => f.id === selectedFloorId);
        const roomsWithCode = data.map((room: any) => ({
          ...room,
          nameEn: room.nameEn ?? undefined,
          fullCode: `${building?.code || ''}-${floor?.code || ''}-${room.code || ''}`,
        }));
        setRawRooms(roomsWithCode);
        setRooms(roomsWithCode.map(normalizeRoom));
      })
      .catch(err => {
        toast.error(err.message);
        setRawRooms([]);
        setRooms([]);
      })
      .finally(() => setLoadingRooms(false));
  }, [selectedFloorId, selectedBuildingId, rawBuildings, rawFloors]);

  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedFloorId('');
    setSelectedRoomId('');
    setSelectedRoomCode('');
    setSelectedRoomName('');
  };

  const handleFloorChange = (id: string) => {
    setSelectedFloorId(id);
    setSelectedRoomId('');
    setSelectedRoomCode('');
    setSelectedRoomName('');
  };

  const handleRoomChange = (id: string) => {
    setSelectedRoomId(id);
    const room = rooms.find(r => r.id === id);
    setSelectedRoomCode(room?.fullCode || '');
    setSelectedRoomName(room?.name || '');
  };

  return {
    buildings,
    floors,
    rooms,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
    selectedRoomCode,
    selectedRoomName,
    loadingBuildings,
    loadingFloors,
    loadingRooms,
    error,
    handleBuildingChange,
    handleFloorChange,
    handleRoomChange,
  };
}