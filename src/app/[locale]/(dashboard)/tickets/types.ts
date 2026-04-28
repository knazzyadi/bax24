// src/types/tickets.ts

// أنواع مساعدة (إذا لم تكن موجودة في assets.ts)
export interface BuildingSimple {
  id: string;
  name: string;
  nameEn?: string;
}

export interface FloorSimple {
  id: string;
  name: string;
  nameEn?: string;
  building?: BuildingSimple;
}

export interface RoomSimple {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  floor?: FloorSimple;
}

export interface BranchSimple {
  id: string;
  name: string;
  nameEn?: string;
}

export interface AssetSimple {
  id: string;
  name: string;
  code: string;
  typeId?: string | null;      // ✅ إضافة معرف نوع الأصل
  statusId?: string | null;    // ✅ إضافة معرف حالة الأصل
}

export interface TicketImage {
  id: string;
  url: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  reporterName: string;
  reporterEmail: string;
  phone: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  room?: RoomSimple | null;
  branch?: BranchSimple | null;
  asset?: AssetSimple | null;
  ticketImages?: TicketImage[];   // ✅ تحسين النوع
}