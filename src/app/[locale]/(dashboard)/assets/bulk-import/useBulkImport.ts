// src/app/[locale]/(dashboard)/assets/bulk-import/useBulkImport.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { Building, Floor, Room, AssetStatus, AssetType } from '@/types/assets';
import { BulkAssetRow } from './bulkImport.types';
import { generateId } from './generateId';

// =======================================================
// 1. دوال مساعدة (normalization, parseDate)
// =======================================================

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

function parseDate(value: string): string {
  if (!value || value.trim() === '') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const parts = value.trim().split(/[\/\-.]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (d > 12) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (m > 12) {
      return `${y}-${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
    }
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return '';
}

// =======================================================
// 2. الهوك الرئيسي
// =======================================================

export function useBulkImport() {
  const { data: session } = useSession();
  const locale = useLocale();

  // ---------- الحالة: الموقع ----------
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
  const [locationError, setLocationError] = useState<string | null>(null);

  // ---------- الحالة: الأنواع والحالات ----------
  const [types, setTypes] = useState<AssetType[]>([]);
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [loadingTypesStatuses, setLoadingTypesStatuses] = useState(true);

  // ---------- الحالة: صفوف الأصول ----------
  const [rows, setRows] = useState<BulkAssetRow[]>([
    {
      id: generateId(),
      name: '',
      nameEn: '',
      description: '',
      typeId: '',
      statusId: '',
      purchaseDate: '',
      operationDate: '',
      warrantyEnd: '',
      lastMaintenanceDate: '',
      serialNumber: '',
      manufacturer: '',
      model: '',
      supplier: '',
      notes: '',
    },
  ]);

  // ---------- الحالة: CSV ----------
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // ---------- الحالة: التقديم ----------
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    successCount: number;
    failCount: number;
    errors: any[];
  } | null>(null);

  // =======================================================
  // 3. تأثيرات جلب البيانات (useEffect)
  // =======================================================

  // جلب المباني
  useEffect(() => {
    if (!session?.user?.companyId) {
      setLocationError('لا توجد شركة مرتبطة بالمستخدم');
      return;
    }

    const fetchBuildings = async () => {
      setLoadingBuildings(true);
      setLocationError(null);
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
        setLocationError(err.message);
        toast.error(err.message);
        setRawBuildings([]);
        setBuildings([]);
      } finally {
        setLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, [session]);

  // جلب الأدوار
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

  // جلب الغرف
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

  // جلب الأنواع والحالات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, statusesRes] = await Promise.all([
          fetch(`/api/asset-types?locale=${locale}`),
          fetch(`/api/asset-statuses?locale=${locale}`),
        ]);
        if (typesRes.ok) setTypes(await typesRes.json());
        if (statusesRes.ok) setStatuses(await statusesRes.json());
      } catch (err) {
        toast.error('Failed to load types/statuses');
      } finally {
        setLoadingTypesStatuses(false);
      }
    };
    fetchData();
  }, [locale]);

  // =======================================================
  // 4. دوال الموقع
  // =======================================================

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

  // =======================================================
  // 5. دوال صفوف الأصول
  // =======================================================

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: generateId(),
        name: '',
        nameEn: '',
        description: '',
        typeId: '',
        statusId: '',
        purchaseDate: '',
        operationDate: '',
        warrantyEnd: '',
        lastMaintenanceDate: '',
        serialNumber: '',
        manufacturer: '',
        model: '',
        supplier: '',
        notes: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows(prev => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateRow = (index: number, field: keyof BulkAssetRow, value: string) => {
    setRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const setRowsFromCSV = (newRows: BulkAssetRow[]) => {
    if (newRows.length) setRows(newRows);
  };

  // =======================================================
  // 6. دوال CSV
  // =======================================================

  const processCSVFile = async (file: File) => {
    setCsvLoading(true);
    setCsvError(null);

    try {
      const buffer = await file.arrayBuffer();
      let text = '';
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder('windows-1256').decode(buffer);
      }

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data as any[];
          const validatedRows: BulkAssetRow[] = [];
          const errors: string[] = [];

          rawData.forEach((row, idx) => {
            const normalizedRow = { ...row };
            const dateFields = ['purchaseDate', 'operationDate', 'warrantyEnd', 'lastMaintenanceDate'];
            for (const field of dateFields) {
              if (normalizedRow[field]) {
                normalizedRow[field] = parseDate(normalizedRow[field].toString());
              }
            }

            const name = normalizedRow.name?.trim() || '';
            const typeId = normalizedRow.typeId || normalizedRow.type || '';
            if (name && typeId) {
              validatedRows.push({
                id: generateId(),
                name,
                nameEn: normalizedRow.nameEn?.trim() || '',
                description: normalizedRow.description?.trim() || '',
                typeId,
                statusId: normalizedRow.statusId || normalizedRow.status || '',
                purchaseDate: normalizedRow.purchaseDate || '',
                operationDate: normalizedRow.operationDate || '',
                warrantyEnd: normalizedRow.warrantyEnd || '',
                lastMaintenanceDate: normalizedRow.lastMaintenanceDate || '',
                serialNumber: normalizedRow.serialNumber?.trim() || '',
                manufacturer: normalizedRow.manufacturer?.trim() || '',
                model: normalizedRow.model?.trim() || '',
                supplier: normalizedRow.supplier?.trim() || '',
                notes: normalizedRow.notes?.trim() || '',
              });
            } else {
              errors.push(`Row ${idx + 1}: missing name or type`);
            }
          });

          if (validatedRows.length === 0) {
            toast.error('No valid rows found in CSV');
            setCsvError('No valid rows');
          } else {
            toast.success(`Imported ${validatedRows.length} rows (${errors.length} skipped)`);
            if (errors.length > 0) {
              console.warn('CSV validation errors:', errors);
            }
            setRowsFromCSV(validatedRows);
          }
          setCsvLoading(false);
        },
        error: (err: any) => {
          toast.error('Failed to parse CSV');
          setCsvError(err.message);
          setCsvLoading(false);
        },
      });
    } catch (err: any) {
      toast.error('Failed to read file');
      setCsvError(err.message);
      setCsvLoading(false);
    }
  };

  const uploadFile = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [{ description: 'CSV files', accept: { 'text/csv': ['.csv'] } }],
          multiple: false,
        });
        const file = await fileHandle.getFile();
        processCSVFile(file);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('File selection failed');
        }
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) processCSVFile(file);
      };
      input.click();
    }
  };

  // =======================================================
  // 7. دالة التقديم
  // =======================================================

  const submit = async () => {
    if (!selectedRoomId) {
      toast.error('الرجاء اختيار غرفة أولاً');
      return;
    }

    const invalidRows = rows.filter((row) => !row.name.trim() || !row.typeId);
    if (invalidRows.length > 0) {
      toast.error('جميع الصفوف يجب أن تحتوي على اسم ونوع');
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const payload = {
        roomId: selectedRoomId,
        assets: rows.map((row) => ({
          name: row.name.trim(),
          nameEn: row.nameEn?.trim() || null,
          description: row.description?.trim() || null,
          typeId: row.typeId,
          statusId: row.statusId || null,
          purchaseDate: row.purchaseDate || null,
          operationDate: row.operationDate || null,
          warrantyEnd: row.warrantyEnd || null,
          lastMaintenanceDate: row.lastMaintenanceDate || null,
          serialNumber: row.serialNumber?.trim() || null,
          manufacturer: row.manufacturer?.trim() || null,
          model: row.model?.trim() || null,
          supplier: row.supplier?.trim() || null,
          notes: row.notes?.trim() || null,
        })),
      };

      const res = await fetch("/api/assets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitResult({
          successCount: data.successCount || 0,
          failCount: data.failCount || 0,
          errors: data.errors || [],
        });
        toast.success(`تم استيراد ${data.successCount} أصل بنجاح`);
        if (data.failCount > 0) {
          toast.warning(`فشل استيراد ${data.failCount} أصل`);
        }
      } else {
        toast.error(data.error || 'حدث خطأ أثناء التقديم');
        setSubmitResult({
          successCount: 0,
          failCount: rows.length,
          errors: [{ message: data.error || 'خطأ غير معروف' }],
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('خطأ في الاتصال بالخادم');
      setSubmitResult({
        successCount: 0,
        failCount: rows.length,
        errors: [{ message: 'فشل الاتصال' }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =======================================================
  // 8. القيم المُرجعة (مع كائن location)
  // =======================================================

  const isLoading = loadingBuildings || loadingFloors || loadingRooms || loadingTypesStatuses;

  return {
    // كائن الموقع لتمريره إلى LocationSelector
    location: {
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
      handleBuildingChange,
      handleFloorChange,
      handleRoomChange,
    },
    locationError,

    // الأنواع والحالات
    types,
    statuses,

    // صفوف الأصول
    rows,
    addRow,
    removeRow,
    updateRow,

    // CSV
    csvLoading,
    csvError,
    uploadFile,
    processCSVFile,

    // التقديم
    submit,
    submitting,
    submitResult,

    // عام
    isLoading,
  };
}