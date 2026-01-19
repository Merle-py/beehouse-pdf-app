import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export interface AuthResult {
    user: any | null;
    response?: NextResponse;
}

/**
 * Get authenticated user from Bitrix24 session cookie
 * In development mode with DEV_BYPASS_AUTH=true, returns a mock user
 * In production, reads beehouse_session cookie created by /api/auth/bitrix24
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
    // Development bypass (apenas localhost)
    if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
        console.log('[AUTH] Development bypass enabled - using mock user');
        return {
            user: {
                id: 38931, // Bitrix24 ID de desenvolvimento
                email: 'dev@localhost',
                name: 'Dev User',
            }
        };
    }

    // Produção: ler cookie de sessão criado pelo Bitrix24
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('beehouse_session');

    if (!sessionCookie) {
        return {
            user: null,
            response: NextResponse.json(
                { error: 'Não autenticado. Por favor, acesse via Bitrix24.' },
                { status: 401 }
            )
        };
    }

    try {
        // Decodificar cookie e extrair dados do usuário
        const sessionData = JSON.parse(
            Buffer.from(sessionCookie.value, 'base64').toString()
        );

        // Verificar se sessão não expirou (7 dias)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

        if (sessionAge > maxAge) {
            return {
                user: null,
                response: NextResponse.json(
                    { error: 'Sessão expirada. Por favor, faça login novamente.' },
                    { status: 401 }
                )
            };
        }

        return {
            user: {
                id: sessionData.userId,
                email: sessionData.email,
                name: sessionData.name,
                bitrixDomain: sessionData.bitrixDomain,
            }
        };
    } catch (error) {
        console.error('[AUTH] Error decoding session cookie:', error);
        return {
            user: null,
            response: NextResponse.json(
                { error: 'Sessão inválida' },
                { status: 401 }
            )
        };
    }
}
