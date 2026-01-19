import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

        if (!userId || !domain) {
            return NextResponse.json(
                { error: 'userId and domain are required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // 1. Verificar se usuário já existe na tabela users
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', parseInt(userId))
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
            return NextResponse.json(
                { error: 'Error checking user' },
                { status: 500 }
            );
        }

        let user = existingUser;

        // 2. Se não existe, criar usuário
        if (!existingUser) {
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    id: parseInt(userId),
                    bitrix_domain: domain,
                    name: memberInfo?.name || `User ${userId}`,
                    email: memberInfo?.email || `user${userId}@${domain}`,
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating user:', insertError);
                return NextResponse.json(
                    { error: 'Error creating user' },
                    { status: 500 }
                );
            }

            user = newUser;
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

        return response;
    } catch (error: any) {
        console.error('Error in Bitrix24 auth:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
