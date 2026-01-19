import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/check
 * 
 * Verifica se o usuário tem uma sessão válida
 */
export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('beehouse_session');

        if (!sessionCookie) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        // Verificar validade
        const sessionData = JSON.parse(
            Buffer.from(sessionCookie.value, 'base64').toString()
        );

        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000;

        if (sessionAge > maxAge) {
            return NextResponse.json(
                { authenticated: false, reason: 'expired' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: sessionData.userId,
                name: sessionData.name,
                email: sessionData.email,
            }
        });
    } catch (error) {
        return NextResponse.json(
            { authenticated: false, reason: 'invalid' },
            { status: 401 }
        );
    }
}
