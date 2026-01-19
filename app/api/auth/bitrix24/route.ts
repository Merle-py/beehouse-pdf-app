import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/bitrix24
 * 
 * Endpoint para autenticação via Bitrix24
 * Recebe dados do usuário do Bitrix24 e cria/atualiza usuário no Supabase
 * Cria uma sessão personalizada via cookie
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, domain, memberInfo } = body;

        console.log('[AUTH] Received auth request:', { userId, domain, memberInfo });

        if (!userId || !domain) {
            console.error('[AUTH] Missing userId or domain');
            return NextResponse.json(
                { error: 'userId and domain are required' },
                { status: 400 }
            );
        }

        // Usar service role client para bypass de RLS
        const { createClient: createServiceClient } = await import('@supabase/supabase-js');
        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        console.log('[AUTH] Checking if user exists:', userId);

        // 1. Verificar se usuário já existe na tabela users
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', parseInt(userId))
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[AUTH] Error fetching user:', fetchError);
            return NextResponse.json(
                { error: 'Error checking user', details: fetchError.message },
                { status: 500 }
            );
        }

        let user = existingUser;

        // 2. Se não existe, criar usuário
        if (!existingUser) {
            console.log('[AUTH] Creating new user:', userId);

            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    id: parseInt(userId),
                    name: memberInfo?.name || `User ${userId}`,
                    email: memberInfo?.email || `user${userId}@${domain}`,
                    password_hash: 'bitrix24-oauth', // Placeholder
                    bitrix_user_id: parseInt(userId),
                })
                .select()
                .single();

            if (insertError) {
                console.error('[AUTH] Error creating user:', insertError);
                return NextResponse.json(
                    { error: 'Error creating user', details: insertError.message, code: insertError.code },
                    { status: 500 }
                );
            }

            console.log('[AUTH] User created successfully:', newUser);
            user = newUser;
        } else {
            console.log('[AUTH] User already exists:', existingUser);
        }

        // 3. Criar cookie de sessão personalizado
        const sessionData = {
            userId: user.id,
            name: user.name,
            email: user.email,
            bitrixDomain: domain,
            timestamp: Date.now(),
        };

        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

        const response = NextResponse.json({
            success: true,
            user,
            message: existingUser ? 'User authenticated' : 'User created and authenticated',
        });

        // Definir cookie de sessão
        response.cookies.set('beehouse_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 dias
            path: '/',
        });

        console.log('[AUTH] Session cookie set successfully');

        return response;
    } catch (error: any) {
        console.error('[AUTH] Error in Bitrix24 auth:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
