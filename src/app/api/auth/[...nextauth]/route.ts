// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const GET = async (req: Request, ctx: any) => {
  if (!handlers || typeof handlers.GET !== 'function') {
    console.error('❌ handlers.GET not available');
    return new Response('Authentication handler not available', { status: 500 });
  }
  return handlers.GET(req, ctx);
};

export const POST = async (req: Request, ctx: any) => {
  if (!handlers || typeof handlers.POST !== 'function') {
    console.error('❌ handlers.POST not available');
    return new Response('Authentication handler not available', { status: 500 });
  }
  return handlers.POST(req, ctx);
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;