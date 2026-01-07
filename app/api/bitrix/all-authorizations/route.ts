import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

/**
 * API Route: Listar TODAS as autorizações (apenas nomes)
 * 
 * Retorna lista de Companies com seus Property Items vinculados
 * Mostra apenas: ID, Nome da Company, Nomes dos Imóveis, Criador
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        console.log('[API All] Buscando todas as autorizações...');

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
        return NextResponse.json({
            success: false,
            error: 'Erro ao buscar autorizações',
            details: error.message
        }, { status: 500 });
    }
}
