"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdaptiveSelect } from "@/components/shared/AdaptiveSelect";
import { Moon, Sun, X, Send, Loader2, Info } from "lucide-react";

// ============================================================
// Types
// ============================================================
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
interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}
interface Asset {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
}
interface Branch {
  id: string;
  name: string;
  nameEn?: string;
  allowPublicTickets: boolean;
}

// ============================================================
// Main Component
// ============================================================
export default function PublicTicketPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const slug = params.slug as string;
  const token = params.token as string;

  // Branch
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchLoading, setBranchLoading] = useState(true);

  // Location hierarchy
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Assets
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    reporterName: "",
    reporterEmail: "",
    phone: "",
    type: "MAINTENANCE",
    assetTypeId: "",
    assetId: "none",
  });

  // Images
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketTypeMap: Record<string, string> = {
    MAINTENANCE: isRtl ? "صيانة" : "Maintenance",
    INCIDENT: isRtl ? "حادث" : "Incident",
  };

  // Theme
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Language switch
  const switchLanguage = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.push(`/${newLocale}/tickets/public/${slug}/${token}`);
  };

  // ============================================================
  // Data fetching functions (with branch dependency)
  // ============================================================
  const fetchBuildings = useCallback(async () => {
    if (!branch?.id) {
      console.log("No branch.id yet, skipping fetchBuildings");
      return;
    }
    setLoadingBuildings(true);
    try {
      const res = await fetch(`/api/public/buildings?slug=${slug}&token=${token}&branchId=${branch.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      console.log("Buildings received:", data);
      setBuildings(data);
    } catch (err) {
      console.error("Fetch buildings error:", err);
      toast.error(isRtl ? "فشل تحميل المباني" : "Failed to load buildings");
    } finally {
      setLoadingBuildings(false);
    }
  }, [slug, token, branch?.id, isRtl]);

  const fetchAssetTypes = useCallback(async () => {
    setLoadingAssetTypes(true);
    try {
      const res = await fetch(`/api/public/asset-types?slug=${slug}&token=${token}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssetTypes(data);
    } catch {
      toast.error(isRtl ? "فشل تحميل أنواع الأصول" : "Failed to load asset types");
    } finally {
      setLoadingAssetTypes(false);
    }
  }, [slug, token, isRtl]);

  // Branch validation
  useEffect(() => {
    if (!slug || !token) return;
    const controller = new AbortController();
    const fetchBranch = async () => {
      setBranchLoading(true);
      setBranchError(null);
      try {
        const res = await fetch(`/api/public/branch?slug=${slug}&token=${token}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        console.log("Branch response:", data);
        if (!res.ok || !data?.branch) {
          setBranchError(isRtl ? "الرابط غير صالح أو منتهي الصلاحية" : "Invalid or expired link");
          return;
        }
        if (data.branch.allowPublicTickets !== true) {
          setBranchError(isRtl ? "البلاغات العامة لهذا الفرع معطلة" : "Public tickets are disabled for this branch");
          return;
        }
        setBranch(data.branch);
        // after branch is set, fetch buildings and asset types
        // note: fetchBuildings depends on branch.id, so we call it after setting branch
        await fetchBuildings();
        await fetchAssetTypes();
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setBranchError(isRtl ? "حدث خطأ أثناء الاتصال بالخادم" : "Server connection error");
        }
      } finally {
        setBranchLoading(false);
      }
    };
    fetchBranch();
    return () => controller.abort();
  }, [slug, token, isRtl, fetchBuildings, fetchAssetTypes]);

  // Fetch floors when building changes
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    const controller = new AbortController();
    const fetchFloors = async () => {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/public/floors?slug=${slug}&token=${token}&buildingId=${buildingId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFloors(data);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    };
    fetchFloors();
    return () => controller.abort();
  }, [buildingId, slug, token]);

  // Fetch rooms when floor changes
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    const controller = new AbortController();
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/public/rooms?slug=${slug}&token=${token}&floorId=${floorId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRooms(data);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
    return () => controller.abort();
  }, [floorId, slug, token]);

  // Fetch assets when room or asset type changes
  useEffect(() => {
    if (!roomId) {
      setAssets([]);
      setForm(prev => ({ ...prev, assetId: "none" }));
      return;
    }
    const controller = new AbortController();
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        let url = `/api/public/assets?slug=${slug}&token=${token}&roomId=${roomId}`;
        if (form.assetTypeId && form.assetTypeId !== "none") {
          url += `&typeId=${form.assetTypeId}`;
        }
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAssets(data);
        setForm(prev => ({ ...prev, assetId: "none" }));
      } catch {
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
    return () => controller.abort();
  }, [roomId, form.assetTypeId, slug, token]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleBuildingChange = (val: string) => {
    setBuildingId(val);
    setFloorId("");
    setRoomId("");
    setFloors([]);
    setRooms([]);
    setAssets([]);
    setForm(prev => ({ ...prev, assetTypeId: "", assetId: "none" }));
  };

  const handleFloorChange = (val: string) => {
    setFloorId(val);
    setRoomId("");
    setRooms([]);
    setAssets([]);
    setForm(prev => ({ ...prev, assetTypeId: "", assetId: "none" }));
  };

  const handleRoomChange = (val: string) => {
    setRoomId(val);
    setForm(prev => ({ ...prev, assetId: "none" }));
  };

  // ============================================================
  // Images handling
  // ============================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const imageFiles = selected.filter(
      file => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );
    if (selected.length > 5) {
      toast.error(isRtl ? "الحد الأقصى 5 صور" : "Maximum 5 images");
      return;
    }
    setFiles(prev => [...prev, ...imageFiles]);
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error(isRtl ? "عنوان البلاغ مطلوب" : "Ticket title is required");
      return;
    }
    if (!roomId) {
      toast.error(isRtl ? "يرجى اختيار موقع البلاغ" : "Please select a location");
      return;
    }
    if (!form.reporterName.trim() || !form.reporterEmail.trim()) {
      toast.error(isRtl ? "الاسم والبريد الإلكتروني مطلوبان" : "Name and email are required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.reporterEmail)) {
      toast.error(isRtl ? "البريد الإلكتروني غير صالح" : "Invalid email");
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("token", token);
    fd.append("roomId", roomId);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("reporterName", form.reporterName);
    fd.append("reporterEmail", form.reporterEmail);
    fd.append("phone", form.phone);
    fd.append("type", form.type);
    if (form.assetId && form.assetId !== "none") fd.append("assetId", form.assetId);
    files.forEach(file => fd.append("images", file));

    try {
      const res = await fetch("/api/public/tickets", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        toast.success(isRtl ? "تم إرسال البلاغ بنجاح" : "Ticket submitted");
        router.push(`/${locale}/tickets/public/success`);
      } else {
        toast.error(data.error || (isRtl ? "فشل الإرسال" : "Submission failed"));
      }
    } catch {
      toast.error(isRtl ? "خطأ في الاتصال" : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // Memoized options for selects
  // ============================================================
  const ticketTypeOptions = useMemo(
    () => [
      { value: "MAINTENANCE", label: ticketTypeMap.MAINTENANCE },
      { value: "INCIDENT", label: ticketTypeMap.INCIDENT },
    ],
    [ticketTypeMap]
  );

  const buildingOptions = useMemo(
    () => buildings.map(b => ({ value: b.id, label: isRtl ? b.name : (b.nameEn || b.name) })),
    [buildings, isRtl]
  );

  const floorOptions = useMemo(
    () => floors.map(f => ({ value: f.id, label: isRtl ? f.name : (f.nameEn || f.name) })),
    [floors, isRtl]
  );

  const roomOptions = useMemo(
    () => rooms.map(r => ({ value: r.id, label: isRtl ? r.name : (r.nameEn || r.name) })),
    [rooms, isRtl]
  );

  const assetTypeOptions = useMemo(
    () => [
      { value: "", label: isRtl ? "جميع الأنواع" : "All types" },
      ...assetTypes.map(type => ({
        value: type.id,
        label: `${isRtl ? type.name : type.nameEn || type.name} ${type.code ? `(${type.code})` : ""}`,
      })),
    ],
    [assetTypes, isRtl]
  );

  const assetOptions = useMemo(
    () => [
      { value: "none", label: isRtl ? "بدون أصل" : "No asset" },
      ...assets.map(asset => ({
        value: asset.id,
        label: `${isRtl ? asset.name : asset.nameEn || asset.name} ${asset.code ? `(${asset.code})` : ""}`,
      })),
    ],
    [assets, isRtl]
  );

  // ============================================================
  // Loading & error states
  // ============================================================
  if (branchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-lg">{isRtl ? "جاري التحقق..." : "Verifying..."}</div>
      </div>
    );
  }

  if (branchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">{branchError}</h2>
          <p className="text-muted-foreground mb-6">
            {isRtl
              ? "يرجى التأكد من صحة الرابط أو التواصل مع الإدارة."
              : "Please verify the link or contact the administrator."}
          </p>
          <Button onClick={() => router.push(`/${locale}`)} className="w-full h-11 rounded-xl text-base">
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </Button>
        </div>
      </div>
    );
  }

  if (!branch) return null;

  // ============================================================
  // Main UI
  // ============================================================
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Top controls */}
        <div className="flex justify-end gap-3 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={switchLanguage}
            className="rounded-full w-10 h-10 text-sm font-bold"
            disabled={isSubmitting}
          >
            {locale === "ar" ? "EN" : "AR"}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full w-10 h-10" disabled={isSubmitting}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
        </div>

        {/* Main card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
          <div className="p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border pb-5">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Send size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isRtl ? "بلاغ صيانة جديد" : "New Maintenance Ticket"}
                </h1>
                <p className="text-base text-muted-foreground mt-1">{branch.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                {/* Ticket Type */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "نوع البلاغ *" : "Ticket Type *"}</Label>
                  <AdaptiveSelect
                    value={form.type}
                    onChange={(val) => setForm({ ...form, type: val })}
                    options={ticketTypeOptions}
                    placeholder={isRtl ? "اختر نوع البلاغ" : "Select type"}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Title */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "عنوان البلاغ *" : "Ticket Title *"}</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-12 text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "وصف البلاغ *" : "Description *"}</Label>
                  <Textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Building */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "المبنى *" : "Building *"}</Label>
                  <AdaptiveSelect
                    value={buildingId}
                    onChange={handleBuildingChange}
                    options={buildingOptions}
                    placeholder={isRtl ? "اختر المبنى" : "Select building"}
                    disabled={loadingBuildings || isSubmitting}
                  />
                  {loadingBuildings && <p className="text-sm text-muted-foreground mt-1">جار تحميل المباني...</p>}
                </div>

                {/* Floor (appears after building selected) */}
                {buildingId && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">{isRtl ? "الدور *" : "Floor *"}</Label>
                    <AdaptiveSelect
                      value={floorId}
                      onChange={handleFloorChange}
                      options={floorOptions}
                      placeholder={isRtl ? "اختر الدور" : "Select floor"}
                      disabled={loadingFloors || isSubmitting}
                    />
                    {loadingFloors && <p className="text-sm text-muted-foreground mt-1">جار تحميل الأدوار...</p>}
                  </div>
                )}

                {/* Room (appears after floor selected) */}
                {floorId && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">{isRtl ? "الغرفة *" : "Room *"}</Label>
                    <AdaptiveSelect
                      value={roomId}
                      onChange={handleRoomChange}
                      options={roomOptions}
                      placeholder={isRtl ? "اختر الغرفة" : "Select room"}
                      disabled={loadingRooms || isSubmitting}
                    />
                    {loadingRooms && <p className="text-sm text-muted-foreground mt-1">جار تحميل الغرف...</p>}
                  </div>
                )}

                {/* Asset Type & Asset (only if room selected) */}
                {roomId && (
                  <>
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        {isRtl ? "نوع الأصل (اختياري)" : "Asset Type (Optional)"}
                      </Label>
                      <AdaptiveSelect
                        value={form.assetTypeId}
                        onChange={(val) => setForm({ ...form, assetTypeId: val, assetId: "none" })}
                        options={assetTypeOptions}
                        placeholder={isRtl ? "اختر نوع الأصل" : "Select asset type"}
                        disabled={loadingAssetTypes || isSubmitting}
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        {isRtl ? "الأصل (اختياري)" : "Asset (Optional)"}
                      </Label>
                      {assets.length === 0 && !loadingAssets ? (
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {isRtl ? "لا توجد أصول مسجلة في هذه الغرفة" : "No assets found in this room"}
                        </p>
                      ) : (
                        <AdaptiveSelect
                          value={form.assetId}
                          onChange={(val) => setForm({ ...form, assetId: val })}
                          options={assetOptions}
                          placeholder={isRtl ? "اختر الأصل" : "Select asset"}
                          disabled={loadingAssets || isSubmitting}
                        />
                      )}
                      {loadingAssets && <p className="text-sm text-muted-foreground mt-2">{isRtl ? "جار التحميل..." : "Loading..."}</p>}
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN - Reporter & Images */}
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "الاسم *" : "Name *"}</Label>
                  <Input
                    value={form.reporterName}
                    onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                    className="h-12 text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "البريد الإلكتروني *" : "Email *"}</Label>
                  <Input
                    type="email"
                    value={form.reporterEmail}
                    onChange={(e) => setForm({ ...form, reporterEmail: e.target.value })}
                    className="h-12 text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-12 text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Image upload */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "صور توضيحية (اختياري)" : "Images (optional)"}</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="text-base py-2"
                    disabled={isSubmitting}
                  />
                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src} alt="" className="w-full h-24 object-cover rounded-lg border" />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            disabled={isSubmitting}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-6 border-t border-border">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3 text-base rounded-full">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Send size={20} className="mr-2" />}
                {isRtl ? "إرسال البلاغ" : "Submit"}
              </Button>
              <Button onClick={() => router.back()} variant="outline" className="w-full py-3 text-base rounded-full" disabled={isSubmitting}>
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
            </div>

            {/* Info Note */}
            <div className="bg-primary/5 rounded-xl p-4 text-sm text-muted-foreground flex gap-3">
              <Info size={18} className="shrink-0 mt-0.5" />
              {isRtl
                ? "سيتم إرسال إشعار لفريق الصيانة. يمكنك متابعة الحالة عبر البريد الإلكتروني."
                : "Maintenance team will be notified. You can track the ticket status via email."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}