import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { downloadPdfFromStorage, uploadPdfToStorage } from '@/lib/supabase/storage';
import { uploadDocument, createSigner, createSignatureList, type SignerData } from '@/lib/clicksign/client';
import { generateAuthorizationPdf } from '@/lib/pdf/authorization-generator';
import { convertDbDataToPDFData, generatePdfFilename, type DbAutorizacaoCompleta } from '@/lib/pdf/db-to-pdf-converter';

export const dynamic = 'force-dynamic';

// Beehouse representative signer (from env)
const BEEHOUSE_SIGNER = {
    name: process.env.BEEHOUSE_SIGNER_NAME || 'Beehouse Representante',
    email: process.env.BEEHOUSE_SIGNER_EMAIL || 'representante@beehouse.com.br',
    cpf: process.env.BEEHOUSE_SIGNER_CPF || '00000000000',
};

/**
 * POST /api/autorizacoes/[id]/send-to-clicksign
 * 
 * Sends an autorização to ClickSign for signature
 * 
 * Flow:
 * 1. Validate authentication and autorização access
 * 2. Check if PDF exists, generate if not
 * 3. Fetch complete autorização data
 * 4. Download PDF from storage and convert to base64
 * 5. Upload document to ClickSign
 * 6. Create signers (empresa contact + Beehouse)
 * 7. Create signature list
 * 8. Update database with ClickSign keys and status
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

        console.log(`[Send to ClickSign] Starting for autorização #${id}`);

        // 2. Fetch complete autorização data
        const { data: autorizacao, error: fetchError } = await supabase
            .from('vw_autorizacoes_completas')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !autorizacao) {
            console.error('[Send to ClickSign] Fetch error:', fetchError);
            return NextResponse.json(
                { error: 'Autorização não encontrada ou você não tem permissão' },
                { status: 404 }
            );
        }

        const dbData = autorizacao as unknown as DbAutorizacaoCompleta;

        // Check if already sent to ClickSign
        if (dbData.status === 'assinado') {
            return NextResponse.json(
                { error: 'Esta autorização já foi assinada' },
                { status: 400 }
            );
        }

        // 3. Get or generate PDF
        let pdfUrl = autorizacao.pdf_url;
        let pdfBuffer: Buffer;

        if (!pdfUrl) {
            console.log('[Send to ClickSign] PDF not found, generating...');

            // Generate PDF
            const pdfData = convertDbDataToPDFData(dbData);
            pdfBuffer = await generateAuthorizationPdf(pdfData);

            // Upload to storage
            const filename = `${generatePdfFilename(dbData)}.pdf`;
            pdfUrl = await uploadPdfToStorage(filename, pdfBuffer, user.id);

            // Update database
            await supabase
                .from('autorizacoes_vendas')
                .update({ pdf_url: pdfUrl, pdf_filename: filename })
                .eq('id', id);

            console.log('[Send to ClickSign] PDF generated and uploaded');
        } else {
            console.log('[Send to ClickSign] Downloading existing PDF from storage');
            pdfBuffer = await downloadPdfFromStorage(pdfUrl);
        }

        // 4. Convert PDF to base64
        const pdfBase64 = pdfBuffer.toString('base64');

        // 5. Upload document to ClickSign
        const documentPath = `/Autorizacoes/autorizacao_${id}.pdf`;
        const expiresAt = dbData.prazo_exclusividade > 0
            ? new Date(Date.now() + dbData.prazo_exclusividade * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Default 90 days

        const document = await uploadDocument({
            path: documentPath,
            contentBase64: pdfBase64,
            deadlineAt: expiresAt,
            autoClose: true,
            locale: 'pt-BR',
        });

        console.log(`[Send to ClickSign] Document uploaded with key: ${document.key}`);

        // 6. Create signers
        // Empresa signer (PF or PJ representative)
        const empresaSigner: SignerData = dbData.empresa_tipo === 'PJ'
            ? {
                name: dbData.rep_legal_nome || dbData.razao_social || 'Representante',
                email: dbData.empresa_email || '',
                phoneNumber: dbData.empresa_telefone,
                documentation: dbData.rep_legal_cpf || dbData.cnpj || '',
            }
            : {
                name: dbData.empresa_nome || 'Contratante',
                email: dbData.empresa_email || '',
                phoneNumber: dbData.empresa_telefone,
                documentation: dbData.empresa_cpf || '',
            };

        const empresaSignerResponse = await createSigner(empresaSigner);

        // Beehouse signer
        const beehouseSignerResponse = await createSigner({
            name: BEEHOUSE_SIGNER.name,
            email: BEEHOUSE_SIGNER.email,
            documentation: BEEHOUSE_SIGNER.cpf,
        });

        console.log('[Send to ClickSign] Signers created');

        // 7. Create signature list
        const signatureList = await createSignatureList(document.key, [
            { key: empresaSignerResponse.key, signAs: 'sign' },
            { key: beehouseSignerResponse.key, signAs: 'sign' },
        ]);

        console.log('[Send to ClickSign] Signature list created');

        // 8. Update database
        const { error: updateError } = await supabase
            .from('autorizacoes_vendas')
            .update({
                clicksign_document_key: document.key,
                clicksign_request_signature_key: signatureList.key,
                clicksign_status: 'pending',
                status: 'aguardando_assinatura',
                expires_at: expiresAt,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (updateError) {
            console.error('[Send to ClickSign] Database update error:', updateError);
            return NextResponse.json(
                {
                    error: 'Documento enviado, mas falha ao atualizar banco de dados',
                    details: updateError.message
                },
                { status: 500 }
            );
        }

        console.log('[Send to ClickSign] Success! Autorização sent to ClickSign');

        return NextResponse.json({
            success: true,
            clicksign_document_key: document.key,
            status: 'aguardando_assinatura',
            message: 'Documento enviado para assinatura com sucesso',
            expires_at: expiresAt,
        });

    } catch (error: any) {
        console.error('[Send to ClickSign] Error:', error);
        return NextResponse.json(
            {
                error: 'Erro ao enviar para ClickSign',
                details: error.message
            },
            { status: 500 }
        );
    }
}
