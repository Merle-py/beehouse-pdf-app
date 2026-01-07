import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

export const dynamic = 'force-dynamic';

/**
 * API Route: Verifica se o usuário atual é Administrador
 * Retorna o status de admin e informações do usuário
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'User ID não fornecido'
            }, { status: 400 });
        }

        console.log(`[API User Info] Verificando usuário ${userId}`);

        // Busca informações do usuário via API Bitrix24
        const users = await callBitrixAPI<any[]>('user.get', {
            ID: userId,
            ADMIN_MODE: true
        });

        if (!users || users.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Usuário não encontrado'
            }, { status: 404 });
        }

        const user = users[0];
        const isAdmin = user.IS_ADMIN === 'Y' || user.IS_ADMIN === true;

        return NextResponse.json({
            success: true,
            isAdmin,
            user: {
                id: user.ID,
                name: user.NAME,
                lastName: user.LAST_NAME,
                fullName: `${user.NAME} ${user.LAST_NAME}`.trim()
            }
        });

    } catch (error: any) {
        console.error('[API User Info] Erro:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao verificar usuário',
            details: error.message
        }, { status: 500 });
    }
}
