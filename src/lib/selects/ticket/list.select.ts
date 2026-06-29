// src/lib/selects/ticket/list.select.ts
import { Prisma } from '@prisma/client';

/**
 * Select لقائمة التذاكر (صفحة العرض الرئيسية)
 */
export const ticketListSelect = {
  id: true,
  code: true,
  branchSeqNum: true,
  title: true,
  description: true,
  type: true,
  status: true,
  phone: true,
  reporterName: true,
  reporterEmail: true,
  notes: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,

  // العلاقات الأساسية
  asset: {
    select: {
      id: true,
      code: true,
      name: true,
      nameEn: true,
    },
  },
  room: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      code: true,
      floor: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          building: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },
        },
      },
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  // العمل المرتبط (إن وجد)
  workOrder: {
    select: {
      id: true,
      code: true,
      title: true,
      status: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  },
  // عدد المرفقات
  _count: {
    select: {
      attachments: true,
    },
  },
} satisfies Prisma.TicketSelect;