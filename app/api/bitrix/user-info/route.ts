import { NextRequest, NextResponse } from 'next/server';
import { validateUserToken } from '@/lib/bitrix/server-client';
import { extractBitrixCredentials } from '@/lib/utils/api-headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bitrix/user-info
 * Retorna informações do usuário atual
 * 
 * Headers (recomendado):
 *   X-Bitrix-Token: <accessToken>
 *   X-Bitrix-Domain: <domain>
 */
export async function GET(request: NextRequest) {
    try {
        const credentials = extractBitrixCredentials(request);

        if (!credentials) {
            return NextResponse.json({
                success: false,
                error: 'Credenciais Bitrix24 não fornecidas'
            }, { status: 401 });
        }

        const { accessToken, domain } = credentials;

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
