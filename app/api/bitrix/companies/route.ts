import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies } from '@/lib/bitrix/server-client';

/**
 * API Route: Busca de Empresas
 * 
 * GET /api/bitrix/companies?search=termo
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const searchTerm = searchParams.get('search');

        if (!searchTerm || searchTerm.length < 2) {
            return NextResponse.json({
                success: false,
                error: 'Termo de busca inválido (mínimo 2 caracteres)'
            }, { status: 400 });
        }

        console.log('[API Companies] Buscando:', searchTerm);

        const companies = await searchCompanies(searchTerm);

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
