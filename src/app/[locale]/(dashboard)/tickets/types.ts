// src/app/[locale]/(dashboard)/tickets/types.ts (أو src/types/tickets.ts)

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
  typeId?: string | null;
  statusId?: string | null;
}

// تعريف نوع المرفق الجديد (TicketAttachment)
export interface TicketAttachment {
  id: string;
  url: string;
  key?: string;
  mimeType?: string;
  size?: number;
  originalName?: string;
  createdAt?: string;
}

export interface Ticket {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  reporterName: string;
  reporterEmail: string;
  phone: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED"; // تأكد من تطابق القيم مع الـ enum في schema
  createdAt: string;
  room?: RoomSimple | null;
  branch?: BranchSimple | null;
  asset?: AssetSimple | null;
  attachments?: TicketAttachment[];   // ✅ استبدال ticketImages بـ attachments
}