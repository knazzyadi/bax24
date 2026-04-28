"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Asset {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
}

interface AssetMultiSelectorProps {
  branchId: string;
  roomId: string;
  assetTypeId?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export function AssetMultiSelector({ branchId, roomId, assetTypeId, value, onChange }: AssetMultiSelectorProps) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const locale = useLocale();
  const isRtl = locale === "ar";

  useEffect(() => {
    if (!roomId) {
      setAssets([]);
      return;
    }
    const fetchAssets = async () => {
      setLoading(true);
      try {
        let url = `/api/assets?roomId=${roomId}`;
        if (assetTypeId) url += `&typeId=${assetTypeId}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [roomId, assetTypeId]);

  const toggleAsset = (assetId: string) => {
    if (value.includes(assetId)) {
      onChange(value.filter(id => id !== assetId));
    } else {
      onChange([...value, assetId]);
    }
  };

  const removeAsset = (assetId: string) => {
    onChange(value.filter(id => id !== assetId));
  };

  const selectedAssets = assets.filter(a => value.includes(a.id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-14 rounded-2xl">
            {value.length === 0 ? (isRtl ? "اختر الأصول" : "Select assets") : `${value.length} ${isRtl ? "أصل" : "assets"} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={isRtl ? "بحث..." : "Search..."} />
            <CommandEmpty>{isRtl ? "لا توجد أصول" : "No assets found"}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {assets.map(asset => (
                <CommandItem key={asset.id} value={asset.id} onSelect={() => toggleAsset(asset.id)}>
                  <Check className={cn("mr-2 h-4 w-4", value.includes(asset.id) ? "opacity-100" : "opacity-0")} />
                  {isRtl ? asset.name : (asset.nameEn || asset.name)} ({asset.code})
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedAssets.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedAssets.map(asset => (
            <Badge key={asset.id} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
              {isRtl ? asset.name : (asset.nameEn || asset.name)}
              <button onClick={() => removeAsset(asset.id)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}