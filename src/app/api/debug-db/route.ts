// src/app/api/debug-db/route.ts

export async function GET() {
  return Response.json({
    db: process.env.DATABASE_URL?.substring(0, 80),
  });
}