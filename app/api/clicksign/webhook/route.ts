import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.CLICKSIGN_WEBHOOK_SECRET;

/**
 * Verify ClickSign webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
    if (!WEBHOOK_SECRET) {
        console.warn('[ClickSign Webhook] WARNING: CLICKSIGN_WEBHOOK_SECRET not configured');
        return true; // Allow in development
    }

    const hash = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    return hash === signature;
}

/**
 * POST /api/clicksign/webhook
 * 
 * Receives ClickSign webhook events and updates autorização status
 * 
 * Events:
 * - document.signed: All signers signed, document completed
 * - document.canceled: Document was canceled
 * - signer.signed: Individual signer completed signature
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // Get request body as text for signature verification
        const bodyText = await req.text();
        const signature = req.headers.get('x-clicksign-signature') || '';

        console.log('[ClickSign Webhook] Received event');

        // Verify signature
        if (!verifyWebhookSignature(bodyText, signature)) {
            console.error('[ClickSign Webhook] Invalid signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse body
        const payload = JSON.parse(bodyText);
        const event = payload.event;
        const eventData = event?.data;

        console.log(`[ClickSign Webhook] Event type: ${event?.name}`);
        console.log(`[ClickSign Webhook] Document key: ${eventData?.document?.key}`);

        if (!eventData?.document?.key) {
            console.error('[ClickSign Webhook] Missing document key');
            return NextResponse.json(
                { error: 'Missing document key' },
                { status: 400 }
            );
        }

        const documentKey = eventData.document.key;
        const supabase = createClient();

        // Find autorização by clicksign_document_key
        const { data: autorizacao, error: fetchError } = await supabase
            .from('autorizacoes_vendas')
            .select('id, status')
            .eq('clicksign_document_key', documentKey)
            .single();

        if (fetchError || !autorizacao) {
            console.error('[ClickSign Webhook] Autorização not found:', fetchError);
            return NextResponse.json(
                { error: 'Autorização not found' },
                { status: 404 }
            );
        }

        console.log(`[ClickSign Webhook] Found autorização #${autorizacao.id}`);

        // Handle different event types
        switch (event?.name) {
            case 'document.signed':
                console.log('[ClickSign Webhook] Document fully signed');

                await supabase
                    .from('autorizacoes_vendas')
                    .update({
                        status: 'assinado',
                        clicksign_status: 'signed',
                        signed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', autorizacao.id);

                console.log(`[ClickSign Webhook] Autorização #${autorizacao.id} marked as signed`);
                break;

            case 'document.canceled':
                console.log('[ClickSign Webhook] Document canceled');

                await supabase
                    .from('autorizacoes_vendas')
                    .update({
                        status: 'cancelado',
                        clicksign_status: 'canceled',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', autorizacao.id);

                console.log(`[ClickSign Webhook] Autorização #${autorizacao.id} marked as canceled`);
                break;

            case 'signer.signed':
                console.log('[ClickSign Webhook] Individual signer signed');

                // Update clicksign_status to track progress
                await supabase
                    .from('autorizacoes_vendas')
                    .update({
                        clicksign_status: 'partially_signed',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', autorizacao.id);

                console.log(`[ClickSign Webhook] Autorização #${autorizacao.id} partially signed`);
                break;

            default:
                console.log(`[ClickSign Webhook] Unhandled event type: ${event?.name}`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[ClickSign Webhook] Error:', error);
        return NextResponse.json(
            {
                error: 'Webhook processing error',
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/clicksign/webhook
 * 
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({
        status: 'ok',
        message: 'ClickSign webhook endpoint is active',
    });
}
