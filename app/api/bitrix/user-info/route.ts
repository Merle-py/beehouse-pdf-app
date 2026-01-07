import { NextRequest, NextResponse } from 'next/server';
import { validateUserToken } from '@/lib/bitrix/server-client';

export const dynamic = 'force-dynamic';

/**
 * API Route: Verifica se o usuário atual é Administrador
 * Valida o access_token server-side - IMPOSSÍVEL de falsificar
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const accessToken = searchParams.get('accessToken');
        const domain = searchParams.get('domain');

        if (!accessToken || !domain) {
            return NextResponse.json({
                success: false,
                error: 'Access token e domain são obrigatórios'
            }, { status: 400 });
        }

        console.log(`[API User Info] Validando token...`);

        // 🔒 VALIDAÇÃO SEGURA: O servidor valida o token com o Bitrix24
        // Não confiamos no userId enviado pelo cliente
        const userInfo = await validateUserToken(accessToken, domain);

        return NextResponse.json({
            success: true,
            isAdmin: userInfo.isAdmin,
            user: {
                id: userInfo.userId,
                name: userInfo.name,
                lastName: userInfo.lastName,
                fullName: `${userInfo.name} ${userInfo.lastName}`.trim()
            }
        });

    } catch (error: any) {
        console.error('[API User Info] Erro:', error);

        // Erros específicos de token inválido
        if (error.message.includes('inválido') || error.message.includes('expirado')) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido ou expirado'
            }, { status: 401 });
        }

        return NextResponse.json({
            success: false,
            error: 'Erro ao verificar usuário',
            details: error.message
        }, { status: 500 });
    }
}
