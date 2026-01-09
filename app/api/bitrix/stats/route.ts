import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';
import { getCachedData, generateCacheKey } from '@/lib/cache/vercel-kv';

// Force dynamic rendering to use searchParams
export const dynamic = 'force-dynamic';

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

        // Gera chave de cache
        const cacheKey = generateCacheKey(domain, 'stats', 'dashboard');

        const fetchStatsData = async () => {
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

            // Conta total de autorizações (empresas com PDF de autorização)
            let totalAuthorizations = 0;
            start = 0;
            hasMore = true;

            while (hasMore && start < 1000) {
                const companiesResponse: any = await callBitrixAPI('crm.company.list', {
                    select: ['ID', 'UF_CRM_AUTHORIZATION_PDF'],
                    start,
                    limit: 50
                });
                const allCompanies = companiesResponse || [];

                const companiesWithPDF = allCompanies.filter((company: any) => {
                    const pdf = company.UF_CRM_AUTHORIZATION_PDF;
                    return pdf && pdf.trim() !== '' && pdf !== 'null' && pdf !== 'undefined';
                });

                totalAuthorizations += companiesWithPDF.length;
                hasMore = allCompanies.length === 50;
                start += 50;
            }

            console.log(`[API Stats] Total de autorizações: ${totalAuthorizations}`);

            // Conta imóveis SEM autorização
            let propertiesWithAuthorization = 0;
            start = 0;
            hasMore = true;

            while (hasMore && start < 1000) {
                const propertiesResponse: any = await callBitrixAPI('crm.item.list', {
                    entityTypeId: parseInt(entityTypeId),
                    select: ['id', 'ufCrm15_1767879091919'],
                    start,
                    limit: 50
                });
                const properties = propertiesResponse?.items || [];

                const withAuth = properties.filter((prop: any) => {
                    const fieldValue = prop.ufCrm15_1767879091919;
                    return fieldValue === 'Y' || fieldValue === true || fieldValue === '1' || fieldValue === 1;
                });

                propertiesWithAuthorization += withAuth.length;
                hasMore = properties.length === 50;
                start += 50;
            }

            console.log(`[API Stats] Imóveis com autorização manual: ${propertiesWithAuthorization}`);

            // Conta imóveis com arquivo de autorização assinado
            let propertiesWithSignedAuth = 0;
            start = 0;
            hasMore = true;

            while (hasMore && start < 1000) {
                const propertiesResponse: any = await callBitrixAPI('crm.item.list', {
                    entityTypeId: parseInt(entityTypeId),
                    select: ['id', 'ufCrm15_1767882267145'],
                    start,
                    limit: 50
                });
                const properties = propertiesResponse?.items || [];

                const withFile = properties.filter((prop: any) => {
                    const fileField = prop.ufCrm15_1767882267145;
                    return fileField && fileField !== '' && fileField !== 'null' && fileField !== 'undefined';
                });

                propertiesWithSignedAuth += withFile.length;
                hasMore = properties.length === 50;
                start += 50;
            }

            console.log(`[API Stats] Imóveis com autorização assinada: ${propertiesWithSignedAuth}`);

            const pendingAuthorizations = Math.max(0, totalProperties - totalAuthorizations - propertiesWithAuthorization);
            const pendingSignatures = Math.max(0, (totalAuthorizations + propertiesWithAuthorization) - propertiesWithSignedAuth);

            return {
                totalCompanies,
                totalProperties,
                totalAuthorizations: totalAuthorizations + propertiesWithAuthorization,
                pendingAuthorizations,
                signedAuthorizations: propertiesWithSignedAuth,
                pendingSignatures
            };
        };

        // Usa cache com TTL de 1 minuto
        const stats = await getCachedData(cacheKey, fetchStatsData, { ttl: 60 });

        return NextResponse.json({ stats });

    } catch (error: any) {
        console.error('Erro ao buscar estatísticas:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar estatísticas', details: error.message },
            { status: 500 }
        );
    }
}
