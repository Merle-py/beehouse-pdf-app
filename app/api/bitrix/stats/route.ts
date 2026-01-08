import { NextRequest, NextResponse } from 'next/server';
import { callBitrixAPI } from '@/lib/bitrix/server-client';

/**
 * GET /api/bitrix/stats
 * Retorna estatísticas do dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const accessToken = searchParams.get('accessToken');
        const domain = searchParams.get('domain');

        if (!accessToken || !domain) {
            return NextResponse.json(
                { error: 'accessToken e domain são obrigatórios' },
                { status: 400 }
            );
        }

        // Valida o token do usuário
        const { validateUserToken } = await import('@/lib/bitrix/server-client');
        const user = await validateUserToken(accessToken, domain);

        if (!user) {
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 401 }
            );
        }

        const entityTypeId = process.env.B24_PROPERTY_ENTITY_TYPE_ID;
        if (!entityTypeId) {
            return NextResponse.json(
                { error: 'B24_PROPERTY_ENTITY_TYPE_ID não configurado' },
                { status: 500 }
            );
        }

        console.log('[API Stats] Calculando estatísticas...');

        // Conta total de empresas (paginado)
        let totalCompanies = 0;
        let start = 0;
        let hasMore = true;

        while (hasMore && start < 1000) {
            const companiesResponse: any = await callBitrixAPI('crm.company.list', {
                select: ['ID'],
                start,
                limit: 50
            });
            const companies = companiesResponse || [];
            totalCompanies += companies.length;
            hasMore = companies.length === 50;
            start += 50;
        }

        console.log(`[API Stats] Total de empresas: ${totalCompanies}`);

        // Conta total de imóveis (paginado)
        let totalProperties = 0;
        start = 0;
        hasMore = true;

        while (hasMore && start < 1000) {
            const propertiesResponse: any = await callBitrixAPI('crm.item.list', {
                entityTypeId: parseInt(entityTypeId),
                select: ['id'],
                start,
                limit: 50
            });
            const properties = propertiesResponse?.items || [];
            totalProperties += properties.length;
            hasMore = properties.length === 50;
            start += 50;
        }

        console.log(`[API Stats] Total de imóveis: ${totalProperties}`);

        // Conta total de autorizações (empresas com PDF de autorização)
        // Busca empresas e verifica manualmente quais têm PDF válido
        let totalAuthorizations = 0;
        start = 0;
        hasMore = true;

        while (hasMore && start < 1000) {
            const companiesResponse: any = await callBitrixAPI('crm.company.list', {
                select: ['ID', 'UF_CRM_AUTHORIZATION_PDF'],
                start,
                limit: 50
            });
            const allCompanies = companiesResponse || [];

            // Conta apenas empresas com PDF válido (não vazio e não null)
            const companiesWithPDF = allCompanies.filter((company: any) => {
                const pdf = company.UF_CRM_AUTHORIZATION_PDF;
                return pdf && pdf.trim() !== '' && pdf !== 'null' && pdf !== 'undefined';
            });

            totalAuthorizations += companiesWithPDF.length;
            hasMore = allCompanies.length === 50;
            start += 50;
        }

        console.log(`[API Stats] Total de autorizações: ${totalAuthorizations}`);

        // Conta imóveis SEM autorização (nem PDF nem flag manual)
        // Para calcular pendentes corretamente
        let propertiesWithAuthorization = 0;
        start = 0;
        hasMore = true;

        while (hasMore && start < 1000) {
            const propertiesResponse: any = await callBitrixAPI('crm.item.list', {
                entityTypeId: parseInt(entityTypeId),
                select: ['id', 'ufCrm15_1767879091919'], // Campo customizado para flag manual (ID exato)
                start,
                limit: 50
            });
            const properties = propertiesResponse?.items || [];

            // Conta imóveis que têm flag de autorização manual marcada
            const withAuth = properties.filter((prop: any) => {
                const fieldValue = prop.ufCrm15_1767879091919;
                return fieldValue === 'Y' || fieldValue === true || fieldValue === '1' || fieldValue === 1;
            });

            propertiesWithAuthorization += withAuth.length;
            hasMore = properties.length === 50;
            start += 50;
        }

        console.log(`[API Stats] Imóveis com autorização manual: ${propertiesWithAuthorization}`);

        // Conta imóveis com arquivo de autorização assinado
        let propertiesWithSignedAuth = 0;
        start = 0;
        hasMore = true;

        while (hasMore && start < 1000) {
            const propertiesResponse: any = await callBitrixAPI('crm.item.list', {
                entityTypeId: parseInt(entityTypeId),
                select: ['id', 'ufCrm15_1767734105854'], // Campo de arquivo de autorização
                start,
                limit: 50
            });
            const properties = propertiesResponse?.items || [];

            // Conta imóveis que têm arquivo de autorização enviado
            const withFile = properties.filter((prop: any) => {
                const fileField = prop.ufCrm15_1767734105854;
                // Verifica se tem arquivo (não vazio, não null, não undefined)
                return fileField && fileField !== '' && fileField !== 'null' && fileField !== 'undefined';
            });

            propertiesWithSignedAuth += withFile.length;
            hasMore = properties.length === 50;
            start += 50;
        }

        console.log(`[API Stats] Imóveis com autorização assinada: ${propertiesWithSignedAuth}`);

        // Pendentes = Total de imóveis - (Autorizações com PDF + Autorizações manuais)
        const pendingAuthorizations = Math.max(0, totalProperties - totalAuthorizations - propertiesWithAuthorization);

        // Pendentes de assinatura = Imóveis com autorização - Imóveis com arquivo assinado
        const pendingSignatures = Math.max(0, (totalAuthorizations + propertiesWithAuthorization) - propertiesWithSignedAuth);

        return NextResponse.json({
            stats: {
                totalCompanies,
                totalProperties,
                totalAuthorizations: totalAuthorizations + propertiesWithAuthorization, // Total inclui ambos
                pendingAuthorizations,
                signedAuthorizations: propertiesWithSignedAuth,
                pendingSignatures
            }
        });

    } catch (error: any) {
        console.error('Erro ao buscar estatísticas:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar estatísticas', details: error.message },
            { status: 500 }
        );
    }
}
