// hooks/useAssetLocation.ts
import { useState, useEffect } from 'react';
import type { Building, Floor, Room } from '@/types/assets';

// دالة مساعدة لتطبيع nameEn: تحويل null إلى undefined
const normalizeBuilding = (b: Building): Building & { nameEn?: string } => ({
  ...b,
  nameEn: b.nameEn ?? undefined, // null -> undefined
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
  const [rawBuildings, setRawBuildings] = useState<Building[]>([]);
  const [rawFloors, setRawFloors] = useState<Floor[]>([]);
  const [rawRooms, setRawRooms] = useState<Room[]>([]);
  
  // البيانات المطهرة (normalized) الجاهزة للمكونات
  const [buildings, setBuildings] = useState<(Building & { nameEn?: string })[]>([]);
  const [floors, setFloors] = useState<(Floor & { nameEn?: string })[]>([]);
  const [rooms, setRooms] = useState<(Room & { nameEn?: string })[]>([]);

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedRoomCode, setSelectedRoomCode] = useState('');
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // جلب المباني
  useEffect(() => {
    fetch('/api/buildings')
      .then(res => res.json())
      .then(data => {
        setRawBuildings(data);
        setBuildings(data.map(normalizeBuilding));
      })
      .catch(console.error);
  }, []);

  // جلب الأدوار عند تغيير المبنى
  useEffect(() => {
    if (!selectedBuildingId) {
      setRawFloors([]);
      setFloors([]);
      return;
    }
    setLoadingFloors(true);
    fetch(`/api/buildings/${selectedBuildingId}/floors`)
      .then(res => res.json())
      .then(data => {
        setRawFloors(data);
        setFloors(data.map(normalizeFloor));
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
      .then(res => res.json())
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
    loadingFloors,
    loadingRooms,
    handleBuildingChange,
    handleFloorChange,
    handleRoomChange,
  };
}