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
interface Branch {
  id: string;
  name: string;
  nameEn?: string;
  allowPublicTickets: boolean;
}

export default function PublicTicketPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const slug = params.slug as string;
  const token = params.token as string;

  // حالات الفرع
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchLoading, setBranchLoading] = useState(true);

  // حالات الموقع الهرمي
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // النموذج
  const [form, setForm] = useState({
    title: "",
    description: "",
    reporterName: "",
    reporterEmail: "",
    phone: "",
    type: "MAINTENANCE",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ======================
  // 1. التحقق من صحة الفرع
  // ======================
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
        if (!data.branch.allowPublicTickets) {
          setBranchError("البلاغات العامة معطلة لهذا الفرع");
          return;
        }
        setBranch(data.branch);
        // تحميل المباني بعد التأكد من صحة الفرع
        fetchBuildings();
      } catch {
        setBranchError("خطأ في الاتصال بالخادم");
      } finally {
        setBranchLoading(false);
      }
    };
    fetchBranch();
  }, [slug, token]);

  // ======================
  // 2. جلب المباني (عبر API محمي)
  // ======================
  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      const res = await fetch(`/api/public/buildings?slug=${slug}&token=${token}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBuildings(data);
    } catch {
      toast.error(isRtl ? "فشل تحميل المباني" : "Failed to load buildings");
    } finally {
      setLoadingBuildings(false);
    }
  };

  // ======================
  // 3. جلب الأدوار (عبر API محمي) عند تغيير المبنى
  // ======================
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    const fetchFloors = async () => {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/public/floors?slug=${slug}&token=${token}&buildingId=${buildingId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFloors(data);
        setFloorId("");
      } catch {
        toast.error(isRtl ? "فشل تحميل الأدوار" : "Failed to load floors");
      } finally {
        setLoadingFloors(false);
      }
    };
    fetchFloors();
  }, [buildingId, slug, token]);

  // ======================
  // 4. جلب الغرف (عبر API محمي) عند تغيير الدور
  // ======================
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/public/rooms?slug=${slug}&token=${token}&floorId=${floorId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRooms(data);
        setRoomId("");
      } catch {
        toast.error(isRtl ? "فشل تحميل الغرف" : "Failed to load rooms");
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [floorId, slug, token]);

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
      toast.error(isRtl ? "عنوان البلاغ مطلوب" : "Title is required");
      return;
    }
    if (!roomId) {
      toast.error(isRtl ? "يرجى اختيار الغرفة" : "Please select a room");
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
    files.forEach(file => fd.append("images", file));

    try {
      const res = await fetch("/api/public/tickets", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        const ticketId = data.ticketId;
        toast.success(isRtl ? "تم إرسال البلاغ بنجاح" : "Ticket submitted");
        router.push(`/${locale}/tickets/public/success?id=${ticketId}`);
      } else {
        toast.error(data.error || (isRtl ? "فشل الإرسال" : "Submission failed"));
      }
    } catch {
      toast.error(isRtl ? "خطأ في الاتصال" : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================
  // 5. حالات الخطأ أو التحميل
  // =========================
  if (branchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">{isRtl ? "جاري التحقق..." : "Verifying..."}</div>
      </div>
    );
  }

  if (branchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
            {isRtl ? "رابط غير صالح" : "Invalid Link"}
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">
            {branchError}
          </p>
          <Button onClick={() => router.push(`/${locale}`)}>
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </Button>
        </div>
      </div>
    );
  }

  if (!branch) return null;

  // =========================
  // 6. الواجهة الرئيسية
  // =========================
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* أزرار التحكم العلوية */}
        <div className="flex justify-end gap-3 mb-6">
          <Button variant="outline" size="icon" onClick={switchLanguage} className="rounded-full">
            <Languages size={18} />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
        </div>

        {/* البطاقة الرئيسية */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Send size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isRtl ? "بلاغ صيانة جديد" : "New Maintenance Ticket"}
                </h1>
                <p className="text-sm text-muted-foreground">{branch.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* العمود الأيسر */}
              <div className="space-y-4">
                <div>
                  <Label>{isRtl ? "نوع البلاغ *" : "Type *"}</Label>
                  <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">{isRtl ? "صيانة" : "Maintenance"}</SelectItem>
                      <SelectItem value="INCIDENT">{isRtl ? "حادث" : "Incident"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isRtl ? "العنوان *" : "Title *"}</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>{isRtl ? "الوصف *" : "Description *"}</Label>
                  <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>{isRtl ? "الموقع *" : "Location *"}</Label>
                  <div className="grid grid-cols-3 gap-2">
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
                      onValueChange={setRoomId}
                      rooms={rooms}
                      floorId={floorId}
                      loading={loadingRooms}
                    />
                  </div>
                </div>
              </div>

              {/* العمود الأيمن */}
              <div className="space-y-4">
                <div>
                  <Label>{isRtl ? "الاسم *" : "Name *"}</Label>
                  <Input value={form.reporterName} onChange={(e) => setForm({ ...form, reporterName: e.target.value })} />
                </div>
                <div>
                  <Label>{isRtl ? "البريد الإلكتروني *" : "Email *"}</Label>
                  <Input type="email" value={form.reporterEmail} onChange={(e) => setForm({ ...form, reporterEmail: e.target.value })} />
                </div>
                <div>
                  <Label>{isRtl ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>{isRtl ? "صور توضيحية (اختياري)" : "Images (optional)"}</Label>
                  <Input type="file" accept="image/*" multiple onChange={handleFileChange} />
                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src} alt={`preview-${idx}`} className="w-full h-20 object-cover rounded-md border" />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Button onClick={() => router.back()} variant="outline" className="w-full sm:w-32">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:flex-1">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send size={18} className="mr-2" />}
                {isRtl ? "إرسال البلاغ" : "Submit"}
              </Button>
            </div>

            <div className="bg-primary/5 rounded-xl p-3 text-xs text-muted-foreground flex gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
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