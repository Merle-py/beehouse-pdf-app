import { createClient as createBrowserClient } from '@supabase/supabase-js';

/**
 * Get Supabase client for server-side operations
 * In development mode with bypass, uses service role to bypass RLS
 */
export function getSupabaseClient() {
    // Development bypass - use service role client to bypass RLS
    if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
        console.log('[SUPABASE] Development bypass - using service role client (bypasses RLS)');

        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                }
            }
        );
    }

    // Production - use regular server client with RLS
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
