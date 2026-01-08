import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI, validateUserToken } from '@/lib/bitrix/server-client';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

/**
 * API Route: Detalhes de uma Autorização específica
 * 
 * Retorna dados completos se o usuário for o criador ou admin
 * Retorna apenas informações básicas para outros corretores
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { companyId: string } }
): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const accessToken = searchParams.get('accessToken');
        const domain = searchParams.get('domain');
        const companyId = params.companyId;

        if (!companyId) {
            return NextResponse.json({
                success: false,
                error: 'Company ID não fornecido'
            }, { status: 400 });
        }

        if (!accessToken || !domain) {
            return NextResponse.json({
                success: false,
                error: 'Token de autenticação não fornecido'
            }, { status: 400 });
        }

        console.log(`[API Detail] Buscando Company ${companyId}...`);

        // 🔒 VALIDAÇÃO SEGURA: Valida o token e obtém userId real
        const userInfo = await validateUserToken(accessToken, domain);
        const brokerId = userInfo.userId;
        const isAdmin = userInfo.isAdmin;

        console.log(`[API Detail] Token validado - User ID: ${brokerId}, Admin: ${isAdmin}`);

        // Busca a Company
        const company = await callBitrixAPI('crm.company.get', {
            id: companyId
        });

        if (!company) {
            return NextResponse.json({
                success: false,
                error: 'Autorização não encontrada'
            }, { status: 404 });
        }

        // Extrai quem criou do campo COMMENTS
        const createdByMatch = company.COMMENTS?.match(/\(ID: ([^\)]+)\)/);
        const createdBy = createdByMatch ? createdByMatch[1] : null;

        // Verifica se é dono
        const isOwner = brokerId && createdBy === brokerId;

        console.log(`[API Detail] Permissões - isOwner: ${isOwner}, isAdmin: ${isAdmin}`);

        // Busca imóveis vinculados (SPA Items)
        const entityTypeId = process.env.B24_PROPERTY_ENTITY_TYPE_ID;
        let properties: any[] = [];

        if (entityTypeId) {
            try {
                const propertiesResult = await callBitrixAPI('crm.item.list', {
                    entityTypeId: parseInt(entityTypeId),
                    filter: { companyId: companyId },
                    select: ['*', 'ufCrm*']
                });

                // Garante que properties é sempre um array
                properties = Array.isArray(propertiesResult?.items)
                    ? propertiesResult.items
                    : (propertiesResult?.items ? [propertiesResult.items] : []);

                console.log(`[API Detail] Encontrados ${properties.length} imóveis`);
            } catch (err) {
                console.error('[API Detail] Erro ao buscar imóveis:', err);
                properties = [];
            }
        }

        // Determina permissões
        const canEdit = isOwner || isAdmin;
        const canDelete = isOwner || isAdmin;

        console.log(`[API Detail] Permissões - Owner: ${isOwner}, Edit: ${canEdit}, Delete: ${canDelete}`);

        // Retorna dados completos se tiver permissão
        if (canEdit) {
            return NextResponse.json({
                success: true,
                isOwner,
                isAdmin,
                company,
                properties,
                canEdit,
                canDelete
            });
        }

        // Retorna dados limitados para outros corretores
        return NextResponse.json({
            success: true,
            isOwner: false,
            isAdmin: false,
            company: {
                ID: company.ID,
                TITLE: company.TITLE,
                DATE_CREATE: company.DATE_CREATE
            },
            properties: properties.map(p => ({
                ID: p.ID,
                TITLE: p.TITLE
            })),
            canEdit: false,
            canDelete: false,
            message: 'Esta autorização foi criada por outro corretor. Você pode ver apenas informações básicas.'
        });

    } catch (error: any) {
        console.error('[API Detail] Erro:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao buscar autorização',
            details: error.message
        }, { status: 500 });
    }
}
