import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import type { Database } from '@/types/database.types.js'
import { HttpError } from '../lib/httpError.js';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

export const SUPABASE_URL = process.env.SUPABASE_URL as string;
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY as string;
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export type TypedSupabaseClient = SupabaseClient<Database>;


declare module 'express-serve-static-core' {
    interface Request {
      supabaseUser?: User;
      supabaseAccessToken?: string;
      supabaseAsUser?: TypedSupabaseClient;
    }
}

// Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
// Request<P, unknown, B, Q, Record<string, any>>

export interface AuthenticatedRequest<              // Defining a generic interface that takes three params and is based on the Request type
    B = unknown,                                      // 1) Req Body type
    P extends ParamsDictionary = ParamsDictionary,    // 2) Route Params type - Must extend ParamsDictionary, default to ParamsDictionary
    Q = ParsedQs                                      // 3) Querystring type
> extends Request<P, unknown, B, Q> {               // Specialise the Express Request type by mapping our interface type parameters
    supabaseUser: User;                               //   Additional properties added to Request type
    supabaseAccessToken: string;
    supabaseAsUser: TypedSupabaseClient;
}

/*
type Body = { name: string };
type Params = { roomId: string };

async function updateRoom(
  req: AuthenticatedRequest<Body, Params>,   <- Use Authentic Request type to wrap other types input as parameters
  res: Response                                 Only passing one argument assumes it is the first parameter
) {
  // req.body.name is string
  // req.params.roomId is string
  // req.supabaseUser is present
  res.sendStatus(204);
}
*/


function extractBearer(req: Request): string | null {
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) return h.slice(7);
    return null;
}
  
function getAccessToken(req: Request): string | null {
    return extractBearer(req);
}

// Sync wrapper function that accepts standard middleware typed parameters and returns void
// When run by route, it triggers the nested async IIFE (Immediately Invoked Function Expression)
export function requireSupabaseUser(req: Request, _res: Response, next: NextFunction): asserts req is Request & { supabaseAsUser: TypedSupabaseClient } {
    void (async () => {
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
            console.log('SUPABASE_URL', SUPABASE_URL)
            console.log('SUPABASE_PUBLISHABLE_KEY', SUPABASE_PUBLISHABLE_KEY)
            throw HttpError.Internal('Supabase env vars not configured'); // If any of the throw statements are triggered, this rejects the promise returned
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

        next(); // If all executes successfully, move on to next middleware
    })() // Call and execute (IIFE) returns a promise to the scope of the wrapper function
    .catch(next); // If promise is rejected, use the promis' .catch method to pass the error. Shorthand for .catch(error => next(error)). Skips directly to error middleware
}