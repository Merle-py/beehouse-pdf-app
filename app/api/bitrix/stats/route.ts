import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

/**
 * GET /api/bitrix/stats
 * Retorna estatísticas do dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const accessToken = searchParams.get('accessToken');
        const domain = searchParams.get('domain');

        if (!accessToken || !domain) {
            return NextResponse.json(
                { error: 'accessToken e domain são obrigatórios' },
                { status: 400 }
            );
        }

        // Valida o token do usuário
        const { validateUserToken } = await import('@/lib/bitrix/server-client');
        const user = await validateUserToken(accessToken, domain);

        if (!user) {
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 401 }
            );
        }

        const entityTypeId = process.env.B24_PROPERTY_ENTITY_TYPE_ID;
        if (!entityTypeId) {
            return NextResponse.json(
                { error: 'B24_PROPERTY_ENTITY_TYPE_ID não configurado' },
                { status: 500 }
            );
        }

        // Busca total de empresas
        const companiesResponse: any = await callBitrixAPI('crm.company.list', {
            select: ['ID']
        });
        const totalCompanies = companiesResponse.total || 0;

        // Busca total de imóveis
        const propertiesResponse: any = await callBitrixAPI('crm.item.list', {
            entityTypeId: parseInt(entityTypeId),
            select: ['id']
        });
        const totalProperties = propertiesResponse.total || 0;

        // Busca total de autorizações (empresas com campo UF_CRM_AUTHORIZATION_PDF preenchido)
        const authorizationsResponse: any = await callBitrixAPI('crm.company.list', {
            filter: { '!UF_CRM_AUTHORIZATION_PDF': '' },
            select: ['ID']
        });
        const totalAuthorizations = authorizationsResponse.total || 0;

        // Calcula autorizações pendentes (empresas sem PDF)
        const pendingAuthorizations = totalCompanies - totalAuthorizations;

        return NextResponse.json({
            stats: {
                totalCompanies,
                totalProperties,
                totalAuthorizations,
                pendingAuthorizations: Math.max(0, pendingAuthorizations)
            }
        });

    } catch (error: any) {
        console.error('Erro ao buscar estatísticas:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar estatísticas', details: error.message },
            { status: 500 }
        );
    }
}
