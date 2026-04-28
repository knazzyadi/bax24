// src/app/[locale]/(dashboard)/inventory/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Plus, Package, Hash, BarChart3, 
  Banknote, FileText, Loader2, Save, Info, ShieldCheck, MapPin
} from "lucide-react";

import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { LocationSelector, type LocationValue } from "@/components/shared/LocationSelector";
import type { Building, Floor, Room } from "@/types/assets";

export default function NewInventoryPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Inventory");
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    quantity: "0",
    minQuantity: "5",
    unitPrice: "",
    roomId: "",
    notes: "",
  });

  const [selectedRoomFullCode, setSelectedRoomFullCode] = useState("");
  const [selectedRoomName, setSelectedRoomName] = useState("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    fetch("/api/buildings")
      .then(res => res.json())
      .then(setBuildings);
  }, []);

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");

  const handleLocationChange = (location: LocationValue) => {
    setSelectedBuildingId(location.buildingId);
    setSelectedFloorId(location.floorId);
    setFormData(prev => ({ ...prev, roomId: location.roomId }));
  };

  useEffect(() => {
    if (!formData.roomId) {
      setSelectedRoomFullCode("");
      setSelectedRoomName("");
      return;
    }
    const fetchRoomDetails = async () => {
      try {
        const res = await fetch(`/api/rooms/${formData.roomId}`);
        if (res.ok) {
          const roomData = await res.json();
          const buildingCode = roomData.floor?.building?.code || "";
          const floorCode = roomData.floor?.code || "";
          const roomCode = roomData.code || "";
          const fullCode = `${buildingCode}-${floorCode}-${roomCode}`;
          setSelectedRoomFullCode(fullCode);
          setSelectedRoomName(isRtl ? roomData.name : (roomData.nameEn || roomData.name));
        } else {
          const building = buildings.find(b => b.id === selectedBuildingId);
          const floor = floors.find(f => f.id === selectedFloorId);
          const room = rooms.find(r => r.id === formData.roomId);
          const buildingCode = building?.code || "";
          const floorCode = floor?.code || "";
          const roomCode = room?.code || "";
          setSelectedRoomFullCode(`${buildingCode}-${floorCode}-${roomCode}`);
          setSelectedRoomName(isRtl ? room?.name || "" : (room?.nameEn || room?.name) || "");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoomDetails();
  }, [formData.roomId, selectedBuildingId, selectedFloorId, buildings, floors, rooms, isRtl]);

  useEffect(() => {
    if (!selectedBuildingId) {
      setFloors([]);
      return;
    }
    fetch(`/api/buildings/${selectedBuildingId}/floors`)
      .then(res => res.ok ? res.json() : [])
      .then(setFloors);
  }, [selectedBuildingId]);

  useEffect(() => {
    if (!selectedFloorId) {
      setRooms([]);
      return;
    }
    fetch(`/api/floors/${selectedFloorId}/rooms`)
      .then(res => res.ok ? res.json() : [])
      .then(setRooms);
  }, [selectedFloorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error(t("nameSkuRequired"));
      return;
    }
    if (!formData.roomId) {
      toast.error(t("locationRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          quantity: parseInt(formData.quantity) || 0,
          minQuantity: parseInt(formData.minQuantity) || 0,
          unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
          roomId: formData.roomId,
          notes: formData.notes || null,
        }),
      });

      if (res.ok) {
        toast.success(t("createSuccess"));
        router.push(`/${locale}/inventory`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t("createError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  return (
    <PageContainer>
      <DetailHeader
        icon={<Plus size={28} />}
        title={t("newTitle")}
        subtitle={t("newSubtitle")}
        // تم إزالة زر "تراجع" من الأعلى
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            <InfoCard title={t("identity")} icon={<Package className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70">{t("name")} *</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("namePlaceholder")}
                    required
                    className="h-14 rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg px-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70">{t("sku")} *</Label>
                  <div className="relative">
                    <Hash className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <Input
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder={t("skuPlaceholder")}
                      required
                      className="h-14 rounded-2xl border-primary bg-background pr-12 focus-visible:ring-2 focus-visible:ring-primary font-bold tracking-widest"
                    />
                  </div>
                </div>

                <div className={containerClass}>
                  <div className="space-y-3">
                    <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={16} /> {t("location")}
                    </h3>
                    <LocationSelector
                      value={{
                        buildingId: selectedBuildingId,
                        floorId: selectedFloorId,
                        roomId: formData.roomId,
                      }}
                      onChange={handleLocationChange}
                    />
                    {selectedRoomFullCode && (
                      <div className="mt-5 relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-lg">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-30" />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {t("selectedRoom")}
                          </span>
                          <span className="text-sm font-mono font-black text-primary tracking-wider">
                            {selectedRoomName} — {selectedRoomFullCode}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            <InfoCard title={t("stockAndPricing")} icon={<BarChart3 className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground/70">{t("quantity")}</Label>
                  <Input
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="h-14 rounded-2xl border-primary bg-background font-black text-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-destructive/80">{t("minStockAlert")}</Label>
                  <Input
                    name="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={handleChange}
                    className="h-14 rounded-2xl border-primary bg-background font-black text-xl text-destructive"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-500/80">{t("unitPrice")}</Label>
                  <div className="relative">
                    <Banknote className="absolute right-4 top-4 h-5 w-5 text-emerald-500" />
                    <Input
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={handleChange}
                      className="h-14 rounded-2xl border-primary bg-background pr-12 font-black text-xl text-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* العمود الجانبي مع زر الحفظ وزر الإلغاء */}
          <div className="space-y-8">
            <InfoCard title={t("notes")} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-4">
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t("notesPlaceholder")}
                  className="rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold p-6 resize-none min-h-[120px]"
                />
                <div className="p-4 bg-primary/5 rounded-2xl flex items-start gap-3 border border-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-primary/70 leading-tight italic">{t("auditNote")}</p>
                </div>
              </div>
            </InfoCard>

            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 font-black">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {t("save")}
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="w-full h-12 rounded-full border-primary text-primary hover:bg-primary/10 font-black"
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}