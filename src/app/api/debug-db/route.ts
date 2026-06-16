import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      take: 1,
    });

    return Response.json({
      ok: true,
      usersCount: users.length,
      sample: users[0] || null,
    });
  } catch (error: any) {
    return Response.json({
      ok: false,
      error: error.message,
    });
  }
}