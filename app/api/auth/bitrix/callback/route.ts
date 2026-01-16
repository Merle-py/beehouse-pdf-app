import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// Force dynamic rendering for OAuth callback
export const dynamic = 'force-dynamic';

/**
 * Bitrix24 OAuth Callback
 * This endpoint handles the OAuth callback from Bitrix24
 * and creates/updates the user in Supabase Auth
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const domain = searchParams.get('domain');
        const memberId = searchParams.get('member_id');

        if (!code || !domain || !memberId) {
            return NextResponse.json(
                { error: 'Parâmetros OAuth incompletos' },
                { status: 400 }
            );
        }

        // Exchange code for access token
        const tokenResponse = await fetch(`https://${domain}/oauth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: process.env.B24_CLIENT_ID,
                client_secret: process.env.B24_CLIENT_SECRET,
                code,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Falha ao obter token do Bitrix24');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;

        // Get user info from Bitrix24
        const userInfoResponse = await fetch(
            `https://${domain}/rest/user.current.json?auth=${accessToken}`
        );

        if (!userInfoResponse.ok) {
            throw new Error('Falha ao obter informações do usuário');
        }

        const userInfo = await userInfoResponse.json();
        const bitrixUser = userInfo.result;

        const email = bitrixUser.EMAIL || `user${bitrixUser.ID}@bitrix24.local`;
        const name = `${bitrixUser.NAME} ${bitrixUser.LAST_NAME}`.trim();
        const isAdmin = bitrixUser.IS_ADMIN === 'Y';

        // Check if user already exists in Supabase
        const { data: existingProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('bitrix_user_id', bitrixUser.ID)
            .single();

        let userId: string;

        if (existingProfile) {
            // User exists, just update profile
            userId = existingProfile.id;

            await supabaseAdmin
                .from('user_profiles')
                .update({
                    name,
                    role: isAdmin ? 'admin' : 'broker',
                })
                .eq('id', userId);
        } else {
            // Create new user in Supabase Auth
            // Generate a random password (user won't use it)
            const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: randomPassword,
                email_confirm: true, // Auto-confirm since they're coming from Bitrix24
                user_metadata: {
                    name,
                    bitrix_user_id: bitrixUser.ID,
                    bitrix_domain: domain,
                },
            });

            if (authError || !authData.user) {
                throw new Error(`Falha ao criar usuário: ${authError?.message}`);
            }

            userId = authData.user.id;

            // Create user profile
            await supabaseAdmin.from('user_profiles').insert({
                id: userId,
                bitrix_user_id: bitrixUser.ID,
                name,
                role: isAdmin ? 'admin' : 'broker',
            });
        }

        // Generate Supabase session token
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
        });

        if (sessionError || !sessionData) {
            throw new Error('Falha ao gerar sessão');
        }

        // Redirect to app with session token
        const redirectUrl = new URL('/api/auth/callback', process.env.NEXT_PUBLIC_APP_URL!);
        redirectUrl.searchParams.set('token_hash', sessionData.properties.hashed_token);
        redirectUrl.searchParams.set('type', 'magiclink');

        return NextResponse.redirect(redirectUrl.toString());
    } catch (error: any) {
        console.error('Bitrix24 OAuth error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao autenticar com Bitrix24' },
            { status: 500 }
        );
    }
}
