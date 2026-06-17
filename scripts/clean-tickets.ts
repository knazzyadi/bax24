import { prisma } from "../src/lib/prisma";

async function cleanOldTickets() {
  // حذف الصور أولاً بسبب العلاقة
  await prisma.ticketAttachment.deleteMany({});
  // حذف التذاكر
  const deleted = await prisma.ticket.deleteMany({});
  console.log(`✅ تم حذف ${deleted.count} تذكرة قديمة`);
}

cleanOldTickets()
  .catch(console.error)
  .finally(() => prisma.$disconnect());