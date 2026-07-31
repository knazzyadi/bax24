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
        const errorData: { error?: string } = await res
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error ?? `فشل تحميل البيانات (${res.status})`,
        );
      }

      const result: unknown = await res.json();

      if (
        typeof result === "object" &&
        result !== null &&
        "data" in result &&
        Array.isArray((result as { data: T[] }).data)
      ) {
        setData((result as { data: T[] }).data);
      } else if (Array.isArray(result)) {
        setData(result as T[]);
      } else {
        setData([]);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      const message =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع";

      setError(message);
      toast.error(message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [apiEndpoint, locale]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    setData,
  };
}