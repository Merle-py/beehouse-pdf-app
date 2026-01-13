import { NextRequest, NextResponse } from 'next/server';
import { generateAuthorizationPdf } from '@/lib/pdf/authorization-generator';
import { convertFormDataToPDFData } from '@/lib/pdf/helpers';
import type { AuthorizationFormData, AuthorizationApiResponse } from '@/types/authorization';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

/**
 * API Route: Geração Direta de PDF de Autorização (Solução Paliativa)
 * 
 * Esta rota gera o PDF diretamente sem criar registros no Bitrix24.
 * É uma solução temporária para produção enquanto o sistema completo não está pronto.
 * 
 * Fluxo:
 * 1. Recebe dados do formulário
 * 2. Valida campos obrigatórios
 * 3. Gera PDF
 * 4. Retorna PDF como base64 para download
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthorizationApiResponse>> {
    try {
        console.log('[PDF API] Iniciando geração direta de PDF...');

        // 1. Parse dos dados
        const body = await request.json();
        const formData: AuthorizationFormData = body.formData || body;

        // 2. Validação básica
        if (!formData || !formData.authType) {
            return NextResponse.json({
                success: false,
                error: 'Dados inválidos: tipo de autorização é obrigatório'
            }, { status: 400 });
        }

        if (!formData.imovel || !formData.imovel.endereco || !formData.imovel.valor) {
            return NextResponse.json({
                success: false,
                error: 'Dados inválidos: dados do imóvel são obrigatórios'
            }, { status: 400 });
        }

        if (!formData.contrato || formData.contrato.prazo === undefined || formData.contrato.comissaoPct === undefined) {
            return NextResponse.json({
                success: false,
                error: 'Dados inválidos: dados do contrato são obrigatórios'
            }, { status: 400 });
        }

        // Validação específica por tipo
        if (formData.authType === 'pj') {
            if (!formData.empresa?.razaoSocial || !formData.empresa?.cnpj) {
                return NextResponse.json({
                    success: false,
                    error: 'Dados inválidos: razão social e CNPJ são obrigatórios para PJ'
                }, { status: 400 });
            }
            if (!formData.repLegal?.nome || !formData.repLegal?.cpf) {
                return NextResponse.json({
                    success: false,
                    error: 'Dados inválidos: dados do representante legal são obrigatórios para PJ'
                }, { status: 400 });
            }
        } else if (formData.authType === 'pf-casado') {
            if (!formData.contratante?.nome || !formData.contratante?.cpf) {
                return NextResponse.json({
                    success: false,
                    error: 'Dados inválidos: dados do contratante são obrigatórios'
                }, { status: 400 });
            }
            if (!formData.conjuge?.nome || !formData.conjuge?.cpf) {
                return NextResponse.json({
                    success: false,
                    error: 'Dados inválidos: dados do cônjuge são obrigatórios para PF Casado'
                }, { status: 400 });
            }
        } else if (formData.authType === 'socios') {
            if (!formData.socios || formData.socios.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Dados inválidos: pelo menos um sócio é obrigatório'
                }, { status: 400 });
            }
        } else {
            // PF Solteiro
            if (!formData.contratante?.nome || !formData.contratante?.cpf) {
                return NextResponse.json({
                    success: false,
                    error: 'Dados inválidos: dados do contratante são obrigatórios'
                }, { status: 400 });
            }
        }

        console.log('[PDF API] Dados validados. Tipo:', formData.authType);

        // 3. Gerar PDF
        let pdfBuffer: Buffer;
        let pdfFileName: string;

        try {
            const pdfData = convertFormDataToPDFData(formData);
            pdfBuffer = await generateAuthorizationPdf(pdfData);

            // Nome do arquivo baseado no tipo e timestamp
            const timestamp = Date.now();
            const tipoNome = formData.authType === 'pj'
                ? (formData.empresa?.razaoSocial ?? 'Empresa')
                : (formData.contratante?.nome ?? 'Autorizacao');

            pdfFileName = `Autorizacao_${tipoNome.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;

            console.log('[PDF API] PDF gerado com sucesso:', pdfFileName);
        } catch (error: any) {
            console.error('[PDF API] Erro ao gerar PDF:', error.message);
            return NextResponse.json({
                success: false,
                error: 'Erro ao gerar PDF de autorização',
                details: error.message
            }, { status: 500 });
        }

        // 4. Retornar PDF como Base64
        const pdfBase64 = pdfBuffer.toString('base64');

        console.log('[PDF API] Geração concluída com sucesso!');

        return NextResponse.json({
            success: true,
            pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
            pdfFileName
        }, { status: 200 });

    } catch (error: any) {
        console.error('[PDF API] Erro inesperado:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message
        }, { status: 500 });
    }
}
