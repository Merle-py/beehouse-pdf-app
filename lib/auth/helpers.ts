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
export async function getAuthenticatedUser() {
    // ⚠️ TEMPORÁRIO: Bypass completo de autenticação para debug
    const tempDisableAuth = process.env.TEMP_DISABLE_AUTH === 'true';
    const devBypassAuth = process.env.DEV_BYPASS_AUTH === 'true';

    if (tempDisableAuth || devBypassAuth) {
        // Mock user para bypass
        return {
            user: {
                id: 38931, // Bitrix24 ID do usuário de desenvolvimento
                email: 'dev@beehouse.com',
                name: 'Dev User',
            },
            response: null,
        };
    }

    // Produção normal: verificar Supabase auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            user: null,
            response: NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            ),
        };
    }

    return {
        user: {
            id: parseInt(user.id), // Converter UUID para INT se necessário
            email: user.email || '',
            name: user.user_metadata?.name || '',
        },
        response: null,
    };
}
