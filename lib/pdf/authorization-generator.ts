import ReactPDF from '@react-pdf/renderer';
import React from 'react';
import AuthorizationPDF from '@/components/pdf/AuthorizationPDF';
import type { PDFGenerationData } from '@/types/authorization';

/**
 * Formata valor como moeda
 */
export function formatCurrency(value?: number): string {
    if (!value || isNaN(value)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Gera o PDF de Autorização de Venda usando @react-pdf/renderer
 * @param data - Dados do formulário
 * @returns Buffer contendo o PDF gerado
 */
export async function generateAuthorizationPdf(data: PDFGenerationData): Promise<Buffer> {
    try {
        console.log('[PDF Generator] Gerando PDF com @react-pdf/renderer...');

        // Renderiza o componente React PDF para buffer
        const doc = React.createElement(AuthorizationPDF, { data }) as any;
        const pdfStream = await ReactPDF.renderToStream(doc);

        // Converter stream para buffer
        const chunks: Uint8Array[] = [];
        return new Promise((resolve, reject) => {
            pdfStream.on('data', (chunk) => chunks.push(chunk));
            pdfStream.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                console.log('[PDF Generator] PDF gerado com sucesso!');
                resolve(pdfBuffer);
            });
            pdfStream.on('error', reject);
        });
    } catch (error) {
        console.error('[PDF Generator] Erro ao gerar PDF:', error);
        throw error;
    }
}
