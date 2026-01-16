import { NextRequest, NextResponse } from 'next/server';

/**
 * Initiate Bitrix24 OAuth flow
 * Redirects user to Bitrix24 authorization page
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') || process.env.B24_DEFAULT_DOMAIN;

    if (!domain) {
        return NextResponse.json(
            { error: 'Domínio Bitrix24 não especificado' },
            { status: 400 }
        );
    }

    const clientId = process.env.B24_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/bitrix/callback`;

    const authUrl = new URL(`https://${domain}/oauth/authorize/`);
    authUrl.searchParams.set('client_id', clientId!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);

    return NextResponse.redirect(authUrl.toString());
}
