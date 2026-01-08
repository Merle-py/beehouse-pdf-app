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

        console.log('[API Stats] Calculando estatísticas...');

        // Conta total de empresas (paginado)
        let totalCompanies = 0;
        let start = 0;
        let hasMore = true;

        while (hasMore && start < 1000) {
            const companiesResponse: any = await callBitrixAPI('crm.company.list', {
                select: ['ID'],
                start,
                limit: 50
            });
            const companies = companiesResponse || [];
            totalCompanies += companies.length;
            hasMore = companies.length === 50;
            start += 50;
        }

        console.log(`[API Stats] Total de empresas: ${totalCompanies}`);

        // Conta total de imóveis (paginado)
        let totalProperties = 0;
        start = 0;
        hasMore = true;

        while (hasMore && start < 1000) {
            const propertiesResponse: any = await callBitrixAPI('crm.item.list', {
                entityTypeId: parseInt(entityTypeId),
                select: ['id'],
                start,
                limit: 50
            });
            const properties = propertiesResponse?.items || [];
            totalProperties += properties.length;
            hasMore = properties.length === 50;
            start += 50;
        }

        console.log(`[API Stats] Total de imóveis: ${totalProperties}`);

        // Conta total de autorizações (empresas com PDF)
        let totalAuthorizations = 0;
        start = 0;
        hasMore = true;

        while (hasMore && start < 1000) {
            const authorizationsResponse: any = await callBitrixAPI('crm.company.list', {
                filter: { '!UF_CRM_AUTHORIZATION_PDF': '' },
                select: ['ID'],
                start,
                limit: 50
            });
            const authorizations = authorizationsResponse || [];
            totalAuthorizations += authorizations.length;
            hasMore = authorizations.length === 50;
            start += 50;
        }

        console.log(`[API Stats] Total de autorizações: ${totalAuthorizations}`);

        // Calcula autorizações pendentes
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
