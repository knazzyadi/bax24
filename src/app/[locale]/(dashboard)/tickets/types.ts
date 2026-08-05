// src/app/[locale]/(dashboard)/tickets/types.ts

// =========================
// Types
// =========================

export interface BuildingSimple {
  id: string;
  name: string;
  nameEn?: string | null; // ✅ السماح null من Prisma
}

export interface FloorSimple {
  id: string;
  name: string;
  nameEn?: string | null; // ✅ السماح null من Prisma
  building?: BuildingSimple;
}

export interface RoomSimple {
  id: string;
  name: string;
  nameEn?: string | null; // ✅ السماح null من Prisma
  code?: string;
  floor?: FloorSimple;
}

export interface BranchSimple {
  id: string;
  name: string;
  nameEn?: string | null; // ✅ السماح null من Prisma
}

export interface AssetSimple {
  id: string;
  name: string;
  code: string;
  typeId?: string | null;
  statusId?: string | null;
}

export interface TicketAttachment {
  id: string;
  url: string;
  key?: string;
  mimeType?: string;
  size?: number;
  originalName?: string | null; // ✅ السماح null
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
  status: "PENDING" | "APPROVED" | "REJECTED";
  type?: string | null;                // ✅ مطلوب في page.tsx
  rejectionReason?: string | null;     // ✅ مطلوب في page.tsx
  createdAt: string;
  updatedAt: string;                   // ✅ مطلوب في page.tsx
  room?: RoomSimple | null;
  branch?: BranchSimple | null;
  asset?: AssetSimple | null;
  attachments?: TicketAttachment[];    // ✅ بدلاً من ticketImages
  workOrder?: {
    id: string;
    code?: string | null;
  } | null;                            // ✅ مطلوب في page.tsx
}