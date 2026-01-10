import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI, validateUserToken } from '@/lib/bitrix/server-client';
import { getCachedData, generateCacheKey } from '@/lib/cache/vercel-kv';
import { extractBitrixCredentials } from '@/lib/utils/api-headers';
import type { BitrixCompany, BitrixPropertyItem } from '@/types/bitrix-api';

// Force dynamic rendering to use searchParams
export const dynamic = 'force-dynamic';

/**
 * GET /api/bitrix/properties
 * Lista todos os imóveis do Bitrix24
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

        // Valida o token do usuário
        const user = await validateUserToken(accessToken, domain);
        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 401 });
        }

        const entityTypeId = process.env.B24_PROPERTY_ENTITY_TYPE_ID;
        if (!entityTypeId) {
            return NextResponse.json(
                { error: 'B24_PROPERTY_ENTITY_TYPE_ID não configurado' },
                { status: 500 }
            );
        }

        console.log('[API Properties] Buscando imóveis...');

        // Gera chave de cache
        const cacheKey = generateCacheKey(domain, 'properties', 'all');

        const fetchPropertiesData = async () => {
            // Busca TODOS os imóveis com paginação
            let allProperties: BitrixPropertyItem[] = [];
            let start = 0;
            const limit = 50;
            let hasMore = true;

            while (hasMore && start < 1000) {
                const response = await callBitrixAPI('crm.item.list', {
                    entityTypeId: parseInt(entityTypeId),
                    select: [
                        'id',
                        'title',
                        'ufCrm*', // Todos os campos customizados
                        'companyId',
                        'assignedById',  // ID do usuário que criou o imóvel
                        'createdTime',
                        'updatedTime'
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
                return [];
            }

            // Busca informações das empresas vinculadas
            const companyIds = allProperties
                .map((item: BitrixPropertyItem) => item.companyId)
                .filter((id: any) => id);

            let companiesMap: Record<string, BitrixCompany> = {};

            if (companyIds.length > 0) {
                // Remove duplicatas
                const uniqueCompanyIds = [...new Set(companyIds)];

                // Busca empresas em lotes de 50
                for (let i = 0; i < uniqueCompanyIds.length; i += 50) {
                    const batch = uniqueCompanyIds.slice(i, i + 50);
                    const companiesResponse = await callBitrixAPI('crm.company.list', {
                        filter: { ID: batch },
                        select: ['ID', 'TITLE', 'COMPANY_TYPE']
                    });

                    if (companiesResponse) {
                        companiesResponse.forEach((company: BitrixCompany) => {
                            companiesMap[company.ID] = company;
                        });
                    }
                }
            }

            // Obtém IDs dos campos customizados das variáveis de ambiente
            const hasAuthFieldId = process.env.B24_PROPERTY_HAS_AUTHORIZATION_FIELD || 'ufCrm15_1767879091919';
            const authFileFieldId = process.env.B24_PROPERTY_AUTHORIZATION_FILE_FIELD || 'ufCrm15_1767882267145';

            // Formata os dados dos imóveis
            const properties = allProperties.map((item: BitrixPropertyItem) => {
                const company = item.companyId ? companiesMap[item.companyId] : null;

                // Verifica autorização manual usando o ID configurável do campo
                const hasManualAuth = item[hasAuthFieldId] === 'Y' ||
                    item[hasAuthFieldId] === true ||
                    item[hasAuthFieldId] === '1' ||
                    item[hasAuthFieldId] === 1;

                // Verifica se tem arquivo de autorização assinado
                const authFile = item[authFileFieldId];
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
                    assignedById: item.assignedById,  // ID do criador do imóvel
                    createdTime: item.createdTime,
                    updatedTime: item.updatedTime,
                    hasAuthorization: hasManualAuth,
                    ufCrmPropertyHasAuthorization: item[hasAuthFieldId],
                    hasSigned,
                    authorizationFile: authFile
                };
            });

            return properties;
        };

        // Usa cache
        const properties = await getCachedData(cacheKey, fetchPropertiesData);

        return NextResponse.json({ properties });

    } catch (error: any) {
        console.error('Erro ao listar imóveis:', error);
        return NextResponse.json(
            { error: 'Erro ao listar imóveis', details: error.message },
            { status: 500 }
        );
    }
}
