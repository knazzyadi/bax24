"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import { Moon, Sun, Languages, X, Send, Loader2, Info } from "lucide-react";

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
}

export default function PublicTicketPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const slug = params.slug as string;
  const token = params.token as string;

  // حالات الفرع
  const [branchLoading, setBranchLoading] = useState(true);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);

  // حالات الموقع الهرمي
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // حالات الأصول
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // النموذج
  const [form, setForm] = useState({
    title: "",
    description: "",
    reporterName: "",
    reporterEmail: "",
    phone: "",
    type: "MAINTENANCE",
    assetId: "none",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // خريطة لنوع البلاغ (العربية والإنجليزية)
  const ticketTypeMap: Record<string, string> = {
    MAINTENANCE: isRtl ? "صيانة" : "Maintenance",
    INCIDENT: isRtl ? "حادث" : "Incident",
  };

  // الوضع الليلي/النهاري
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

  // تبديل اللغة
  const switchLanguage = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.push(`/${newLocale}/tickets/public/${slug}/${token}`);
  };

  // 1. التحقق من صحة الفرع
  useEffect(() => {
    const fetchBranch = async () => {
      setBranchLoading(true);
      setBranchError(null);
      try {
        const res = await fetch(`/api/public/branch?slug=${slug}&token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          setBranchError(data.error || "رابط غير صالح");
          return;
        }
        setBranch(data.branch);
        fetchBuildings();
      } catch {
        setBranchError("خطأ في الاتصال بالخادم");
      } finally {
        setBranchLoading(false);
      }
    };
    fetchBranch();
  }, [slug, token]);

  // جلب المباني
  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      const res = await fetch("/api/buildings");
      const data = await res.json();
      setBuildings(data);
    } catch {
      toast.error("فشل تحميل المباني");
    } finally {
      setLoadingBuildings(false);
    }
  };

  // جلب الأدوار
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    const fetchFloors = async () => {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${buildingId}/floors`);
        if (res.ok) setFloors(await res.json());
        else setFloors([]);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    };
    fetchFloors();
  }, [buildingId]);

  // جلب الغرف
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/floors/${floorId}/rooms`);
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        } else setRooms([]);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [floorId]);

  // جلب الأصول (باستخدام locationId)
  useEffect(() => {
    if (!roomId) {
      setAssets([]);
      setForm(prev => ({ ...prev, assetId: "none" }));
      return;
    }
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const res = await fetch(`/api/assets?locationId=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          const assetsList = Array.isArray(data.assets) ? data.assets : Array.isArray(data) ? data : [];
          setAssets(assetsList);
        } else {
          setAssets([]);
        }
      } catch {
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, [roomId]);

  // معاينة الصور
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const imageFiles = selected.filter(file => file.type.startsWith("image/"));
    setFiles(prev => [...prev, ...imageFiles]);
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // إرسال البلاغ
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
    if (form.assetId && form.assetId !== "none") {
      fd.append("assetId", form.assetId);
    }
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

  if (branchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-lg">{isRtl ? "جاري التحقق..." : "Verifying..."}</div>
      </div>
    );
  }

  if (branchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-3">
            {isRtl ? "رابط غير صالح" : "Invalid Link"}
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-5">{branchError}</p>
          <Button onClick={() => router.push(`/${locale}`)} size="lg" className="px-6 py-2 text-base">
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </Button>
        </div>
      </div>
    );
  }

  if (!branch) return null;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end gap-3 mb-6">
          <Button variant="outline" size="icon" onClick={switchLanguage} className="rounded-full w-10 h-10">
            <Languages size={20} />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full w-10 h-10">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
          <div className="p-6 md:p-10 space-y-8">
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
              {/* العمود الأيسر */}
              <div className="space-y-6">
                {/* نوع البلاغ - مع SelectValue بدون children */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "نوع البلاغ *" : "Ticket Type *"}</Label>
                  <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder={isRtl ? "اختر نوع البلاغ" : "Select type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">{ticketTypeMap.MAINTENANCE}</SelectItem>
                      <SelectItem value="INCIDENT">{ticketTypeMap.INCIDENT}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* عنوان البلاغ */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "عنوان البلاغ *" : "Ticket Title *"}</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-12 text-base"
                    placeholder={isRtl ? "مثال: عطل في التكييف" : "e.g., AC malfunction"}
                  />
                </div>

                {/* وصف البلاغ */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "وصف البلاغ *" : "Description *"}</Label>
                  <Textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="text-base"
                    placeholder={isRtl ? "تفاصيل المشكلة..." : "Problem details..."}
                  />
                </div>

                {/* موقع البلاغ */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "موقع البلاغ *" : "Location *"}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <BuildingSelector
                      value={buildingId}
                      onValueChange={(val) => {
                        setBuildingId(val);
                        setFloorId("");
                        setRoomId("");
                      }}
                      buildings={buildings}
                      loading={loadingBuildings}
                    />
                    <FloorSelector
                      value={floorId}
                      onValueChange={(val) => {
                        setFloorId(val);
                        setRoomId("");
                      }}
                      floors={floors}
                      buildingId={buildingId}
                      loading={loadingFloors}
                    />
                    <RoomSelector
                      value={roomId}
                      onValueChange={(val) => {
                        setRoomId(val);
                        setForm(prev => ({ ...prev, assetId: "none" }));
                      }}
                      rooms={rooms}
                      floorId={floorId}
                      loading={loadingRooms}
                    />
                  </div>
                </div>

                {/* اختيار الأصل (يظهر فقط إذا تم اختيار الغرفة) */}
                {roomId && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">{isRtl ? "الأصل (اختياري)" : "Asset (Optional)"}</Label>
                    <Select value={form.assetId} onValueChange={(val) => setForm({ ...form, assetId: val })} disabled={loadingAssets}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder={isRtl ? "اختر الأصل" : "Select asset"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{isRtl ? "بدون أصل" : "No asset"}</SelectItem>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {isRtl ? asset.name : (asset.nameEn || asset.name)} {asset.code && `(${asset.code})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingAssets && <p className="text-sm text-muted-foreground mt-2">{isRtl ? "جار التحميل..." : "Loading..."}</p>}
                  </div>
                )}
              </div>

              {/* العمود الأيمن - بيانات المراسل والصور */}
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "الاسم *" : "Name *"}</Label>
                  <Input
                    value={form.reporterName}
                    onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                    className="h-12 text-base"
                    placeholder={isRtl ? "الاسم الكامل" : "Full name"}
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "البريد الإلكتروني *" : "Email *"}</Label>
                  <Input
                    type="email"
                    value={form.reporterEmail}
                    onChange={(e) => setForm({ ...form, reporterEmail: e.target.value })}
                    className="h-12 text-base"
                    placeholder="example@domain.com"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-12 text-base"
                    placeholder={isRtl ? "05xxxxxxxx" : "+9665xxxxxxxx"}
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">{isRtl ? "صور توضيحية (اختياري)" : "Images (optional)"}</Label>
                  <Input type="file" accept="image/*" multiple onChange={handleFileChange} className="text-base py-2" />
                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src} alt="" className="w-full h-24 object-cover rounded-lg border" />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
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

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
              <Button onClick={() => router.back()} variant="outline" className="w-full sm:w-auto px-8 py-3 text-base rounded-full">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:flex-1 py-3 text-base rounded-full">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Send size={20} className="mr-2" />}
                {isRtl ? "إرسال البلاغ" : "Submit"}
              </Button>
            </div>

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