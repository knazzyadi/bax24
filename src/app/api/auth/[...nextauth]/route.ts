// src/app/api/auth/[...nextauth]/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(req: Request, ctx: any) {
  const { handlers } = await import('@/auth');
  if (!handlers || typeof handlers.GET !== 'function') {
    throw new Error('❌ handlers not available');
  }
  return handlers.GET(req, ctx);
}

export async function POST(req: Request, ctx: any) {
  const { handlers } = await import('@/auth');
  if (!handlers || typeof handlers.POST !== 'function') {
    throw new Error('❌ handlers not available');
  }
  return handlers.POST(req, ctx);
}