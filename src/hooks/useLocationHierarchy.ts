// src/hooks/useLocationHierarchy.ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  buildingId: string;
}

interface Room {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  floorId: string;
}

interface UseLocationHierarchyProps {
  slug: string;
  token: string;
  branchId?: string;
  isRtl: boolean;
}

export function useLocationHierarchy({
  slug,
  token,
  branchId,
  isRtl,
}: UseLocationHierarchyProps) {
  // State
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Fetch buildings when branchId changes
  const fetchBuildings = useCallback(async () => {
    if (!branchId) {
      setBuildings([]);
      return;
    }
    setLoadingBuildings(true);
    try {
      const res = await fetch(`/api/public/buildings?slug=${slug}&token=${token}&branchId=${branchId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBuildings(data);
    } catch {
      toast.error(isRtl ? "فشل تحميل المباني" : "Failed to load buildings");
    } finally {
      setLoadingBuildings(false);
    }
  }, [slug, token, branchId, isRtl]);

  // Fetch floors when buildingId changes
  const fetchFloors = useCallback(async () => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    setLoadingFloors(true);
    try {
      const res = await fetch(`/api/public/floors?slug=${slug}&token=${token}&buildingId=${buildingId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFloors(data);
    } catch {
      setFloors([]);
    } finally {
      setLoadingFloors(false);
    }
  }, [slug, token, buildingId]);

  // Fetch rooms when floorId changes
  const fetchRooms = useCallback(async () => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    setLoadingRooms(true);
    try {
      const res = await fetch(`/api/public/rooms?slug=${slug}&token=${token}&floorId=${floorId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRooms(data);
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [slug, token, floorId]);

  // Trigger fetches when dependencies change
  useEffect(() => {
    if (branchId) fetchBuildings();
  }, [branchId, fetchBuildings]);

  useEffect(() => {
    if (buildingId) fetchFloors();
    else setFloors([]);
  }, [buildingId, fetchFloors]);

  useEffect(() => {
    if (floorId) fetchRooms();
    else setRooms([]);
  }, [floorId, fetchRooms]);

  // Reset dependent floors and rooms when building changes
  const handleBuildingChange = (val: string) => {
    setBuildingId(val);
    setFloorId("");
    setRoomId("");
    setFloors([]);
    setRooms([]);
  };

  // Reset rooms when floor changes
  const handleFloorChange = (val: string) => {
    setFloorId(val);
    setRoomId("");
    setRooms([]);
  };

  const handleRoomChange = (val: string) => {
    setRoomId(val);
  };

  // ========== ✅ دالة إعادة تعيين الموقع بالكامل ==========
  const resetLocation = useCallback(() => {
    setBuildingId("");
    setFloorId("");
    setRoomId("");
    setBuildings([]);
    setFloors([]);
    setRooms([]);
    setLoadingBuildings(false);
    setLoadingFloors(false);
    setLoadingRooms(false);
  }, []);

  return {
    buildingId,
    floorId,
    roomId,
    buildings,
    floors,
    rooms,
    loadingBuildings,
    loadingFloors,
    loadingRooms,
    handleBuildingChange,
    handleFloorChange,
    handleRoomChange,
    setRoomId, // might be needed for manual reset
    resetLocation, // ✅ دالة إعادة التعيين الجديدة
  };
}