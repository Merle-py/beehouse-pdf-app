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

        // Busca dados da empresa
        const companyResponse: any = await callBitrixAPI('crm.company.get', {
            id: companyId
        });

        if (!companyResponse) {
            return NextResponse.json({
                success: false,
                error: 'Empresa não encontrada'
            }, { status: 404 });
        }

        const company = companyResponse;

        // Verifica se o usuário é o responsável pela empresa (ASSIGNED_BY_ID)
        const assignedById = company.ASSIGNED_BY_ID ? parseInt(String(company.ASSIGNED_BY_ID)) : null;
        const isOwner = assignedById === userInfo.userId;

        console.log('[API Authorization] Verificação de acesso:', {
            userId: userInfo.userId,
            assignedById,
            isOwner,
            isAdmin: userInfo.isAdmin
        });

        // Se não é owner nem admin, retorna dados limitados
        if (!isOwner && !userInfo.isAdmin) {
            return NextResponse.json({
                success: true,
                company: {
                    ID: company.ID,
                    TITLE: company.TITLE,
                    COMPANY_TYPE: company.COMPANY_TYPE
                },
                properties: [],
                isOwner: false,
                isAdmin: false,
                hasAccess: false
            });
        }

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
                canDelete,
                hasAccess: true
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
