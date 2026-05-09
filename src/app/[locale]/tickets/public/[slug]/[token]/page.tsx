"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import { AdaptiveSelect } from "@/components/shared/AdaptiveSelect";

import {
  Moon,
  Sun,
  X,
  Send,
  Loader2,
  Info,
} from "lucide-react";

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
  fullCode?: string;
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

  // ============================================================
  // Branch State
  // ============================================================

  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchLoading, setBranchLoading] = useState(true);

  // ============================================================
  // Location State
  // ============================================================

  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // ============================================================
  // Assets State
  // ============================================================

  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // ============================================================
  // Form State
  // ============================================================

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

  // ============================================================
  // Images
  // ============================================================

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // ============================================================
  // UI State
  // ============================================================

  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketTypeMap: Record<string, string> = {
    MAINTENANCE: isRtl ? "صيانة" : "Maintenance",
    INCIDENT: isRtl ? "حادث" : "Incident",
  };

  // ============================================================
  // Theme
  // ============================================================

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initial = stored ?? (prefersDark ? "dark" : "light");

    setTheme(initial);

    document.documentElement.classList.toggle(
      "dark",
      initial === "dark"
    );
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";

    setTheme(newTheme);

    localStorage.setItem("theme", newTheme);

    document.documentElement.classList.toggle(
      "dark",
      newTheme === "dark"
    );
  };

  // ============================================================
  // Language Switch
  // ============================================================

  const switchLanguage = () => {
    const newLocale = locale === "ar" ? "en" : "ar";

    router.push(
      `/${newLocale}/tickets/public/${slug}/${token}`
    );
  };

  // ============================================================
  // Fetch Buildings
  // ============================================================

  const fetchBuildings = useCallback(async () => {
    setLoadingBuildings(true);

    try {
      const res = await fetch(
        `/api/public/buildings?slug=${slug}&token=${token}`
      );

      if (!res.ok) {
        throw new Error();
      }

      const data = await res.json();

      setBuildings(data);
    } catch {
      toast.error(
        isRtl
          ? "فشل تحميل المباني"
          : "Failed to load buildings"
      );
    } finally {
      setLoadingBuildings(false);
    }
  }, [slug, token, isRtl]);

  // ============================================================
  // Fetch Asset Types
  // ============================================================

  const fetchAssetTypes = useCallback(async () => {
    setLoadingAssetTypes(true);

    try {
      const res = await fetch(
        `/api/public/asset-types?slug=${slug}&token=${token}`
      );

      if (!res.ok) {
        throw new Error();
      }

      const data = await res.json();

      setAssetTypes(data);
    } catch {
      toast.error(
        isRtl
          ? "فشل تحميل أنواع الأصول"
          : "Failed to load asset types"
      );
    } finally {
      setLoadingAssetTypes(false);
    }
  }, [slug, token, isRtl]);

  // ============================================================
  // Branch Validation
  // ============================================================

  useEffect(() => {
    if (!slug || !token) return;

    const controller = new AbortController();

    const fetchBranch = async () => {
      setBranchLoading(true);
      setBranchError(null);

      try {
        const res = await fetch(
          `/api/public/branch?slug=${slug}&token=${token}`,
          {
            signal: controller.signal,
          }
        );

        const data = await res.json();

        if (!res.ok || !data?.branch) {
          setBranchError(
            isRtl
              ? "الرابط غير صالح أو منتهي الصلاحية"
              : "Invalid or expired link"
          );

          return;
        }

        if (data.branch.allowPublicTickets !== true) {
          setBranchError(
            isRtl
              ? "البلاغات العامة لهذا الفرع معطلة"
              : "Public tickets are disabled for this branch"
          );

          return;
        }

        setBranch(data.branch);

        await Promise.all([
          fetchBuildings(),
          fetchAssetTypes(),
        ]);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setBranchError(
            isRtl
              ? "حدث خطأ أثناء الاتصال بالخادم"
              : "Server connection error"
          );
        }
      } finally {
        setBranchLoading(false);
      }
    };

    fetchBranch();

    return () => controller.abort();
  }, [
    slug,
    token,
    isRtl,
    fetchBuildings,
    fetchAssetTypes,
  ]);

  // ============================================================
  // Fetch Floors
  // ============================================================

  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }

    const controller = new AbortController();

    const fetchFloors = async () => {
      setLoadingFloors(true);

      try {
        const res = await fetch(
          `/api/public/floors?slug=${slug}&token=${token}&buildingId=${buildingId}`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          throw new Error();
        }

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

  // ============================================================
  // Fetch Rooms
  // ============================================================

  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }

    const controller = new AbortController();

    const fetchRooms = async () => {
      setLoadingRooms(true);

      try {
        const res = await fetch(
          `/api/public/rooms?slug=${slug}&token=${token}&floorId=${floorId}`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          throw new Error();
        }

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

  // ============================================================
  // Fetch Assets
  // ============================================================

  useEffect(() => {
    if (!roomId) {
      setAssets([]);

      setForm((prev) => ({
        ...prev,
        assetId: "none",
      }));

      return;
    }

    const controller = new AbortController();

    const fetchAssets = async () => {
      setLoadingAssets(true);

      try {
        let url = `/api/public/assets?slug=${slug}&token=${token}&roomId=${roomId}`;

        if (
          form.assetTypeId &&
          form.assetTypeId !== "none"
        ) {
          url += `&typeId=${form.assetTypeId}`;
        }

        const res = await fetch(url, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error();
        }

        const data = await res.json();

        setAssets(data);

        setForm((prev) => ({
          ...prev,
          assetId: "none",
        }));
      } catch {
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();

    return () => controller.abort();
  }, [
    roomId,
    form.assetTypeId,
    slug,
    token,
  ]);

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

    setForm((prev) => ({
      ...prev,
      assetTypeId: "",
      assetId: "none",
    }));
  };

  const handleFloorChange = (val: string) => {
    setFloorId(val);

    setRoomId("");

    setRooms([]);
    setAssets([]);

    setForm((prev) => ({
      ...prev,
      assetTypeId: "",
      assetId: "none",
    }));
  };

  const handleRoomChange = (val: string) => {
    setRoomId(val);

    setForm((prev) => ({
      ...prev,
      assetId: "none",
    }));
  };

  // ============================================================
  // Images
  // ============================================================

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = Array.from(
      e.target.files || []
    );

    const imageFiles = selected.filter(
      (file) =>
        file.type.startsWith("image/") &&
        file.size <= 5 * 1024 * 1024
    );

    if (selected.length > 5) {
      toast.error(
        isRtl
          ? "الحد الأقصى 5 صور"
          : "Maximum 5 images"
      );

      return;
    }

    setFiles((prev) => [...prev, ...imageFiles]);

    const newPreviews = imageFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviews((prev) => [
      ...prev,
      ...newPreviews,
    ]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);

    setFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setPreviews((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  useEffect(() => {
    return () => {
      previews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [previews]);

  // ============================================================
  // Submit
  // ============================================================

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error(
        isRtl
          ? "عنوان البلاغ مطلوب"
          : "Ticket title is required"
      );

      return;
    }

    if (!roomId) {
      toast.error(
        isRtl
          ? "يرجى اختيار موقع البلاغ"
          : "Please select a location"
      );

      return;
    }

    if (
      !form.reporterName.trim() ||
      !form.reporterEmail.trim()
    ) {
      toast.error(
        isRtl
          ? "الاسم والبريد الإلكتروني مطلوبان"
          : "Name and email are required"
      );

      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(form.reporterEmail)
    ) {
      toast.error(
        isRtl
          ? "البريد الإلكتروني غير صالح"
          : "Invalid email"
      );

      return;
    }

    setIsSubmitting(true);

    const fd = new FormData();

    fd.append("slug", slug);
    fd.append("token", token);
    fd.append("roomId", roomId);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append(
      "reporterName",
      form.reporterName
    );
    fd.append(
      "reporterEmail",
      form.reporterEmail
    );
    fd.append("phone", form.phone);
    fd.append("type", form.type);

    if (
      form.assetId &&
      form.assetId !== "none"
    ) {
      fd.append("assetId", form.assetId);
    }

    files.forEach((file) => {
      fd.append("images", file);
    });

    try {
      const res = await fetch(
        "/api/public/tickets",
        {
          method: "POST",
          body: fd,
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(
          isRtl
            ? "تم إرسال البلاغ بنجاح"
            : "Ticket submitted"
        );

        router.push(
          `/${locale}/tickets/public/success`
        );
      } else {
        toast.error(
          data.error ||
            (isRtl
              ? "فشل الإرسال"
              : "Submission failed")
        );
      }
    } catch {
      toast.error(
        isRtl
          ? "خطأ في الاتصال"
          : "Network error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // Memoized Data
  // ============================================================

  const selectedAsset = useMemo(() => {
    if (
      !form.assetId ||
      form.assetId === "none"
    ) {
      return null;
    }

    return assets.find(
      (a) => a.id === form.assetId
    );
  }, [assets, form.assetId]);

  const ticketTypeOptions = useMemo(
    () => [
      {
        value: "MAINTENANCE",
        label: ticketTypeMap.MAINTENANCE,
      },
      {
        value: "INCIDENT",
        label: ticketTypeMap.INCIDENT,
      },
    ],
    [ticketTypeMap]
  );

  const assetTypeOptions = useMemo(
    () => [
      {
        value: "",
        label: isRtl
          ? "جميع الأنواع"
          : "All types",
      },
      ...assetTypes.map((type) => ({
        value: type.id,
        label: `${
          isRtl
            ? type.name
            : type.nameEn || type.name
        } ${type.code ? `(${type.code})` : ""}`,
      })),
    ],
    [assetTypes, isRtl]
  );

  const assetOptions = useMemo(
    () => [
      {
        value: "none",
        label: isRtl
          ? "بدون أصل"
          : "No asset",
      },
      ...assets.map((asset) => ({
        value: asset.id,
        label: `${
          isRtl
            ? asset.name
            : asset.nameEn || asset.name
        } ${asset.code ? `(${asset.code})` : ""}`,
      })),
    ],
    [assets, isRtl]
  );

  // ============================================================
  // Loading State
  // ============================================================

  if (branchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-lg">
          {isRtl
            ? "جاري التحقق..."
            : "Verifying..."}
        </div>
      </div>
    );
  }

  // ============================================================
  // Error State
  // ============================================================

  if (branchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">
            {branchError}
          </h2>

          <p className="text-muted-foreground mb-6">
            {isRtl
              ? "يرجى التأكد من صحة الرابط أو التواصل مع الإدارة."
              : "Please verify the link or contact the administrator."}
          </p>

          <Button
            onClick={() =>
              router.push(`/${locale}`)
            }
            className="w-full h-11 rounded-xl text-base"
          >
            {isRtl
              ? "العودة للرئيسية"
              : "Back to Home"}
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
        {/* Top Controls */}
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

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10"
            disabled={isSubmitting}
          >
            {theme === "light" ? (
              <Moon size={20} />
            ) : (
              <Sun size={20} />
            )}
          </Button>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
          <div className="p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border pb-5">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Send size={28} />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isRtl
                    ? "بلاغ صيانة جديد"
                    : "New Maintenance Ticket"}
                </h1>

                <p className="text-base text-muted-foreground mt-1">
                  {branch.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}