import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import type { Database } from '@/types/database.types.js'

export const SUPABASE_URL = process.env.SUPABASE_URL as string;
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY as string;
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY as string | undefined;

export type TypedSupabaseClient = SupabaseClient<Database>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      supabaseUser?: { id: string; [k: string]: any };
      supabaseAccessToken?: string;
      supabaseAsUser?: TypedSupabaseClient;
    }
  }
}

function extractBearer(req: Request): string | null {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

function getAccessToken(req: Request): string | null {
  // Only support Authorization header (no cookies)
  return extractBearer(req);
}

export async function requireSupabaseUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return res.status(500).json({ error: 'Supabase env vars not configured' });
    }

    const token = getAccessToken(req);
    if (!token) return res.status(401).json({ error: 'Missing access token' });

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.supabaseUser = data.user as any;
    req.supabaseAccessToken = token;
    req.supabaseAsUser = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    return next();
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Auth middleware failed' });
  }
}

/**
 * Create a Supabase client authenticated with the Secret key (admin privileges).
 * Used by services to access auth.admin endpoints.
 */
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('Supabase admin client not configured. Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY);
}
