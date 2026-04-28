// lib/data-fetching.ts
import { cache } from 'react';
import { auth } from '@/auth';
import { prisma } from './prisma';

// ========== دوال مساعدة داخلية ==========
async function getSessionAndCompany() {
  const session = await auth();
  if (!session?.user) throw new Error('غير مصرح');
  const companyId = session.user.companyId;
  if (!companyId) throw new Error('لا توجد شركة مرتبطة');
  return { session, companyId };
}

function getBranchFilter(session: any) {
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
  const branchIds = session.user.branchIds || [];
  if (isAdmin || branchIds.length === 0) return {};
  return {
    room: {
      floor: {
        building: {
          branchId: { in: branchIds }
        }
      }
    }
  };
}

// ========== دوال الأصول (Assets) ==========
export const getAssets = cache(async (where?: any, include?: any) => {
  const { session, companyId } = await getSessionAndCompany();
  const branchFilter = getBranchFilter(session);
  return prisma.asset.findMany({
    where: { ...branchFilter, ...where, companyId, deletedAt: null },
    include: include || { type: true, status: true, room: { include: { floor: { include: { building: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
});

export const getAssetsCount = cache(async (where?: any) => {
  const { session, companyId } = await getSessionAndCompany();
  const branchFilter = getBranchFilter(session);
  return prisma.asset.count({ where: { ...branchFilter, ...where, companyId, deletedAt: null } });
});

// ========== دوال أوامر العمل (Work Orders) ==========
export const getWorkOrders = cache(async (where?: any, include?: any) => {
  const { session, companyId } = await getSessionAndCompany();
  const branchFilter = getBranchFilter(session);
  return prisma.workOrder.findMany({
    where: { ...branchFilter, ...where, companyId, deletedAt: null },
    include: include || {
      priority: true,
      status: true,
      branch: true,
      room: { include: { floor: { include: { building: true } } } },
      workOrderAssets: { include: { asset: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
});

export const getWorkOrdersCount = cache(async (where?: any) => {
  const { session, companyId } = await getSessionAndCompany();
  const branchFilter = getBranchFilter(session);
  return prisma.workOrder.count({ where: { ...branchFilter, ...where, companyId, deletedAt: null } });
});

// ========== دوال التذاكر (Tickets) ==========
export const getTickets = cache(async (where?: any, include?: any) => {
  const { session, companyId } = await getSessionAndCompany();
  const branchFilter = getBranchFilter(session);
  return prisma.ticket.findMany({
    where: { ...branchFilter, ...where, companyId, deletedAt: null },
    include: include || {
      asset: true,
      room: { include: { floor: { include: { building: true } } } },
      branch: true,
      ticketImages: true
    },
    orderBy: { createdAt: 'desc' },
  });
});

export const getTicketsCount = cache(async (where?: any) => {
  const { session, companyId } = await getSessionAndCompany();
  const branchFilter = getBranchFilter(session);
  return prisma.ticket.count({ where: { ...branchFilter, ...where, companyId, deletedAt: null } });
});

// ========== دوال المخزون (Inventory) ==========
export const getInventoryItems = cache(async (where?: any, include?: any) => {
  const { session, companyId } = await getSessionAndCompany();
  const branchFilter = getBranchFilter(session);
  return prisma.inventoryItem.findMany({
    where: { ...branchFilter, ...where, companyId, deletedAt: null },
    include: include || { room: { include: { floor: { include: { building: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
});