import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface AuthResult {
    user: any | null;
    response?: NextResponse;
}

/**
 * Get authenticated user with development bypass
 * In development mode with DEV_BYPASS_AUTH=true, returns a mock user
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
    const supabase = createClient();

    // Development bypass
    if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
        console.log('[AUTH] Development bypass enabled - using mock user');
        return {
            user: {
                // Use Bitrix24 user ID (INTEGER, not UUID)
                // This mirrors Bitrix24's user.id for permission checking
                id: 38931, // Your Bitrix24 user ID
                email: 'dev@localhost',
                role: 'authenticated',
            }
        };
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            user: null,
            response: NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        };
    }

    return { user };
}
