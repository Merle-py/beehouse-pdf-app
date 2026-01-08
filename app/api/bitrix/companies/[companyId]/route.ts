import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/bitrix/companies/[companyId]
 * Busca dados de uma empresa específica
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { companyId: string } }
): Promise<NextResponse> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const accessToken = searchParams.get('accessToken');
        const domain = searchParams.get('domain');

        if (!accessToken || !domain) {
            return NextResponse.json({
                success: false,
                error: 'accessToken e domain são obrigatórios'
            }, { status: 400 });
        }

        // Valida o token do usuário
        const { validateUserToken } = await import('@/lib/bitrix/server-client');
        const user = await validateUserToken(accessToken, domain);

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 401 });
        }

        const companyId = params.companyId;

        console.log(`[API Companies/${companyId}] Buscando empresa...`);

        // Busca empresa específica
        const companies: any = await callBitrixAPI('crm.company.list', {
            filter: { ID: companyId },
            select: [
                'ID',
                'TITLE',
                'COMPANY_TYPE',
                'UF_CRM_*',
                'EMAIL',
                'PHONE',
                'CREATED_TIME'
            ]
        });

        if (!companies || companies.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Empresa não encontrada'
            }, { status: 404 });
        }

        const company = companies[0];

        return NextResponse.json({
            success: true,
            company
        }, { status: 200 });

    } catch (error: any) {
        console.error(`[API Companies/${params.companyId}] Erro:`, error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro ao buscar empresa',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * PATCH /api/bitrix/companies/[companyId]
 * Atualiza dados de uma empresa
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { companyId: string } }
): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { accessToken, domain, ...updateData } = body;

        if (!accessToken || !domain) {
            return NextResponse.json({
                success: false,
                error: 'accessToken e domain são obrigatórios'
            }, { status: 400 });
        }

        // Valida o token do usuário
        const { validateUserToken } = await import('@/lib/bitrix/server-client');
        const user = await validateUserToken(accessToken, domain);

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 401 });
        }

        const companyId = params.companyId;

        console.log(`[API Companies/${companyId}] Atualizando empresa...`);

        // Monta os campos para atualização
        const fields: any = {};

        if (updateData.nome) fields.TITLE = updateData.nome;
        if (updateData.tipo) fields.COMPANY_TYPE = updateData.tipo;
        if (updateData.cpfCnpj) fields.UF_CRM_CPF_CNPJ = updateData.cpfCnpj;
        if (updateData.email) {
            fields.EMAIL = [{ VALUE: updateData.email, VALUE_TYPE: 'WORK' }];
        }
        if (updateData.telefone) {
            fields.PHONE = [{ VALUE: updateData.telefone, VALUE_TYPE: 'WORK' }];
        }

        // Atualiza empresa no Bitrix24
        await callBitrixAPI('crm.company.update', {
            id: companyId,
            fields
        });

        console.log(`[API Companies/${companyId}] Empresa atualizada com sucesso`);

        // Busca empresa atualizada
        const companies: any = await callBitrixAPI('crm.company.list', {
            filter: { ID: companyId },
            select: [
                'ID',
                'TITLE',
                'COMPANY_TYPE',
                'UF_CRM_*',
                'EMAIL',
                'PHONE',
                'CREATED_TIME'
            ]
        });

        return NextResponse.json({
            success: true,
            company: companies[0]
        }, { status: 200 });

    } catch (error: any) {
        console.error(`[API Companies/${params.companyId}] Erro ao atualizar:`, error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro ao atualizar empresa',
            details: error.message
        }, { status: 500 });
    }
}
