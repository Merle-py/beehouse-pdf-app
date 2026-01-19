import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { getSupabaseClient } from '@/lib/supabase/dev-client';
import { convertDbDataToPDFData } from '@/lib/pdf/db-to-pdf-converter';
import { generateAuthorizationPdf } from '@/lib/pdf/authorization-generator';

// POST /api/autorizacoes/[id]/generate-pdf - Generate PDF from database
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient();

        const { user, response } = await getAuthenticatedUser();
        if (!user) return response!;

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        // Fetch complete authorization data from view
        const { data: autorizacao, error } = await supabase
            .from('vw_autorizacoes_completas')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !autorizacao) {
            return NextResponse.json(
                { error: 'Autorização não encontrada' },
                { status: 404 }
            );
        }

        // Can only generate PDF for non-draft status
        if (autorizacao.status === 'rascunho') {
            return NextResponse.json(
                { error: 'Não é possível gerar PDF de rascunho. Salve a autorização primeiro.' },
                { status: 400 }
            );
        }

        // Convert database data to PDF format
        const pdfData = convertDbDataToPDFData(autorizacao);

        // Generate PDF
        const pdfBuffer = await generateAuthorizationPdf(pdfData);

        // Return PDF
        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="autorizacao-${id}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        return NextResponse.json(
            { error: 'Erro ao gerar PDF' },
            { status: 500 }
        );
    }
}
