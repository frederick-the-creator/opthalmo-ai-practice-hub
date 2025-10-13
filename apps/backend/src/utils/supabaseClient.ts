import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import type { Database } from '@/types/database.types.js'
import { HttpError } from '@/lib/httpError.js';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
export const SUPABASE_URL = process.env.SUPABASE_URL as string;
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY as string;
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export type TypedSupabaseClient = SupabaseClient<Database>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      supabaseUser?: User;
      supabaseAccessToken?: string;
      supabaseAsUser?: TypedSupabaseClient;
    }
  }
}

export interface AuthenticatedRequest<
  B = unknown,
  P extends ParamsDictionary = ParamsDictionary,
  Q = ParsedQs
> extends Request<P, unknown, B, Q> {
  supabaseUser: User;
  supabaseAccessToken: string;
  supabaseAsUser: TypedSupabaseClient;
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

export function requireSupabaseUser(req: Request, _res: Response, next: NextFunction) {
  void (async () => {
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw HttpError.Internal('Supabase env vars not configured');
    }

    const token = getAccessToken(req);
    if (!token) throw HttpError.Unauthorized('Missing access token');

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) throw HttpError.Unauthorized('Invalid or expired token');

    req.supabaseUser = data.user; // type this to `User` in your express.d.ts
    req.supabaseAccessToken = token;
    req.supabaseAsUser = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    next();
  })().catch(next); // ← forward any rejection to the error middleware
}

/**
 * Create a Supabase client authenticated with the Secret key (admin privileges).
 * Used by services to access auth.admin endpoints.
 */
export function createAdminSupabaseClient(): TypedSupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('Supabase admin client not configured. Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY);
}
