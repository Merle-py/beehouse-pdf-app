import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI, getBitrixUser } from '@/lib/bitrix/server-client';

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
        const companyId = params.companyId;

        // Obtém parametros
        const { searchParams } = new URL(request.url);
        // "brokerId" aqui na verdade é o TOKEN de acesso passado pelo client
        const accessToken = searchParams.get('brokerId');
        const domain = searchParams.get('domain') || 'viver.bitrix24.com.br';

        if (!accessToken) {
            return NextResponse.json({ success: false, error: 'Token de acesso não fornecido' }, { status: 401 });
        }

        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Company ID não fornecido' }, { status: 400 });
        }

        // VALIDAÇÃO DE SEGURANÇA (NOVA)
        const currentUser = await getBitrixUser(accessToken, domain);

        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Sessão inválida ou expirada' }, { status: 401 });
        }

        const realUserId = currentUser.id;
        const isAdmin = currentUser.isAdmin;

        console.log(`[API Sec] User: ${realUserId} | Admin: ${isAdmin} | Solicitando: ${companyId}`);

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

        // Verifica ownership comparando ID com ID (agora correto)
        const isOwner = createdBy && String(createdBy) === String(realUserId);

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
