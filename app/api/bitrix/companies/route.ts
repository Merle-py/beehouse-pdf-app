import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

/**
 * API Route: Lista/Busca de Empresas
 * 
 * GET /api/bitrix/companies - Lista todas as empresas
 * GET /api/bitrix/companies?search=termo - Busca empresas por termo
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const searchTerm = searchParams.get('search');
        const accessToken = searchParams.get('accessToken');
        const domain = searchParams.get('domain');

        // Valida autenticação
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

        console.log('[API Companies] Buscando empresas...', searchTerm ? `Termo: ${searchTerm}` : 'Todas');

        // Monta filtro de busca
        const filter: any = {};
        if (searchTerm && searchTerm.length >= 2) {
            filter['%TITLE'] = searchTerm;
        }

        // Busca empresas no Bitrix24
        const response: any = await callBitrixAPI('crm.company.list', {
            filter,
            select: [
                'ID',
                'TITLE',
                'COMPANY_TYPE',
                'UF_CRM_*', // Todos os campos customizados
                'EMAIL',
                'PHONE',
                'CREATED_TIME'
            ],
            order: { CREATED_TIME: 'DESC' }
        });

        const companies = response || [];

        console.log('[API Companies] Encontradas:', companies.length, 'empresas');

        return NextResponse.json({
            success: true,
            companies
        }, { status: 200 });

    } catch (error: any) {
        console.error('[API Companies] Erro:', error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro ao buscar empresas',
            details: error.message
        }, { status: 500 });
    }
}
