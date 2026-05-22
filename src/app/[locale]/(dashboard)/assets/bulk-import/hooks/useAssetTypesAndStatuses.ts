import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import type { AssetStatus, AssetType } from '@/types/assets';

export function useAssetTypesAndStatuses() {
  const locale = useLocale();
  const [types, setTypes] = useState<AssetType[]>([]);
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };
    fetchData();
  }, [locale]);

  return { types, statuses, loading };
}