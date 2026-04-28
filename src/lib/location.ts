// src/lib/location.ts

/**
 * 🔧 Include object لـ Prisma لجلب بيانات الموقع الكاملة (Room → Floor → Building)
 * يمكن استخدامه مع أي query لـ Room أو Asset أو WorkOrder.
 */
export const roomInclude = {
  room: {
    include: {
      floor: {
        include: {
          building: true,
        },
      },
    },
  },
} as const;

/**
 * 🏢 تنسيق موقع Room إلى نص قابل للعرض
 * @param room - كائن الغرفة (قد يكون null أو يحتوي على floor و building)
 * @returns نص يوضح الموقع مثل "المبنى الرئيسي - الطابق الثالث - غرفة 101"
 */
export function formatRoomLocation(room: any): string {
  if (!room) return 'غير محدد';

  const buildingName = room.floor?.building?.name || room.building?.name || '';
  const floorName = room.floor?.name || '';
  const roomName = room.name || '';

  const parts = [buildingName, floorName, roomName].filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : 'غير محدد';
}

/**
 * (اختياري) دالة مساعدة للحصول على اسم مختصر للموقع
 */
export function getShortLocation(room: any): string {
  if (!room) return '-';
  return room.name || room.floor?.name || room.building?.name || '-';
}