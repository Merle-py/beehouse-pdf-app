import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

// Force dynamic rendering to use searchParams
export const dynamic = 'force-dynamic';

/**
 * GET /api/bitrix/properties
 * Lista todos os imóveis (SPA Items) cadastrados
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

        console.log('[API Properties] Buscando imóveis...');

        // Busca TODOS os imóveis com paginação
        let allProperties: any[] = [];
        let start = 0;
        const limit = 50;
        let hasMore = true;

        while (hasMore && start < 1000) {
            const response: any = await callBitrixAPI('crm.item.list', {
                entityTypeId: parseInt(entityTypeId),
                select: [
                    'id',
                    'title',
                    'ufCrm*', // Todos os campos customizados
                    'companyId',
                    'createdTime',
                    'updatedTime',
                    'ufCrm15_1767879091919', // Campo de autorização manual (ID exato)
                    'ufCrm15_1767882267145'  // Campo de arquivo de autorização (ID correto)
                ],
                order: { createdTime: 'DESC' },
                start,
                limit
            });

            const items = response?.items || [];
            allProperties = allProperties.concat(items);

            // DEBUG: Mostra os campos do primeiro imóvel para identificar o nome correto
            if (items.length > 0 && start === 0) {
                console.log('[API Properties] Campos do primeiro imóvel:', JSON.stringify(items[0], null, 2));
            }

            console.log(`[API Properties] Página ${Math.floor(start / limit) + 1}: ${items.length} imóveis`);

            hasMore = items.length === limit;
            start += limit;
        }

        console.log(`[API Properties] Total encontrado: ${allProperties.length} imóveis`);

        if (allProperties.length === 0) {
            return NextResponse.json({ properties: [] });
        }

        // Busca informações das empresas vinculadas
        const companyIds = allProperties
            .map((item: any) => item.companyId)
            .filter((id: any) => id);

        let companiesMap: Record<string, any> = {};

        if (companyIds.length > 0) {
            // Remove duplicatas
            const uniqueCompanyIds = [...new Set(companyIds)];

            // Busca empresas em lotes de 50
            for (let i = 0; i < uniqueCompanyIds.length; i += 50) {
                const batch = uniqueCompanyIds.slice(i, i + 50);
                const companiesResponse: any = await callBitrixAPI('crm.company.list', {
                    filter: { ID: batch },
                    select: ['ID', 'TITLE', 'COMPANY_TYPE']
                });

                if (companiesResponse) {
                    companiesResponse.forEach((company: any) => {
                        companiesMap[company.ID] = company;
                    });
                }
            }
        }

        // Formata os dados dos imóveis
        const properties = allProperties.map((item: any) => {
            const company = item.companyId ? companiesMap[item.companyId] : null;

            // Verifica autorização manual usando o ID exato do campo
            const hasManualAuth = item.ufCrm15_1767879091919 === 'Y' ||
                item.ufCrm15_1767879091919 === true ||
                item.ufCrm15_1767879091919 === '1' ||
                item.ufCrm15_1767879091919 === 1;

            // Verifica se tem arquivo de autorização assinado
            const authFile = item.ufCrm15_1767882267145;
            const hasSigned = authFile && authFile !== '' && authFile !== 'null' && authFile !== 'undefined';

            return {
                id: item.id,
                title: item.title,
                description: item.ufCrmPropertyDescription || item.title,
                address: item.ufCrmPropertyAddress || '',
                value: parseFloat(item.ufCrmPropertyValue || '0'),
                matricula: item.ufCrmPropertyMatricula || '',
                companyId: item.companyId,
                companyName: company?.TITLE || 'Sem empresa',
                companyType: company?.COMPANY_TYPE || '',
                createdTime: item.createdTime,
                updatedTime: item.updatedTime,
                hasAuthorization: hasManualAuth,
                ufCrmPropertyHasAuthorization: item.ufCrm15_1767879091919,
                hasSigned,
                authorizationFile: authFile
            };
        });

        return NextResponse.json({ properties });

    } catch (error: any) {
        console.error('Erro ao listar imóveis:', error);
        return NextResponse.json(
            { error: 'Erro ao listar imóveis', details: error.message },
            { status: 500 }
        );
    }
}
