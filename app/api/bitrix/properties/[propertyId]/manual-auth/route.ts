import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI, validateUserToken } from '@/lib/bitrix/server-client';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/bitrix/properties/[propertyId]/manual-auth
 * Atualiza flag de autorização manual de um imóvel (apenas admins)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { propertyId: string } }
): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const accessToken = searchParams.get('accessToken');
        const domain = searchParams.get('domain');
        const propertyId = params.propertyId;

        if (!propertyId) {
            return NextResponse.json({
                success: false,
                error: 'Property ID não fornecido'
            }, { status: 400 });
        }

        if (!accessToken || !domain) {
            return NextResponse.json({
                success: false,
                error: 'Token de autenticação não fornecido'
            }, { status: 400 });
        }

        // Valida o token e verifica se é admin
        const userInfo = await validateUserToken(accessToken, domain);

        if (!userInfo.isAdmin) {
            return NextResponse.json({
                success: false,
                error: 'Apenas administradores podem marcar autorizações manuais'
            }, { status: 403 });
        }

        console.log(`[API Manual Auth] Admin ${userInfo.userId} atualizando imóvel ${propertyId}`);

        // Lê o body da requisição
        const body = await request.json();
        const hasAuthorization = body.hasAuthorization === true || body.hasAuthorization === 'Y';

        const entityTypeId = process.env.B24_PROPERTY_ENTITY_TYPE_ID;
        if (!entityTypeId) {
            return NextResponse.json({
                success: false,
                error: 'B24_PROPERTY_ENTITY_TYPE_ID não configurado'
            }, { status: 500 });
        }

        // Atualiza o campo customizado no Bitrix24
        const updateResponse = await callBitrixAPI('crm.item.update', {
            entityTypeId: parseInt(entityTypeId),
            id: parseInt(propertyId),
            fields: {
                [process.env.B24_PROPERTY_HAS_AUTHORIZATION_FIELD || 'UF_CRM_15_1767879091919']: hasAuthorization ? 'Y' : 'N'
            }
        });

        console.log('[API Manual Auth] Atualização concluída:', updateResponse);

        return NextResponse.json({
            success: true,
            propertyId,
            hasAuthorization
        });

    } catch (error: any) {
        console.error('[API Manual Auth] Erro:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao atualizar autorização manual',
            details: error.message
        }, { status: 500 });
    }
}
