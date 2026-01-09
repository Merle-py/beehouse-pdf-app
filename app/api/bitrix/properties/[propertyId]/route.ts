import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI, validateUserToken } from '@/lib/bitrix/server-client';
import { extractBitrixCredentials } from '@/lib/utils/api-headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/bitrix/properties/[propertyId]
 * Busca dados de um imóvel específico
 * 
 * Headers (recomendado):
 *   X-Bitrix-Token: <accessToken>
 *   X-Bitrix-Domain: <domain>
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { propertyId: string } }
): Promise<NextResponse> {
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

        const propertyId = params.propertyId;
        const entityTypeId = process.env.B24_PROPERTY_ENTITY_TYPE_ID;

        if (!entityTypeId) {
            return NextResponse.json({
                success: false,
                error: 'B24_PROPERTY_ENTITY_TYPE_ID não configurado'
            }, { status: 500 });
        }

        console.log(`[API Properties/${propertyId}] Buscando imóvel...`);

        // Busca imóvel específico
        const response: any = await callBitrixAPI('crm.item.get', {
            entityTypeId: parseInt(entityTypeId),
            id: parseInt(propertyId)
        });

        if (!response) {
            return NextResponse.json({
                success: false,
                error: 'Imóvel não encontrado'
            }, { status: 404 });
        }

        console.log(`[API Properties/${propertyId}] Imóvel encontrado:`, response.item?.title);

        // Busca informações da empresa vinculada
        let company = null;
        if (response.item?.companyId) {
            const companiesResponse: any = await callBitrixAPI('crm.company.list', {
                filter: { ID: response.item.companyId },
                select: ['ID', 'TITLE', 'COMPANY_TYPE']
            });

            if (companiesResponse && companiesResponse.length > 0) {
                company = companiesResponse[0];
            }
        }

        // Formata os dados do imóvel
        const property = {
            id: response.item.id,
            title: response.item.title,
            companyId: response.item.companyId,
            companyName: company?.TITLE || '',
            companyType: company?.COMPANY_TYPE || '',
            ufCrmPropertyAddress: response.item.ufCrmPropertyAddress || '',
            ufCrmPropertyValue: response.item.ufCrmPropertyValue || '',
            ufCrmPropertyMatricula: response.item.ufCrmPropertyMatricula || '',
            ufCrmPropertyAdminCondominio: response.item.ufCrmPropertyAdminCondominio || '',
            ufCrmPropertyValorCondominio: response.item.ufCrmPropertyValorCondominio || '',
            ufCrmPropertyChamadaCapital: response.item.ufCrmPropertyChamadaCapital || '',
            ufCrmPropertyNumParcelas: response.item.ufCrmPropertyNumParcelas || '',
            ufCrmPropertyDescription: response.item.ufCrmPropertyDescription || '',
            createdTime: response.item.createdTime,
            updatedTime: response.item.updatedTime
        };

        return NextResponse.json({
            success: true,
            property
        }, { status: 200 });

    } catch (error: any) {
        console.error(`[API Properties/${params.propertyId}] Erro:`, error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro ao buscar imóvel',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * PATCH /api/bitrix/properties/[propertyId]
 * Atualiza dados de um imóvel
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { propertyId: string } }
): Promise<NextResponse> {
    try {
        const credentials = extractBitrixCredentials(request);

        if (!credentials) {
            return NextResponse.json({
                success: false,
                error: 'Credenciais Bitrix24 não fornecidas'
            }, { status: 401 });
        }

        const { accessToken, domain } = credentials;
        const body = await request.json();
        const updateData = body;

        // Valida o token do usuário
        const user = await validateUserToken(accessToken, domain);

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 401 });
        }

        const propertyId = params.propertyId;
        const entityTypeId = process.env.B24_PROPERTY_ENTITY_TYPE_ID;

        if (!entityTypeId) {
            return NextResponse.json({
                success: false,
                error: 'B24_PROPERTY_ENTITY_TYPE_ID não configurado'
            }, { status: 500 });
        }

        console.log(`[API Properties/${propertyId}] Atualizando imóvel...`);

        // Monta os campos para atualização
        const fields: any = {};

        if (updateData.endereco) fields.ufCrmPropertyAddress = updateData.endereco;
        if (updateData.valor) fields.ufCrmPropertyValue = updateData.valor;
        if (updateData.matricula) fields.ufCrmPropertyMatricula = updateData.matricula;
        if (updateData.administradora) fields.ufCrmPropertyAdminCondominio = updateData.administradora;
        if (updateData.valorCondominio) fields.ufCrmPropertyValorCondominio = updateData.valorCondominio;
        if (updateData.chamadaCapital) fields.ufCrmPropertyChamadaCapital = updateData.chamadaCapital;
        if (updateData.numeroParcelas) fields.ufCrmPropertyNumParcelas = updateData.numeroParcelas;
        if (updateData.descricao) fields.ufCrmPropertyDescription = updateData.descricao;

        // Atualiza imóvel no Bitrix24
        await callBitrixAPI('crm.item.update', {
            entityTypeId: parseInt(entityTypeId),
            id: parseInt(propertyId),
            fields
        });

        console.log(`[API Properties/${propertyId}] Imóvel atualizado com sucesso`);

        // Busca imóvel atualizado
        const response: any = await callBitrixAPI('crm.item.get', {
            entityTypeId: parseInt(entityTypeId),
            id: parseInt(propertyId)
        });

        return NextResponse.json({
            success: true,
            property: response.item
        }, { status: 200 });

    } catch (error: any) {
        console.error(`[API Properties/${params.propertyId}] Erro ao atualizar:`, error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro ao atualizar imóvel',
            details: error.message
        }, { status: 500 });
    }
}
