import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI, validateUserToken } from '@/lib/bitrix/server-client';
import { extractBitrixCredentials } from '@/lib/utils/api-headers';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

/**
 * API Route: Listar TODAS as autorizações (apenas nomes)
 * 
 * 🔒 SEGURO: Requer autenticação via token
 * Headers (recomendado):
 *   X-Bitrix-Token: <accessToken>
 *   X-Bitrix-Domain: <domain>
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const credentials = extractBitrixCredentials(request);

        if (!credentials) {
            return NextResponse.json({
                success: false,
                error: 'Autenticação necessária'
            }, { status: 401 });
        }

        const { accessToken, domain } = credentials;

        console.log('[API All] Validando token...');

        // Valida token (garante que é um usuário autenticado)
        await validateUserToken(accessToken, domain);

        console.log('[API All] Token validado - Buscando autorizações...');

        // Busca TODAS as Companies que têm o padrão de COMMENTS de autorização
        const companies = await callBitrixAPI('crm.company.list', {
            filter: {
                '%COMMENTS': 'Autorização criada por'
            },
            select: ['ID', 'TITLE', 'DATE_CREATE', 'COMMENTS'],
            order: { DATE_CREATE: 'DESC' }
        });

        if (!companies || !Array.isArray(companies)) {
            return NextResponse.json({
                success: true,
                authorizations: []
            });
        }

        // Para cada Company, buscar Property Items vinculados
        const authorizations = await Promise.all(
            companies.map(async (company: any) => {
                // Extrair ID do corretor dos comentários
                const createdByMatch = company.COMMENTS?.match(/\(ID: ([^\)]+)\)/);
                const createdBy = createdByMatch ? createdByMatch[1] : null;

                const createdByNameMatch = company.COMMENTS?.match(/por: ([^\(]+)/);
                const createdByName = createdByNameMatch
                    ? createdByNameMatch[1].trim()
                    : 'Desconhecido';

                // Buscar Property Items vinculados
                let properties = [];
                try {
                    const items = await callBitrixAPI('crm.item.list', {
                        entityTypeId: parseInt(process.env.B24_PROPERTY_ENTITY_TYPE_ID || '0'),
                        filter: {
                            COMPANY_ID: company.ID
                        },
                        select: ['ID', 'TITLE']
                    });

                    properties = items?.map((item: any) => ({
                        id: item.ID,
                        name: item.TITLE || 'Sem nome'
                    })) || [];
                } catch (error) {
                    console.warn(`[API All] Erro ao buscar imóveis da company ${company.ID}`);
                }

                return {
                    companyId: company.ID,
                    companyName: company.TITLE,
                    createdAt: company.DATE_CREATE,
                    createdBy,
                    createdByName,
                    properties
                };
            })
        );

        console.log('[API All] Total de autorizações:', authorizations.length);

        return NextResponse.json({
            success: true,
            authorizations
        });

    } catch (error: any) {
        console.error('[API All] Erro:', error);

        // Erro de autenticação
        if (error.message.includes('inválido') || error.message.includes('expirado')) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido ou expirado'
            }, { status: 401 });
        }

        return NextResponse.json({
            success: false,
            error: 'Erro ao buscar autorizações',
            details: error.message
        }, { status: 500 });
    }
}
