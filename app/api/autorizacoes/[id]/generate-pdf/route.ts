import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAuthorizationPdf } from '@/lib/pdf/authorization-generator';
import { convertDbDataToPDFData, generatePdfFilename, type DbAutorizacaoCompleta } from '@/lib/pdf/db-to-pdf-converter';
import { uploadPdfToStorage } from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';

/**
 * POST /api/autorizacoes/[id]/generate-pdf
 * 
 * Generates PDF from an existing autorização in the database
 * 
 * Flow:
 * 1. Validate authentication and autorização access
 * 2. Fetch complete autorização data from vw_autorizacoes_completas
 * 3. Convert database data to PDF format
 * 4. Generate PDF buffer
 * 5. Upload PDF to Supabase Storage
 * 6. Update autorizacoes_vendas table with pdf_url and pdf_filename
 * 7. Return PDF for download
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const supabase = createClient();

        // 1. Validate authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID inválido' },
                { status: 400 }
            );
        }

        console.log(`[Generate PDF] Starting for autorização #${id}`);

        // 2. Fetch complete autorização data
        const { data: autorizacao, error: fetchError } = await supabase
            .from('vw_autorizacoes_completas')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !autorizacao) {
            console.error('[Generate PDF] Fetch error:', fetchError);
            return NextResponse.json(
                { error: 'Autorização não encontrada ou você não tem permissão' },
                { status: 404 }
            );
        }

        const dbData = autorizacao as unknown as DbAutorizacaoCompleta;

        console.log(`[Generate PDF] Found autorização for ${dbData.empresa_tipo === 'PJ' ? dbData.razao_social : dbData.empresa_nome}`);

        // 3. Convert database data to PDF format
        const pdfData = convertDbDataToPDFData(dbData);
        console.log(`[Generate PDF] Converted to PDF data, authType: ${pdfData.authType}`);

        // 4. Generate PDF buffer
        const pdfBuffer = await generateAuthorizationPdf(pdfData);
        console.log(`[Generate PDF] PDF generated, size: ${pdfBuffer.length} bytes`);

        // 5. Upload to Supabase Storage
        const filename = `${generatePdfFilename(dbData)}.pdf`;
        const pdfUrl = await uploadPdfToStorage(filename, pdfBuffer, user.id);
        console.log(`[Generate PDF] Uploaded to storage: ${pdfUrl}`);

        // 6. Update database with PDF URL
        const { error: updateError } = await supabase
            .from('autorizacoes_vendas')
            .update({
                pdf_url: pdfUrl,
                pdf_filename: filename,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('[Generate PDF] Database update error:', updateError);
            // Don't fail the request - PDF was generated successfully
            console.warn('[Generate PDF] Failed to update database, but PDF was generated');
        } else {
            console.log('[Generate PDF] Database updated with PDF URL');
        }

        // 7. Return PDF for download
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
                'X-PDF-URL': pdfUrl, // Include URL in header for frontend reference
            },
        });

    } catch (error: any) {
        console.error('[Generate PDF] Error:', error);
        return NextResponse.json(
            {
                error: 'Erro ao gerar PDF',
                details: error.message
            },
            { status: 500 }
        );
    }
}
