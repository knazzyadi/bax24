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
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // =========================
  // Buildings
  // =========================

  useEffect(() => {
    const controller = new AbortController();

    async function loadBuildings() {
      if (!branchId) {
        setBuildings([]);
        return;
      }

      try {
        setLoadingBuildings(true);

        const response = await fetch(
          `/api/public/buildings?slug=${slug}&token=${token}&branchId=${branchId}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Building[] = await response.json();

        setBuildings(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setBuildings([]);
          toast.error(
            isRtl
              ? "فشل تحميل المباني"
              : "Failed to load buildings"
          );
        }
      } finally {
        setLoadingBuildings(false);
      }
    }

    queueMicrotask(() => {
      void loadBuildings();
    });

    return () => {
      controller.abort();
    };
  }, [slug, token, branchId, isRtl]);

  // =========================
  // Floors
  // =========================

  useEffect(() => {
    const controller = new AbortController();

    async function loadFloors() {
      if (!buildingId) {
        setFloors([]);
        return;
      }

      try {
        setLoadingFloors(true);

        const response = await fetch(
          `/api/public/floors?slug=${slug}&token=${token}&buildingId=${buildingId}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Floor[] = await response.json();

        setFloors(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setFloors([]);
        }
      } finally {
        setLoadingFloors(false);
      }
    }

    queueMicrotask(() => {
      void loadFloors();
    });

    return () => {
      controller.abort();
    };
  }, [slug, token, buildingId]);

  // =========================
  // Rooms
  // =========================

  useEffect(() => {
    const controller = new AbortController();

    async function loadRooms() {
      if (!floorId) {
        setRooms([]);
        return;
      }

      try {
        setLoadingRooms(true);

        const response = await fetch(
          `/api/public/rooms?slug=${slug}&token=${token}&floorId=${floorId}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Room[] = await response.json();

        setRooms(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setRooms([]);
        }
      } finally {
        setLoadingRooms(false);
      }
    }

    queueMicrotask(() => {
      void loadRooms();
    });

    return () => {
      controller.abort();
    };
  }, [slug, token, floorId]);

  // =========================
  // Handlers
  // =========================

  const handleBuildingChange = useCallback((value: string) => {
    setBuildingId(value);
    setFloorId("");
    setRoomId("");
    setFloors([]);
    setRooms([]);
  }, []);

  const handleFloorChange = useCallback((value: string) => {
    setFloorId(value);
    setRoomId("");
    setRooms([]);
  }, []);

  const handleRoomChange = useCallback((value: string) => {
    setRoomId(value);
  }, []);

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

    setRoomId,
    resetLocation,
  };
}