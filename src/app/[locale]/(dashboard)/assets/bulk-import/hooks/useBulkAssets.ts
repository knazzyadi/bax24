// hooks/useBulkAssets.ts
import { useState, useCallback } from 'react';
import { BulkAssetRow } from '../types/bulkImport.types';
import { generateId } from '../utils/generateId';

export function useBulkAssets(initialRows?: BulkAssetRow[]) {
  const [rows, setRows] = useState<BulkAssetRow[]>(
    initialRows ?? [
      {
        id: generateId(),
        name: '',
        nameEn: '',
        description: '',      // ✅ وصف عربي
        descriptionEn: '',    // ✅ وصف إنجليزي
        typeId: '',
        statusId: '',
        purchaseDate: '',
        warrantyEnd: '',
        lastMaintenanceDate: '',
        notes: '',
      },
    ]
  );

  const addRow = useCallback(() => {
    setRows(prev => [
      ...prev,
      {
        id: generateId(),
        name: '',
        nameEn: '',
        description: '',      // ✅ وصف عربي
        descriptionEn: '',    // ✅ وصف إنجليزي
        typeId: '',
        statusId: '',
        purchaseDate: '',
        warrantyEnd: '',
        lastMaintenanceDate: '',
        notes: '',
      },
    ]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows(prev => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateRow = useCallback((index: number, field: keyof BulkAssetRow, value: string) => {
    setRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  }, []);

  const setRowsFromCSV = useCallback((newRows: BulkAssetRow[]) => {
    if (newRows.length) setRows(newRows);
  }, []);

  return { rows, addRow, removeRow, updateRow, setRowsFromCSV };
}