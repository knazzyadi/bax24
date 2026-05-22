import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { AssetRowSchema, BulkAssetRow } from '../types/bulkImport.types';
import { generateId } from '../utils/generateId';

export function useCsvImporter(onSuccess: (rows: BulkAssetRow[]) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processCSVFile = useCallback(
    (file: File) => {
      setIsLoading(true);
      setError(null);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data as any[];
          const validatedRows: BulkAssetRow[] = [];
          const errors: string[] = [];

          rawData.forEach((row, idx) => {
            // تطبيع التواريخ: محاولة تحويل أي صيغة إلى YYYY-MM-DD
            const normalizedRow = { ...row };
            const dateFields = ['purchaseDate', 'warrantyEnd', 'lastMaintenanceDate'];
            for (const field of dateFields) {
              if (normalizedRow[field]) {
                const date = new Date(normalizedRow[field]);
                if (!isNaN(date.getTime())) {
                  normalizedRow[field] = date.toISOString().split('T')[0];
                } else {
                  normalizedRow[field] = ''; // سيسبب فشل التحقق
                }
              }
            }

            const parseResult = AssetRowSchema.safeParse({
              name: normalizedRow.name,
              nameEn: normalizedRow.nameEn,
              typeId: normalizedRow.typeId,
              statusId: normalizedRow.statusId,
              purchaseDate: normalizedRow.purchaseDate,
              warrantyEnd: normalizedRow.warrantyEnd,
              lastMaintenanceDate: normalizedRow.lastMaintenanceDate,
              notes: normalizedRow.notes,
            });
            
            if (parseResult.success) {
              validatedRows.push({
                id: generateId(),
                ...parseResult.data,
              });
            } else {
              const zodError = parseResult.error;
              let errorMessage = 'Invalid data';
              
              if ('issues' in zodError && zodError.issues.length > 0) {
                const issue = zodError.issues[0];
                const field = issue.path.join('.');
                errorMessage = field ? `${field}: ${issue.message}` : issue.message;
              } else if ('errors' in zodError && (zodError as any).errors.length > 0) {
                const err = (zodError as any).errors[0];
                const field = err.path?.join('.') || '';
                errorMessage = field ? `${field}: ${err.message}` : err.message;
              }
              
              errors.push(`Row ${idx + 1}: ${errorMessage}`);
            }
          });

          if (validatedRows.length === 0) {
            toast.error('No valid rows found in CSV');
            setError('No valid rows');
          } else {
            toast.success(`Imported ${validatedRows.length} rows (${errors.length} skipped)`);
            if (errors.length > 0) {
              console.warn('CSV validation errors:', errors);
            }
            onSuccess(validatedRows);
          }
          setIsLoading(false);
        },
        error: (err) => {
          toast.error('Failed to parse CSV');
          setError(err.message);
          setIsLoading(false);
        },
      });
    },
    [onSuccess]
  );

  const uploadFile = useCallback(async () => {
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
  }, [processCSVFile]);

  return { uploadFile, isLoading, error };
}