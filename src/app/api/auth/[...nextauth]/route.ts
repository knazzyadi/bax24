// src/app/api/auth/[...nextauth]/route.ts
export async function GET(req: Request, ctx: any) {
  const { handlers } = await import("@/auth");
  if (!handlers || typeof handlers.GET !== 'function') {
    return new Response('Authentication handler not available', { status: 500 });
  }
  return handlers.GET(req, ctx);
}

export async function POST(req: Request, ctx: any) {
  const { handlers } = await import("@/auth");
  if (!handlers || typeof handlers.POST !== 'function') {
    return new Response('Authentication handler not available', { status: 500 });
  }
  return handlers.POST(req, ctx);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;