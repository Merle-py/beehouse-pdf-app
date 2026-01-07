import { NextRequest, NextResponse } from 'next/server';
import { callAsUser } from '@/lib/bitrix/oauth-manager';

/**
 * API Route: Listagem de autorizações do corretor
 * 
 * Retorna Companies e Items criados pelo corretor específico
 * (filtrado pelo campo COMMENTS que contém o brokerId)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const brokerId = searchParams.get('brokerId');

        if (!brokerId) {
            return NextResponse.json({
                success: false,
                error: 'brokerId é obrigatório'
            }, { status: 400 });
        }

        console.log('[API List] Buscando autorizações do broker:', brokerId);

        // Buscar companies que foram criadas por este corretor
        // (filtrando pelo campo COMMENTS que contém o brokerId)
        try {
            const companies = await callAsUser('crm.company.list', {
                filter: {
                    '%COMMENTS': `(ID: ${brokerId})`
                },
                select: ['ID', 'TITLE', 'DATE_CREATE', 'COMMENTS']
            }, brokerId);

            console.log('[API List] Encontradas', companies?.length || 0, 'companies');

            return NextResponse.json({
                success: true,
                companies: companies || [],
                count: companies?.length || 0
            }, { status: 200 });

        } catch (error: any) {
            console.error('[API List] Erro ao buscar companies:', error.message);
            return NextResponse.json({
                success: false,
                error: 'Erro ao buscar autorizações',
                details: error.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[API List] Erro inesperado:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message
        }, { status: 500 });
    }
}
