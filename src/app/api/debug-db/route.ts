import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();

    return Response.json({
      ok: true,
      message: "DB connection works",
      userExists: !!user
    });
  } catch (error: any) {
    return Response.json({
      ok: false,
      error: error.message
    });
  }
}