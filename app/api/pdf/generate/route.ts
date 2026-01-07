import { NextRequest, NextResponse } from 'next/server';
import { generateAuthorizationPdf } from '@/lib/pdf/authorization-generator';
import type { PDFGenerationData } from '@/types/authorization';

/**
 * API Route: Geração de PDF (standalone)
 * 
 * POST /api/pdf/generate
 * 
 * Gera o PDF sem cadastrar no Bitrix24 (útil para preview/testes)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const pdfData: PDFGenerationData = await request.json();

        if (!pdfData || !pdfData.authType) {
            return NextResponse.json({
                success: false,
                error: 'Dados inválidos: authType é obrigatório'
            }, { status: 400 });
        }

        console.log('[API PDF] Gerando PDF standalone...');

        const pdfBuffer = await generateAuthorizationPdf(pdfData);
        const pdfFileName = `Autorizacao_Venda_Preview.pdf`;

        console.log('[API PDF] PDF gerado com sucesso');

        // Retorna o PDF como arquivo para download
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${pdfFileName}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('[API PDF] Erro:', error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro ao gerar PDF',
            details: error.message
        }, { status: 500 });
    }
}
