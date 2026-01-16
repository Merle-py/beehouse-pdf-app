import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for auth
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return NextResponse.json(
                { error: 'Perfil não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: profile.name,
                role: profile.role,
                bitrix_user_id: profile.bitrix_user_id,
            },
        });
    } catch (error) {
        console.error('Error getting user:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar usuário' },
            { status: 500 }
        );
    }
}
