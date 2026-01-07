import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

/**
 * Verifica se o usuário é Administrador no Bitrix24 (SERVER-SIDE)
 * Isso garante segurança, pois a validação não pode ser manipulada pelo cliente
 */
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
    try {
        const users = await callBitrixAPI<any[]>('user.get', {
            ID: userId,
            ADMIN_MODE: true
        });

        if (!users || users.length === 0) {
            return false;
        }

        const user = users[0];

        // Verifica se o usuário tem permissão de administrador
        // IS_ADMIN pode retornar "Y" ou true dependendo da versão do Bitrix24
        return user.IS_ADMIN === 'Y' || user.IS_ADMIN === true;
    } catch (error) {
        console.error('[Admin Check] Erro ao verificar admin:', error);
        return false;
    }
}

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
        const brokerId = searchParams.get('brokerId');
        const companyId = params.companyId;

        if (!companyId) {
            return NextResponse.json({
                success: false,
                error: 'Company ID não fornecido'
            }, { status: 400 });
        }

        console.log(`[API Detail] Buscando Company ${companyId} para broker ${brokerId || 'desconhecido'}`);

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

        // ✅ VERIFICAÇÃO SEGURA: Valida no servidor via API do Bitrix24
        const isAdmin = brokerId ? await checkIfUserIsAdmin(brokerId) : false;

        console.log(`[API Detail] Permissões - isOwner: ${isOwner}, isAdmin: ${isAdmin}`);

        // Busca Property Items vinculados
        let properties = [];
        try {
            const items = await callBitrixAPI('crm.item.list', {
                entityTypeId: parseInt(process.env.B24_PROPERTY_ENTITY_TYPE_ID || '0'),
                filter: {
                    COMPANY_ID: companyId
                },
                select: ['*']
            });

            properties = items || [];
        } catch (error) {
            console.warn(`[API Detail] Erro ao buscar imóveis: ${error}`);
        }

        // Se for criador ou admin, retorna TUDO
        if (isOwner || isAdmin) {
            return NextResponse.json({
                success: true,
                isOwner: true,
                isAdmin,
                company,
                properties,
                canEdit: true,
                canDelete: isAdmin
            });
        }

        // Se for outro corretor, retorna apenas dados públicos
        return NextResponse.json({
            success: true,
            isOwner: false,
            isAdmin: false,
            company: {
                ID: company.ID,
                TITLE: company.TITLE,
                DATE_CREATE: company.DATE_CREATE,
                COMMENTS: company.COMMENTS
            },
            properties: properties.map((p: any) => ({
                ID: p.ID,
                TITLE: p.TITLE
            })),
            canEdit: false,
            canDelete: false,
            message: 'Acesso restrito: Esta autorização foi criada por outro corretor'
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
