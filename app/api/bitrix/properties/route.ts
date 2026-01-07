import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

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

        // Busca todos os imóveis (SPA Items)
        const response: any = await callBitrixAPI('crm.item.list', {
            entityTypeId: parseInt(entityTypeId),
            select: [
                'id',
                'title',
                'ufCrm*', // Todos os campos customizados
                'companyId',
                'createdTime',
                'updatedTime'
            ],
            order: { createdTime: 'DESC' }
        });

        if (!response.result || !response.result.items) {
            return NextResponse.json({ properties: [] });
        }

        // Busca informações das empresas vinculadas
        const companyIds = response.result.items
            .map((item: any) => item.companyId)
            .filter((id: any) => id);

        let companiesMap: Record<string, any> = {};

        if (companyIds.length > 0) {
            const companiesResponse: any = await callBitrixAPI('crm.company.list', {
                filter: { ID: companyIds },
                select: ['ID', 'TITLE', 'COMPANY_TYPE']
            });

            if (companiesResponse.result) {
                companiesMap = companiesResponse.result.reduce((acc: any, company: any) => {
                    acc[company.ID] = company;
                    return acc;
                }, {});
            }
        }

        // Formata os dados dos imóveis
        const properties = response.result.items.map((item: any) => {
            const company = item.companyId ? companiesMap[item.companyId] : null;

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
                hasAuthorization: false // TODO: verificar se tem autorização
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
