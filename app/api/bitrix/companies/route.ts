import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';
import { getCachedData, generateCacheKey } from '@/lib/cache/vercel-kv';

// Force dynamic rendering to use searchParams
export const dynamic = 'force-dynamic';

/**
 * API Route: Lista/Busca de Empresas
 * 
 * GET /api/bitrix/companies - Lista todas as empresas
 * GET /api/bitrix/companies?search=termo - Busca empresas por termo
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const searchTerm = searchParams.get('search');
        const accessToken = searchParams.get('accessToken');
        const domain = searchParams.get('domain');

        // Valida autenticação
        if (!accessToken || !domain) {
            return NextResponse.json({
                success: false,
                error: 'accessToken e domain são obrigatórios'
            }, { status: 400 });
        }

        // Valida o token do usuário
        const { validateUserToken } = await import('@/lib/bitrix/server-client');
        const user = await validateUserToken(accessToken, domain);

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 401 });
        }

        console.log('[API Companies] Buscando empresas...', searchTerm ? `Termo: ${searchTerm}` : 'Todas');

        // Gera chave de cache baseada no domínio e termo de busca
        const cacheKey = generateCacheKey(domain, 'companies', searchTerm || 'all');

        // Usa cache se não houver termo de busca (listagem completa)
        const shouldCache = !searchTerm; // Cache apenas para listagem completa

        const fetchCompaniesData = async () => {
            // Monta filtro de busca
            const filter: any = {};
            if (searchTerm && searchTerm.length >= 2) {
                filter['%TITLE'] = searchTerm;
            }

            // Busca TODAS as empresas com paginação
            let allCompanies: any[] = [];
            let start = 0;
            const limit = 50; // Limite por página do Bitrix24
            let hasMore = true;

            while (hasMore) {
                const response: any = await callBitrixAPI('crm.company.list', {
                    filter,
                    select: [
                        'ID',
                        'TITLE',
                        'COMPANY_TYPE',
                        'UF_CRM_*', // Todos os campos customizados
                        'EMAIL',
                        'PHONE',
                        'ASSIGNED_BY_ID',  // ID do usuário que criou a empresa
                        'CREATED_TIME'
                    ],
                    order: { CREATED_TIME: 'DESC' },
                    start,
                    limit
                });

                const companies = response || [];
                allCompanies = allCompanies.concat(companies);

                console.log(`[API Companies] Página ${Math.floor(start / limit) + 1}: ${companies.length} empresas`);

                // Verifica se há mais páginas
                hasMore = companies.length === limit;
                start += limit;

                // Proteção contra loop infinito
                if (start > 1000) {
                    console.warn('[API Companies] Limite de 1000 empresas atingido');
                    break;
                }
            }

            let companies = allCompanies;

            console.log('[API Companies] Total encontrado:', companies.length, 'empresas');

            // Busca contagem de imóveis para cada empresa
            const entityTypeId = process.env.B24_PROPERTY_ENTITY_TYPE_ID;
            if (entityTypeId && companies.length > 0) {
                try {
                    console.log('[API Companies] Buscando imóveis para contagem...');

                    // Busca TODOS os imóveis com paginação
                    let allProperties: any[] = [];
                    let start = 0;
                    const limit = 50; // Limite por página do Bitrix24
                    let hasMore = true;

                    while (hasMore) {
                        const propertiesResponse: any = await callBitrixAPI('crm.item.list', {
                            entityTypeId: parseInt(entityTypeId),
                            select: ['id', 'companyId'],
                            start,
                            limit
                        });

                        const items = propertiesResponse?.items || [];
                        allProperties = allProperties.concat(items);

                        console.log(`[API Companies] Página ${Math.floor(start / limit) + 1}: ${items.length} imóveis`);

                        // Verifica se há mais páginas
                        hasMore = items.length === limit;
                        start += limit;

                        // Proteção contra loop infinito
                        if (start > 1000) {
                            console.warn('[API Companies] Limite de 1000 imóveis atingido');
                            break;
                        }
                    }

                    console.log(`[API Companies] Total de imóveis encontrados: ${allProperties.length}`);

                    // Conta imóveis por empresa
                    const propertyCountMap: Record<string, number> = {};
                    allProperties.forEach((property: any) => {
                        if (property.companyId) {
                            propertyCountMap[property.companyId] = (propertyCountMap[property.companyId] || 0) + 1;
                        }
                    });

                    // Adiciona contagem aos dados das empresas
                    companies = companies.map((company: any) => ({
                        ...company,
                        propertyCount: propertyCountMap[company.ID] || 0
                    }));

                    console.log('[API Companies] Contagem de imóveis adicionada');
                } catch (err) {
                    console.error('[API Companies] Erro ao contar imóveis:', err);
                    // Continua sem a contagem se houver erro
                }
            }

            return companies;
        };

        // Se deve usar cache, usa getCachedData; caso contrário, busca diretamente
        const companies = shouldCache
            ? await getCachedData(cacheKey, fetchCompaniesData)
            : await fetchCompaniesData();

        return NextResponse.json({
            success: true,
            companies
        }, { status: 200 });

    } catch (error: any) {
        console.error('[API Companies] Erro:', error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro ao buscar empresas',
            details: error.message
        }, { status: 500 });
    }
}
