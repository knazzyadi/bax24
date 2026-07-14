// src/hooks/useSettingsData.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseSettingsDataOptions<T> {
  apiEndpoint: string;
  locale: string;
  initialData?: T[];
}

export function useSettingsData<T extends { id: string }>({
  apiEndpoint,
  locale,
  initialData = [],
}: UseSettingsDataOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiEndpoint}?locale=${locale}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `فشل تحميل البيانات (${res.status})`);
      }

      const result = await res.json();
      setData(Array.isArray(result) ? result : result.data || []);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message);
      toast.error(err.message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [apiEndpoint, locale]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch, setData };
}